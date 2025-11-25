import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult } from '../types';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing. Please set it in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * Uses Gemini 2.5 Flash with Google Search Grounding to find movie details.
 * This is efficient and ensures up-to-date information.
 */
export const searchMovieMetadata = async (title: string): Promise<SearchResult | null> => {
  try {
    // Note: When using googleSearch, we cannot use responseMimeType: "application/json" 
    // or responseSchema. We must request JSON in the prompt and parse the text manually.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find factual details for the movie titled "${title}". 
      
      Tasks:
      1. Find the official Rotten Tomatoes Tomatometer score (e.g., "95%"). Be persistent in finding this.
      2. Find a public URL for the movie's official poster or a representative still image.
      3. Find the director, release year, and a short plot summary in Korean.
      
      Return a VALID JSON object (no markdown formatting if possible) with the following keys:
      - title: The official title of the movie in Korean
      - director: Director's name in Korean
      - year: Release year (string)
      - plot: A short one-sentence plot summary in Korean
      - rottenTomatoesScore: Rotten Tomatoes score (e.g. "95%" or null if not found)
      - imageUrl: A valid URL for the movie poster or still image
      
      Ensure the output is strictly valid JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text;
    if (!text) return null;

    // Clean up markdown code blocks if present (e.g. ```json ... ```)
    text = text.replace(/```json\n?|\n?```/g, '').trim();

    // Attempt to find the first '{' and last '}' to extract JSON if there's extra text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(text) as SearchResult;
  } catch (error) {
    console.error("Error searching movie metadata:", error);
    return null;
  }
};

/**
 * Uses Gemini 3 Pro Preview with Thinking Mode to perform deep analysis.
 * This handles the "complex query" requirement.
 */
export const analyzeReview = async (title: string, userReview: string, rating: number): Promise<string> => {
  try {
    const prompt = `
      The user watched the movie "${title}" and gave it a ${rating}/5 star rating.
      Their review was: "${userReview}".
      
      Please provide a sophisticated, "film critic" style analysis of the user's perspective. 
      Connect their feedback to broader themes in the movie. 
      If their review is short, infer their taste and explain why this movie likely resonated (or didn't) with them based on the rating.
      Keep the tone insightful, slightly academic but accessible. Maximum 2 paragraphs.
      
      IMPORTANT: Provide the response in Korean (Hangul).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget for deep reasoning
      },
    });

    return response.text || "분석을 생성할 수 없습니다.";
  } catch (error) {
    console.error("Error analyzing review:", error);
    return "현재 AI 분석을 이용할 수 없습니다.";
  }
};