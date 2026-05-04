import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateReviewSummary = async (mediaId, title, synopsis) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Act as an expert movie and TV show critic. Based on the following media title and synopsis, generate a synthetic but highly realistic and engaging "general consensus review summary" that sounds like an aggregation of top critic reviews. 
    Also, assign a sentiment score from 1.0 to 10.0 (10 being overwhelmingly positive masterpiece).
    Return the response as a JSON object exactly like this, with no markdown formatting around it (just the raw JSON string):
    { "summary": "The summary text...", "sentimentScore": 8.5 }
    
    Title: ${title}
    Synopsis: ${synopsis || 'No synopsis available.'}`;


    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handling potential markdown blocks)
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Gemini JSON output");
    
    const parsed = JSON.parse(jsonMatch[0]);

    // Save to DB
    const aiSummary = await prisma.aIReviewSummary.upsert({
      where: { mediaId: mediaId },
      update: {
        summaryText: parsed.summary,
        sentimentScore: parsed.sentimentScore,
        llmModelUsed: "gemini-2.0-flash",
        generatedAt: new Date()
      },
      create: {
        mediaId: mediaId,
        summaryText: parsed.summary,
        sentimentScore: parsed.sentimentScore,
        llmModelUsed: "gemini-2.0-flash"
      }
    });

    return aiSummary;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw error;
  }
};
