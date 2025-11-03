// src/routes/bot.ts
import express from "express";
import type { Request, Response } from "express";
import OpenAI from "openai";
import SYSTEM_PROMPT from "../config/systemPrompt.ts";
import { getCybersecurityContent } from "../lib/knowledgeBase.ts";

const botRouter = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

botRouter.post("/ask", async (req: Request, res: Response) => {
  try {
    const { userQuestion, userLevel } = req.body;
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

    res.json(parsed);
  } catch (error: any) {
    console.error("Bot error:", error);
    res
      .status(500)
      .json({ error: "AI Bot failed. Please try again later." });
  }
});


export default botRouter;
