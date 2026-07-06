import { askGemini } from "@/lib/gemini";
import { getFAQData, FAQ } from "@/lib/faq";

const GEMINI_FALLBACK_MESSAGE =
  "ขออภัยครับ ตอนนี้ระบบตอบคำถามยังมีปัญหาอยู่ กรุณาลองใหม่อีกครั้งครับ";

/**
 * Search FAQ from MySQL database for matching question
 * @param question - User's question
 * @returns Matching FAQ entry or null if not found
 */
async function searchFAQ(question: string): Promise<FAQ | null> {
  try {
    const faqData = await getFAQData();
    
    // Simple exact or partial match search
    const matchedFAQ = faqData.find((faq) => {
      const questionLower = question.toLowerCase().trim();
      const faqQuestionLower = faq.question.toLowerCase().trim();
      return (
        questionLower === faqQuestionLower ||
        faqQuestionLower.includes(questionLower) ||
        questionLower.includes(faqQuestionLower)
      );
    });

    return matchedFAQ || null;
  } catch (error) {
    console.error("Error searching FAQ:", error);
    return null;
  }
}

/**
 * Generate answer using the bot logic:
 * 1. Search FAQ from MySQL first
 * 2. If matching FAQ is found, return FAQ answer
 * 3. If no FAQ match, call Gemini
 * 4. If Gemini fails, return fallback message
 * 
 * @param question - User's question
 * @returns Object containing reply text and source
 */
export async function generateAnswer(question: string): Promise<{
  reply: string;
  source: "mysql_faq" | "gemini" | "fallback";
}> {
  // Step 1: Search FAQ from MySQL
  const matchedFAQ = await searchFAQ(question);

  if (matchedFAQ) {
    return {
      reply: matchedFAQ.answer,
      source: "mysql_faq",
    };
  }

  // Step 2: No FAQ match, call Gemini
  try {
    const prompt = buildPrompt(question);
    const answer = await askGemini(prompt);

    if (answer) {
      return {
        reply: answer,
        source: "gemini",
      };
    }

    return {
      reply: GEMINI_FALLBACK_MESSAGE,
      source: "fallback",
    };
  } catch (error) {
    console.error("Gemini API Error:", error);

    return {
      reply: GEMINI_FALLBACK_MESSAGE,
      source: "fallback",
    };
  }
}

/**
 * Build prompt for Gemini with FAQ context
 * @param question - User's question
 * @returns Formatted prompt string
 */
function buildPrompt(question: string): string {
  // Fetch FAQ data from MySQL for context
  let faqContext = "";
  
  // We don't need to pass all FAQs to Gemini, just use it as context
  // The searchFAQ function already handles finding the best match
  // This prompt is for when no direct FAQ match is found

  return `
คุณเป็นผู้ช่วยกฎหมายไทยเบื้องต้น

กฎ:

ตอบเป็นภาษาไทย
ตอบขี้เล่น คุยสนุก มีอิโมจิได้บ้าง
หากไม่ทราบให้บอกว่าไม่ทราบ
${faqContext ? `\n\nข้อมูล FAQ (สำหรับอ้างอิง):\n${faqContext}` : ""}

คำถาม:
${question}
`;
}