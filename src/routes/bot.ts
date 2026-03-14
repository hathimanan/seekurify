import express from "express";
import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Anthropic } from "@anthropic-ai/sdk";
import { completion } from "litellm";
import { SYSTEM_PROMPT } from "../config/systemPrompt.ts";
import { getCybersecurityContent } from "../lib/knowledgeBase.ts";
import OpenAI from "openai";
const botRouter = express.Router();

// ─────────────────────────────────────────────────────
//  AI KEY / PROVIDER DETECTION
//  The chatbot can run on either Google Gemini (via
//  GOOGLE_AI_API_KEY) or Anthropic/Claude (via
//  ANTHROPIC_API_KEY).  This makes it easier for folks who
//  only have one of the two keys to get the assistant
//  working.  If neither key is present we fall back to the
//  built‑in mock responses and return errors to the client.
// ─────────────────────────────────────────────────────

// read keys for every supported provider
const litellmApiKey = process.env.LITELLM_API_KEY;    // new provider (local or lightweight LLM)
const googleApiKey = process.env.GOOGLE_AI_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const litellmApiBase = process.env.LITELLM_API_BASE;

// determine which provider we're going to talk to; preference order: litellm -> google -> anthropic
let aiProvider: "litellm" | "google" | "anthropic" | "none" = "none";
if (litellmApiKey) {
  aiProvider = "litellm";
} else if (googleApiKey) {
  aiProvider = "google";
} else if (anthropicApiKey) {
  aiProvider = "anthropic";
} else {
  console.error("❌ No AI API key found. Set LITELLM_API_KEY, GOOGLE_AI_API_KEY or ANTHROPIC_API_KEY in your .env");
}

// create clients lazily
let genAI: any = null;
let anthropicClient: any = null;
if (aiProvider === "google") {
  genAI = new GoogleGenerativeAI(googleApiKey!);
}
if (aiProvider === "anthropic") {
  try {
    anthropicClient = new Anthropic({ apiKey: anthropicApiKey! }); // optional base URL for enterprise users
  } catch (e) {
    console.warn("⚠️ Failed to initialize Anthropic client", e);
    aiProvider = "none";
  }
}
// litellm uses the top-level `completion` function — no client object needed

// List of models to try in order - COMMON MODEL NAMES FOR GOOGLE API
// This array will be updated at runtime based on the key's available models.
let modelPriority: string[] = [
  "gemini-2.0-flash",       // initial defaults
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-pro",
  "gemini-pro-vision"
];

let currentModelName = modelPriority[0];
let model: any = null; // initialized lazily

const initGoogleModel = (name: string) => {
  if (genAI) {
    model = genAI.getGenerativeModel({ model: name });
    currentModelName = name;
  }
};

if (aiProvider === "google") {
  initGoogleModel(currentModelName);
}

const switchModel = (newModelName: string) => {
  currentModelName = newModelName;
  if (genAI) {
    model = genAI.getGenerativeModel({ model: newModelName });
    console.log(`🔄 Switched to model: ${newModelName}`);
  }
};

// Helper to update the priority list based on models returned by Google
const refreshGoogleModelPriority = (models: any[]) => {
  // keep only models that support generateContent (assume all listed do)
  const names = models.map(m => m.name).filter(Boolean) as string[];
  if (names.length > 0) {
    // simple heuristic: sort newest first by name length or containing "2.0" etc.
    names.sort((a, b) => b.localeCompare(a));
    modelPriority = names;
    console.log("🔁 Updated modelPriority:", modelPriority);
    // reset current model if it no longer exists
    if (!modelPriority.includes(currentModelName)) {
      currentModelName = modelPriority[0];
      initGoogleModel(currentModelName);
    }
  }
};

