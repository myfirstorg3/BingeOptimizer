import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateReviewSummary = async (mediaId, reviewsText) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = `Analyze the following reviews for a movie/tv show and provide a concise, engaging summary of the general consensus. 
    Also, determine a sentiment score from 1.0 to 10.0 (10 being overwhelmingly positive).
    Return the response as a JSON object exactly like this:
    { "summary": "The summary text...", "sentimentScore": 8.5 }
    
    Reviews:
    ${reviewsText}`;

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
        llmModelUsed: "gemini-1.5-pro-latest",
        generatedAt: new Date()
      },
      create: {
        mediaId: mediaId,
        summaryText: parsed.summary,
        sentimentScore: parsed.sentimentScore,
        llmModelUsed: "gemini-1.5-pro-latest"
      }
    });

    return aiSummary;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw error;
  }
};
