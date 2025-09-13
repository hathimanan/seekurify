// src/routes/bot.ts
import express, { Request, Response } from "express";
import { SYSTEM_PROMPT } from "../config/systemPrompt";
import OpenAI from "openai";

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { userQuestion, userLevel } = req.body;

    if (!userQuestion) {
      return res.status(400).json({ error: "User question is required." });
    }

    // Build dynamic prompt
    const dynamicPrompt = `
${SYSTEM_PROMPT}

User Level: ${userLevel || "Beginner"}
User Question: ${userQuestion}
`;

    // Call LLM
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // swap with GPT-5 or any supported model
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: dynamicPrompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";

    res.json({ answer });
  } catch (error: any) {
    console.error("❌ Bot error:", error);
    res.status(500).json({ error: "AI Bot failed. Please try again later." });
  }
});

export default router;
