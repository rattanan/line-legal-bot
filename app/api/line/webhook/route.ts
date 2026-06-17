import { askGemini } from "@/lib/gemini";
import { replyMessage } from "@/lib/line";

const LINE_TEXT_LIMIT = 5000;
const GEMINI_FALLBACK_MESSAGE =
  "ขออภัยครับ ตอนนี้ระบบตอบคำถามยังมีปัญหาอยู่ กรุณาลองใหม่อีกครั้งครับ";

type LineWebhookEvent = {
  type: string;
  replyToken: string;
  message?: {
    type: string;
    text?: string;
  };
};

function toLineText(text: string) {
  const trimmed = text.trim();

  if (trimmed.length <= LINE_TEXT_LIMIT) {
    return trimmed;
  }

  return `${trimmed.slice(0, LINE_TEXT_LIMIT - 24)}\n\n(คำตอบยาวเกินไปเลยตัดจบไว้ตรงนี้)`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const events: LineWebhookEvent[] = body.events || [];

    if (!events.length) {
      return Response.json({ ok: true });
    }

    await Promise.all(
      events.map(async (event) => {
        if (event.type !== "message") {
          return;
        }

        if (event.message?.type !== "text" || !event.message.text) {
          return;
        }

        const question = event.message.text;

        const prompt = `

คุณเป็นผู้ช่วยกฎหมายไทยเบื้องต้น

กฎ:

ตอบเป็นภาษาไทย
ตอบขี้เล่น คุยสนุก มีอิโมจิได้บ้าง
หากไม่ทราบให้บอกว่าไม่ทราบ

คำถาม:
${question}
`;

        let replyText = GEMINI_FALLBACK_MESSAGE;

        try {
          const answer = await askGemini(prompt);
          replyText = answer
            ? toLineText(answer)
            : "ขออภัยครับ ตอนนี้ Gemini ยังไม่ส่งคำตอบกลับมา ลองถามใหม่อีกครั้งได้ไหมครับ";
        } catch (error) {
          console.error("Gemini API Error:", error);
        }

        await replyMessage(event.replyToken, replyText);
      })
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json({
      success: false,
    });
  }
}
