// src/routes/bot.ts
import express from "express";
import type { Request, Response } from "express";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../config/systemPrompt.ts";
import { getCybersecurityContent } from "../lib/knowledgeBase.ts";

const botRouter = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Safely parse JSON with fallback
const safeParseRetry = (response: any, fallback: any) => {
  try {
    const raw = response?.choices?.[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(raw);
    if (typeof parsed.answer === "string") {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
};
const [isDetailedFormat, safeJsonParse, makeFallback] = [
  // Check if text meets detailed format rules
  (text: string) => { 
    const headingCount = (text.match(/## /g) || []).length;
    const paragraphCount = (text.match(/\n\n/g) || []).length;
    return headingCount >= 3 && paragraphCount >= 3;
  },
  // Safely parse JSON
  (raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  // Create fallback JSON
  (raw: string) => {
    return {
      answer: raw,
      widgetType: "null",
      widgetData: {},
      suggestions: []
    };
  }
];


botRouter.post("/ask", async (req: Request, res: Response) => {
  try {
    const { userQuestion, userLevel, format } = req.body;

    if (!userQuestion || !userQuestion.trim()) {
      return res.status(400).json({ error: "Question required." });
    }

    const reference = getCybersecurityContent(userQuestion);

    // 🔥 Strict formatting rules passed to model
    const FORMAT_RULES = `
==================== FORMATTING RULES ====================
You MUST format the "answer" based on the 'format' parameter:

1. bullet
   - Use "-" bullets
   - 4–8 bullets
   - No paragraphs

2. numbered
   - Use "1. 2. 3."
   - At least 3 points

3. paragraph
   - 2–3 paragraphs
   - Each paragraph 3–5 sentences

4. concise
   - Max 2–3 sentences
   - No bullets

5. detailed
   - 3+ markdown headings (## Heading)
   - Each heading has 2–3 paragraphs
   - 200–300 words
   - No bullets
==========================================================
`;

    const dynamicPrompt = `
${SYSTEM_PROMPT}

${FORMAT_RULES}

YOUR TASK:
Return ONLY a JSON object in this schema:

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

FOLLOW THE FORMAT RULES EXACTLY.
`;

    // -----------------------------
    // 1) Primary Model Request
    // -----------------------------
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: dynamicPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.7
    });

    const raw = response?.choices?.[0]?.message?.content?.trim() || "";

    // Try parsing JSON safely
    let parsed = safeJsonParse(raw);

    // If parsing failed, create fallback
    if (!parsed || typeof parsed.answer !== "string") {
      parsed = makeFallback(raw);
    }

    // -----------------------------
    // 2) If detailed formatting requested — validate
    // -----------------------------
    let finalParsed = parsed;

    if (format === "detailed") {
      if (!isDetailedFormat(parsed.answer)) {
        const expandPrompt = `
The previous answer did NOT meet detailed formatting rules.
Rewrite and expand ONLY the "answer" field to follow:

- 3 markdown headings minimum
- 2–3 paragraphs per heading
- 200–300 words
- No bullet points

Return ONLY JSON in the original schema.
`;

        // Retry expansion
        const retry = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: expandPrompt }
          ],
          max_tokens: 1600,
          temperature: 0.7
        });

        finalParsed = safeParseRetry(retry, parsed);
      }
    }

    // -----------------------------
    // Send the final valid JSON
    // -----------------------------
    res.json(finalParsed);

  } catch (err) {
    console.error("Bot error:", err);
    return res.status(500).json({
      error: "AI Bot failed. Please try again later."
    });
  }
});



export default botRouter;