// Diagnose API key and list available models (or just log provider info)
const diagnoseAPI = async () => {
  try {
    let activeKey = litellmApiKey || googleApiKey || anthropicApiKey;
    console.log("🔍 Diagnosing AI provider configuration...");
    console.log(`📌 Provider selected: ${aiProvider}`);
    console.log(`📌 API Key present: ${activeKey ? "Yes ✓" : "No ✗"}`);

    if (!activeKey) {
      console.error(
        "❌ No API key found. Set one of LITELLM_API_KEY, GOOGLE_AI_API_KEY, or ANTHROPIC_API_KEY in your .env file"
      );
      return;
    }

    if (aiProvider === "google") {
      // Try to call ListModels on Google generative API
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${googleApiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          const models = data.models || [];
          console.log("✅ Available models on your API key:");
          models.forEach((m: any) => {
            console.log(`   - ${m.name}`);
          });
          refreshGoogleModelPriority(models);
          if (modelPriority.length === 0) {
            console.error("❌ No usable Google models detected for this API key.");
            if (litellmApiKey) {
              console.log("🔁 Falling back to litellm provider due to missing Google models.");
              aiProvider = "litellm";
            }
          }
        } else {
          console.error(`❌ API Error: ${response.status} ${response.statusText}`);
          const errorData = await response.json().catch(() => ({}));
          console.error("   Details:", errorData);
        }
      } catch (error) {
        console.warn(
          "⚠️ Could not list models:",
          error instanceof Error ? error.message : error
        );
      }
    } else if (aiProvider === "anthropic") {
      console.log("📌 Anthropic key detected; diagnostics not implemented.");
    } else if (aiProvider === "litellm") {
      console.log("📌 Litellm key detected; assuming local/embedded model.");
    }
  } catch (error) {
    console.error("Diagnosis error:", error);
  }
};

// Run diagnosis once on startup if any key is present
if (litellmApiKey || googleApiKey || anthropicApiKey) {
  diagnoseAPI().catch(console.error);
}

// ── Helpers (unchanged) ──────────────────────────────────────────────────────

const isDetailedFormat = (text: string) => {
  const headingCount   = (text.match(/## /g)  || []).length;
  const paragraphCount = (text.match(/\n\n/g) || []).length;
  return headingCount >= 3 && paragraphCount >= 3;
};

const safeJsonParse = (raw: string) => {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
};

const makeFallback = (raw: string) => ({
  answer:      raw,
  widgetType:  "null",
  widgetData:  {},
  suggestions: [],
});

// ── Provider-specific helpers ─────────────────────────────────────────────

const callLitellm = async (prompt: string): Promise<string> => {
  const client = new OpenAI({
    apiKey: litellmApiKey || "lm-studio",
    baseURL: litellmApiBase || "http://127.0.0.1:5174/v1",
  });

  const response = await client.chat.completions.create({
    model: process.env.LITELLM_MODEL || "google/gemma-3-1b",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content || "";
};

// Generic dispatcher that calls the appropriate provider based on aiProvider.
// simple Anthropic wrapper
const callAnthropic = async (prompt: string): Promise<string> => {
  if (!anthropicClient) {
    throw new Error("Anthropic client not initialized or key missing.");
  }
  // sdk's messages.create API
  const resp = await anthropicClient.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  // response structure: content is an array of content blocks
  const text = resp.content?.[0]?.type === "text" ? resp.content[0].text : "";
  return (text || "").toString();
};

const callAI = async (prompt: string): Promise<string> => {
  switch (aiProvider) {
    case "google":
      return callGemini(prompt);
    case "anthropic":
      return callAnthropic(prompt);
    case "litellm":
      return callLitellm(prompt);
    default:
      throw new Error("No AI provider configured. Please set an API key.");
  }
};

// ── Helper: call Google Gemini and return raw text ─────────────────────────

const callGemini = async (prompt: string): Promise<string> => {
  if (!googleApiKey) {
    throw new Error("Google AI API key is not configured. Check GOOGLE_AI_API_KEY environment variable.");
  }
  
  let quotaExceededError: string | null = null;
  
  const attemptWithModel = async (modelName: string, retryCount = 0): Promise<string | null> => {
    try {
      switchModel(modelName);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 1600,
        },
      });
      
      const text = result.response.text();
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }
      
      console.log(`✅ Success with model: ${modelName}`);
      return text.trim();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // If model not found, remove it from priority for future calls
      if (/404.*not found/i.test(errorMsg)) {
        console.warn(`⚠️ Model ${modelName} unavailable, pruning from list`);
        modelPriority = modelPriority.filter(m => m !== modelName);
        if (modelPriority.length === 0 && litellmApiKey) {
          // switch provider if we have litellm
          console.log("🔁 No google models left; switching to litellm provider");
          aiProvider = "litellm";
          return null;
        }
        return null;
      }
      
      // If free tier quota is exhausted, don't retry - mark for fallback
      if (isFreeQuotaExceeded(errorMsg)) {
        quotaExceededError = errorMsg;
        console.warn(`⏳ FREE TIER QUOTA EXHAUSTED on ${modelName}`);
        console.warn(`   Switching to fallback mock responses`);
        return null; // Don't retry
      }
      
      // Handle rate limiting (429) with retry (but only if not free tier quota)
      if (errorMsg.includes("429") || errorMsg.includes("quota")) {
        const retryAfter = extractRetryAfter(errorMsg) || (Math.pow(2, retryCount) * 2);
        console.warn(`⏳ Rate limited on ${modelName}. Retry in ${retryAfter}s (attempt ${retryCount + 1}/3)`);
        
        if (retryCount < 2 && retryAfter < 10) { // Only retry if wait time is reasonable (< 10s)
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return attemptWithModel(modelName, retryCount + 1);
        } else {
          console.error(`❌ Failed with ${modelName}: Rate limit too severe`);
          return null;
        }
      }
      
      console.error(`❌ Failed with ${modelName}: ${errorMsg}`);
      return null;
    }
  };
  
  // Try each model in priority order
  for (const modelName of [...modelPriority]) { // copy in case we prune inside
    console.log(`🔍 Attempting with model: ${modelName}`);
    const result = await attemptWithModel(modelName);
    if (result) {
      return result;
    }
  }
  
  // If we switched to litellm while looping, delegate
  if (aiProvider === "litellm") {
    return callLitellm(prompt);
  }
  
  // If free tier quota is exhausted, use fallback
  if (quotaExceededError) {
    throw new Error("FALLBACK_MODE");
  }
  
  // If all models fail and no other provider, throw error
  throw new Error(`All available models failed. Tried: ${modelPriority.join(", ")}`);
};

