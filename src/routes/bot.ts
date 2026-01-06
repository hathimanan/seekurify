// src/routes/bot.ts
import express from "express";
import type { Request, Response } from "express";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../config/systemPrompt.ts";
import { getCybersecurityContent } from "../lib/knowledgeBase.ts";

const botRouter = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

botRouter.post("/ask", async (req: Request, res: Response) => {
  try {
    const { userQuestion, userLevel, format } = req.body;
    if (!userQuestion)
      return res.status(400).json({ error: "Question required." });

    const reference = getCybersecurityContent(userQuestion);

    const dynamicPrompt = `
${SYSTEM_PROMPT}

You are an AI cybersecurity assistant that not only answers user queries
but also decides if a special interactive widget should be shown in the UI.

Available widget types:
- "linkScanner": For scanning URLs or links.
- "quiz": For short cybersecurity quizzes.
- "stepByStep": For step-by-step tutorials or procedures.

Your response **MUST** be in JSON format as shown below:

{
  "answer": "Your clear explanation or answer to the question.",
  "widgetType": "null | linkScanner | quiz | stepByStep",
  "widgetData": {
     // depends on widgetType
     // For stepByStep: { steps: ["Step 1...", "Step 2..."] }
     // For quiz: { question: "Which is phishing?", options: ["A", "B", "C"] }
     // For linkScanner: {}
  },
  "suggestions": ["related question 1", "related question 2"]
}

User Level: ${userLevel || "Beginner"}
Requested Response Format: ${format || "concise"}

Important: If the requested response format is "detailed", strictly follow the DETAILED rules in the SYSTEM_PROMPT: produce at least three sections with markdown headings, each section should contain 2–3 paragraphs, and the total length should be 200–300 words.

Cybersecurity Reference: ${reference}
User Question: ${userQuestion}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: dynamicPrompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const rawResponse = completion.choices[0]?.message?.content?.trim();

    // 🧠 Attempt to parse structured JSON output
    let parsed;
    try {
      parsed = JSON.parse(rawResponse!);
    } catch {
      parsed = {
        answer: rawResponse || "Sorry, I couldn't parse the structured response.",
        widgetType: null,
        widgetData: {},
        suggestions: [],
      };
    }

    // If the user requested DETAILED format, validate and re-prompt once if needed
    let finalParsed = parsed;
    if ((format === 'detailed' || format === 'DETAILED') && parsed && parsed.answer) {
      const meetsDetailed = (ans: string) => {
        const wordCount = (ans.match(/\S+/g) || []).length;
        const headingCount = (ans.match(/^#{1,6}\s+/gm) || []).length;
        return wordCount >= 180 && headingCount >= 3;
      };

      if (!meetsDetailed(parsed.answer)) {
        const expandPrompt = `${dynamicPrompt}\n\nThe previous answer did not meet the DETAILED format requirements. Please expand the 'answer' field to include at least three sections with markdown headings, 2-3 paragraphs per section, and a total length of 200-300 words. Return the result in the same JSON schema.`;

        const retry = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: expandPrompt },
          ],
          max_tokens: 1200,
          temperature: 0.7,
        });

        const retryRaw = retry.choices[0]?.message?.content?.trim();
        try {
          finalParsed = JSON.parse(retryRaw!);
        } catch {
          finalParsed = {
            answer: retryRaw || parsed.answer,
            widgetType: parsed.widgetType || null,
            widgetData: parsed.widgetData || {},
            suggestions: parsed.suggestions || [],
          };
        }
      }
    }

    res.json(finalParsed);
  } catch (error: any) {
    console.error("Bot error:", error);
    res
      .status(500)
      .json({ error: "AI Bot failed. Please try again later." });
  }
});


export default botRouter;
