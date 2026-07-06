import { ai } from "@/lib/ai";
import { getFAQData, FAQ } from "@/lib/faq";
import { saveChatLog } from "@/lib/chat-log";

const FALLBACK_MESSAGE =
  "ขออภัย ระบบ AI ไม่สามารถให้บริการได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";

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

interface GenerateAnswerOptions {
  userId?: string;
}

/**
 * Generate answer using the bot logic:
 * 1. Search FAQ from MySQL first
 * 2. If matching FAQ is found, return FAQ answer
 * 3. If no FAQ match, call AI provider (with automatic failover)
 * 4. If AI fails, return fallback message
 *
 * @param question - User's question
 * @param options - Optional settings (userId for chat logging)
 * @returns Object containing reply text and source
 */
export async function generateAnswer(
  question: string,
  options: GenerateAnswerOptions = {}
): Promise<{
  reply: string;
  source: "mysql_faq" | "ai" | "fallback";
}> {
  // Step 1: Search FAQ from MySQL
  const matchedFAQ = await searchFAQ(question);

  if (matchedFAQ) {
    // Save chat log
    if (options.userId) {
      saveChatLog({
        userId: options.userId,
        question,
        answer: matchedFAQ.answer,
        source: "mysql_faq",
      });
    }

    return {
      reply: matchedFAQ.answer,
      source: "mysql_faq",
    };
  }

  // Step 2: No FAQ match, call AI provider with automatic failover
  try {
    const prompt = buildPrompt(question);
    const messages = [{ role: "user" as const, content: prompt }];
    const answer = await ai.chat(messages);

    if (answer) {
      // Save chat log
      if (options.userId) {
        saveChatLog({
          userId: options.userId,
          question,
          answer,
          source: "ai",
        });
      }

      return {
        reply: answer,
        source: "ai",
      };
    }

    // Save fallback chat log
    if (options.userId) {
      saveChatLog({
        userId: options.userId,
        question,
        answer: FALLBACK_MESSAGE,
        source: "fallback",
      });
    }

    return {
      reply: FALLBACK_MESSAGE,
      source: "fallback",
    };
  } catch (error) {
    console.error("AI Provider Error:", error);

    // Save fallback chat log on error
    if (options.userId) {
      saveChatLog({
        userId: options.userId,
        question,
        answer: FALLBACK_MESSAGE,
        source: "fallback",
      });
    }

    return {
      reply: FALLBACK_MESSAGE,
      source: "fallback",
    };
  }
}

/**
 * Build prompt for AI
 * @param question - User's question
 * @returns Formatted prompt string
 */
function buildPrompt(question: string): string {
  return `
คุณเป็นผู้ชาย เป็นผู้ช่วยที่ปรึกษาทางการเงินเบื้องต้น และผู้ช่วยด้านการไกล่เกลี่ยหนี้

บทบาทของคุณ:
- ช่วยอธิบายปัญหาหนี้ การเงิน การผ่อนชำระ และทางเลือกในการเจรจากับเจ้าหนี้
- ช่วยแนะนำแนวทางไกล่เกลี่ยอย่างเป็นกลาง ไม่เข้าข้างลูกหนี้หรือเจ้าหนี้
- ช่วยให้ผู้ใช้เข้าใจทางเลือก เช่น ขอผ่อนชำระ ขอปรับโครงสร้างหนี้ ขอเจรจาลดภาระ หรือเข้าสู่กระบวนการไกล่เกลี่ย
- หากเหมาะสม ให้แนะนำผู้ใช้ไปสมัครใช้งานระบบไกล่เกลี่ยออนไลน์ที่ https://ai-mediation.rattanan.dev

กฎการตอบ:
- ตอบเป็นภาษาไทย
- ไม่ตอบยาวเกินไป ให้สั้นกระชับ เข้าใจง่าย
- น้ำเสียงเป็นมิตร เข้าใจง่าย ให้กำลังใจ แต่ไม่ขายฝัน
- ให้รับฟัง ถามคำถามกลับอย่างสนใจ และไม่ด่วนสรุป ให้แนะนำแนวทางทีละข้อ
- ตอบแบบคุยกับคนจริง ๆ ไม่เป็นทางการเกินไป
- ใช้อิโมจิได้เล็กน้อย แต่ไม่เยอะ
- ห้ามบอกว่าปัญหาหนี้จะหายแน่นอน
- ห้ามให้คำแนะนำที่เสี่ยงผิดกฎหมาย
- หากไม่ทราบ ให้ตอบว่าไม่ทราบ และแนะนำให้ปรึกษาผู้เชี่ยวชาญ
- หากเป็นเรื่องกฎหมายเฉพาะคดี ให้บอกว่าเป็นข้อมูลเบื้องต้น ไม่ใช่คำปรึกษากฎหมายอย่างเป็นทางการ
- หากผู้ใช้มีหนี้ ค้างชำระ ถูกทวงหนี้ กำลังจะถูกฟ้อง หรืออยากเจรจากับเจ้าหนี้ ให้แนะนำให้เข้าสู่ระบบ ai-mediation.rattanan.dev เพื่อให้ระบบช่วยรวบรวมข้อมูลและเข้าสู่กระบวนการไกล่เกลี่ย

แนวทางการชวนใช้ระบบ:
- ชวนแบบสุภาพ ไม่ยัดเยียด
- อธิบายประโยชน์สั้น ๆ เช่น ระบบช่วยเตรียมข้อมูล นัดหมายผู้ไกล่เกลี่ย และช่วยหาทางออกที่เป็นธรรม
- ใส่ลิงก์นี้เท่านั้น: https://ai-mediation.rattanan.dev
คำถาม:
${question}
`;
}