// Helper: Extract retry-after time from error message
const extractRetryAfter = (errorMsg: string): number | null => {
  const match = errorMsg.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  return match ? Math.ceil(parseFloat(match[1])) : null;
};

// Fallback mock responses for when API is unavailable (free tier quota exceeded)
const getMockResponse = (userQuestion: string): any => {
  const question = userQuestion.toLowerCase();
  
  const mockDatabase: { [key: string]: any } = {
    "safe": {
      answer: `## Current Safety Assessment\n\nTo determine if you're safe right now, check these key security indicators:\n\n### Immediate Actions\n1. Check your active login sessions\n2. Review recent password changes\n3. Verify no unusual device access\n\n### Long-term Protection\n1. Enable two-factor authentication on all accounts\n2. Use a password manager to store unique passwords\n3. Keep your devices updated with the latest security patches\n\n⚠️ **Note:** This is a demo response. Upgrade your API plan for real-time analysis.`,
      widgetType: "null",
      widgetData: {},
      suggestions: ["What should I do if my account was breached?", "How do I enable 2FA?", "What are the best password practices?"]
    },
    "password": {
      answer: `## Creating a Strong Password\n\nA strong password should have:\n\n### Requirements\n- **Minimum 12 characters** (longer is better)\n- **Mix of character types**: uppercase, lowercase, numbers, symbols\n- **Avoid personal information** like birthdays or names\n- **Never reuse passwords** across different sites\n\n### Examples of Strong Passwords\n- Tr0pic@lSunsetM!gration#2024\n- BlueMoon$Butterfly#42Journey\n- Phoenix&Thunder*Volcano~2025\n\n### Password Manager Tools\nUse tools like Bitwarden, 1Password, or Dashlane to generate and store passwords securely.\n\n⚠️ **Note:** This is a demo response. Upgrade your API plan for personalized advice.`,
      widgetType: "null",
      widgetData: {},
      suggestions: ["What is two-factor authentication?", "How do I store passwords safely?", "What is phishing?"]
    },
    "phishing": {
      answer: `## Understanding Phishing Attacks\n\nPhishing is a social engineering attack where criminals impersonate trusted sources to steal sensitive information.\n\n### How Phishing Works\n1. Attacker sends a deceptive email or message\n2. The message appears to come from a legitimate company\n3. You're tricked into clicking a malicious link or downloading malware\n4. Your credentials or personal data is stolen\n\n### How to Spot Phishing\n- **Check the sender's email address** - slight misspellings are common\n- **Look for urgency** - \"Act now!\" or \"Your account will be closed!\"\n- **Hover over links** - the URL should match the supposed sender\n- **Check for grammar mistakes** - legitimate companies proofread\n\n### Protection Tips\n1. Never click links in unsolicited emails\n2. Go directly to the website instead of using email links\n3. Enable email filtering and security tools\n4. Report suspicious emails to the company\n\n⚠️ **Note:** This is a demo response. Upgrade your API plan for real-time threat detection.`,
      widgetType: "null",
      widgetData: {},
      suggestions: ["What is social engineering?", "How do I report phishing?", "What are common cyber threats?"]
    },
  };
  
  // Find best matching response
  for (const [key, response] of Object.entries(mockDatabase)) {
    if (question.includes(key)) {
      return response;
    }
  }
  
  // Default fallback
  return {
    answer: `## Cybersecurity Guidance\n\nI'm currently in demo mode because the AI service quota has been exceeded.\n\n### Your Question\n"${userQuestion}"\n\n### What to Do\n1. **Upgrade your API plan** at https://ai.google.dev/pricing\n2. **Add billing information** to get production access\n3. **Restart the server** after upgrading\n\n### In the meantime:\nUse these general security practices:\n- Enable two-factor authentication\n- Use strong, unique passwords\n- Keep software updated\n- Be cautious of suspicious emails\n\n📚 **Learn more:** Visit https://seekurify.com for comprehensive cybersecurity guidance.`,
    widgetType: "null",
    widgetData: {},
    suggestions: ["How do I create a strong password?", "What is phishing?", "What is two-factor authentication?"]
  };
};

