import { askGemini } from "@/lib/gemini";
import { getFAQData } from "@/lib/google-sheet";
import { replyMessage } from "@/lib/line";

export async function POST(req: Request) {
  const body = await req.json();

  const event = body.events?.[0];

  if (!event) {
    return Response.json({ ok: true });
  }

  if (event.type !== "message") {
    return Response.json({ ok: true });
  }

  if (event.message.type !== "text") {
    return Response.json({ ok: true });
  }

  const question = event.message.text;

  const faq = await getFAQData();

  const knowledge = faq
    .map((row) => `${row[0]} : ${row[1]}`)
    .join("\n");

  const prompt = `
คุณเป็นผู้ช่วยกฎหมายไทยเบื้องต้น

กฎการตอบ:
- ตอบจากข้อมูลอ้างอิงก่อน
- หากไม่พบข้อมูลที่เกี่ยวข้องในข้อมูลอ้างอิง ให้ตอบว่า
  "ขออภัยค่ะ ขณะนี้ยังไม่มีข้อมูลในฐานความรู้เกี่ยวกับเรื่องนี้"
- ห้ามเดาหรือแต่งข้อมูลกฎหมายขึ้นเอง
- หากไม่มั่นใจให้แจ้งว่าไม่ทราบ
- ตอบเป็นภาษาไทยสุภาพ

ข้อมูลอ้างอิง:

${knowledge}

คำถาม:
${question}
`;

  const answer = await askGemini(prompt);

  await replyMessage(
    event.replyToken,
    answer +
      "\n\n⚠️ ข้อมูลนี้เป็นเพียงข้อมูลกฎหมายเบื้องต้น ไม่ใช่คำปรึกษาทางกฎหมาย"
  );

  return Response.json({ success: true });
}