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
    if (!userQuestion) return res.status(400).json({ error: "Question required." });

    const reference = getCybersecurityContent(userQuestion);

    const dynamicPrompt = `
${SYSTEM_PROMPT}

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
      max_tokens: 500,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "Sorry, I don't have information on that topic.";
    res.json({ answer });
  } catch (error: any) {
    console.error("Bot error:", error);
    res.status(500).json({ error: "AI Bot failed. Please try again later." });
  }
});

export default botRouter;