// Check if we should use fallback (free tier quota exceeded)
const isFreeQuotaExceeded = (errorMsg: string): boolean => {
  return (
    errorMsg.includes("429") &&
    errorMsg.includes("free_tier") &&
    errorMsg.includes("limit: 0")
  );
};

// ── Route ────────────────────────────────────────────────────────────────────

botRouter.post("/ask", async (req: Request, res: Response) => {
  const { userQuestion, userLevel, format, securityContext } = req.body;

  try {
    console.log("📨 Bot request received:", { userQuestion: userQuestion?.substring(0, 50), userLevel, format, hasContext: !!securityContext });
    console.log(`🔧 Selected AI provider: ${aiProvider}`);

    if (!userQuestion || !userQuestion.trim()) {
      return res.status(400).json({ error: "Question required." });
    }

    const reference = getCybersecurityContent(userQuestion);

    const FORMAT_RULES = `
==================== FORMATTING RULES ====================
You MUST format the "answer" based on the 'format' parameter:

1. bullet
   - Use "-" bullets
   - 4-8 bullets
   - No paragraphs

2. numbered
   - Use "1. 2. 3."
   - At least 3 points

3. paragraph
   - 2-3 paragraphs
   - Each paragraph 3-5 sentences

4. concise
   - Max 2-3 sentences
   - No bullets

5. detailed
   - 3+ markdown headings (## Heading)
   - Each heading has 2-3 paragraphs
   - 200-300 words
   - No bullets
==========================================================
`;

    const contextBlock = securityContext
      ? `\n${securityContext}\n`
      : "";

    const dynamicPrompt = `
${FORMAT_RULES}
${contextBlock}
YOUR TASK:
Return ONLY a valid JSON object - no markdown fences, no explanation outside JSON.

Schema:
{
  "answer": "formatted text",
  "widgetType": "null | linkScanner | quiz | stepByStep",
  "widgetData": {},
  "suggestions": ["related question 1", "related question 2"]
}

User Level: ${userLevel || "Beginner"}
Requested Format: ${format || "concise"}
Reference Context: ${reference}
User Question: ${userQuestion}

FOLLOW THE FORMAT RULES EXACTLY. Return ONLY the JSON object.
`;

    // ── 1) Primary call ──────────────────────────────────────────────────────
    let raw = "";
    let parsed: any = null;
    let usedFallback = false;
    
    try {
      raw = await callAI(dynamicPrompt);
      parsed = safeJsonParse(raw);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // If in fallback mode, use mock responses
      if (errorMsg === "FALLBACK_MODE") {
        console.log("🎭 Using fallback mock responses...");
        parsed = getMockResponse(userQuestion);
        usedFallback = true;
      } else {
        throw error;
      }
    }

    if (!parsed || typeof parsed.answer !== "string") {
      parsed = makeFallback(raw);
    }

    // ── 2) Detailed format validation + retry ────────────────────────────────
    let finalParsed = parsed;

    if (format === "detailed" && !isDetailedFormat(parsed.answer) && !usedFallback) {
      const expandPrompt = `
The previous answer did NOT meet detailed formatting rules.
Rewrite and expand ONLY the "answer" field to follow:

- 3 markdown headings minimum (## Heading)
- 2-3 paragraphs per heading
- 200-300 words total
- No bullet points

Original answer to expand:
${parsed.answer}

Return ONLY a JSON object with this schema (no markdown fences):
{
  "answer": "expanded text here",
  "widgetType": "${parsed.widgetType || "null"}",
  "widgetData": {},
  "suggestions": ${JSON.stringify(parsed.suggestions || [])}
}
`;

      try {
        const retryRaw = await callAI(expandPrompt);
        const retryParsed = safeJsonParse(retryRaw);

        if (retryParsed && typeof retryParsed.answer === "string") {
          finalParsed = retryParsed;
        }
      } catch (retryError) {
        const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
        if (retryMsg === "FALLBACK_MODE") {
          // Stay with original response in fallback mode
          console.log("⚠️ Retry also in fallback mode, using original response");
        } else {
          throw retryError;
        }
      }
    }

    console.log("✅ Bot response:", { answer: finalParsed.answer?.substring(0, 50), widgetType: finalParsed.widgetType });
    if (usedFallback) {
      console.log("⚠️ This response was generated from fallback mock data (API quota exceeded)");
    }
    res.json(finalParsed);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("❌ Bot error:", errorMessage);
    console.error("Full error:", err);
    
    // Provide helpful diagnostics
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      console.error("\n🔴 QUOTA EXCEEDED:");
      console.error("   Your free tier daily/monthly quota has been exceeded.");
      console.error("   Options:");
      console.error("   1. Upgrade to a PAID plan:");
      console.error("      https://ai.google.dev/pricing");
      console.error("   2. Wait for quota to reset (24-30 days for free tier)");
      console.error("   3. Use a different API key from another Google account");
      console.error("   4. See usage at: https://ai.dev/rate-limit");
      
      return res.status(429).json({
        error: "API quota exceeded. Using demo mode to respond.",
        response: getMockResponse(userQuestion),
        details: process.env.NODE_ENV === "development" 
          ? "Free tier quota exceeded. Visit https://ai.google.dev/pricing to upgrade."
          : undefined,
      });
    }
    
    if (errorMessage.includes("All available models failed")) {
      console.error("\n🔴 DIAGNOSTICS:");
      console.error("   1. Your API key may not have access to Google Generative AI models");
      console.error("   2. Check if you're using the correct API key from:");
      console.error("      https://aistudio.google.com/app/apikey");
      console.error("   3. If you have an Anthropic (Claude) key instead, a different implementation is needed");
      console.error("   4. You can also provide LITELLM_API_KEY to run a local/lightweight model");
      console.error("   5. Run the server with fresh env vars: npm run dev");
      return res.status(500).json({
        error: "AI service unavailable. Using demo mode to respond.",
        response: getMockResponse(userQuestion),
        details: process.env.NODE_ENV === "development" 
          ? "No compatible AI models available. Verify your API key and permissions, or set LITELLM_API_KEY for an alternative."
          : undefined,
      });
    }
    
    if (errorMessage.includes("API key")) {
      return res.status(500).json({
        error: "Server configuration error: AI provider key not configured. Check your environment variables.",
      });
    }
    
    return res.status(500).json({
      error: "AI Bot failed. Using demo mode to respond.",
      response: getMockResponse(userQuestion),
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
});

export default botRouter;