import { askGemini } from "@/lib/gemini";
import { getFAQData } from "@/lib/google-sheet";
import { replyMessage } from "@/lib/line";

export async function POST(req: Request) {
try {
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

let knowledge = "";

try {
  const faq = await getFAQData();

  knowledge = faq
    .map((row) => `${row[0]} : ${row[1]}`)
    .join("\n");
} catch (error) {
  console.error("Google Sheet Error:", error);
}

const prompt = `

คุณเป็นผู้ช่วยกฎหมายไทยเบื้องต้น

กฎการตอบ:

ตอบเป็นภาษาไทย
ใช้ข้อมูลอ้างอิงเป็นหลัก
หากไม่พบข้อมูลที่เกี่ยวข้อง ให้ตอบว่า "ขออภัยค่ะ ขณะนี้ยังไม่มีข้อมูลในฐานความรู้เกี่ยวกับเรื่องนี้"
ห้ามแต่งข้อมูลกฎหมายขึ้นเอง
หากไม่มั่นใจให้ตอบว่าไม่ทราบ
ตอบไม่เกิน 500 ตัวอักษร

ข้อมูลอ้างอิง:
${knowledge}

คำถาม:
${question}
`;

let answer = "";

try {
  answer = await askGemini(prompt);
} catch (error) {
  console.error("Gemini Error:", error);
}

const finalAnswer =
  answer?.trim()
    ? answer
    : "ขออภัยค่ะ ขณะนี้ยังไม่มีข้อมูลในฐานความรู้เกี่ยวกับเรื่องนี้";

await replyMessage(
  event.replyToken,
  `${finalAnswer}

⚠️ ข้อมูลนี้เป็นเพียงข้อมูลกฎหมายเบื้องต้น ไม่ใช่คำปรึกษาทางกฎหมาย`
);

return Response.json({ success: true });

} catch (error) {

console.error("Webhook Error:", error);

try {
  const body = await req.json();

  const event = body.events?.[0];

  if (event?.replyToken) {
    await replyMessage(
      event.replyToken,
      "ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง"
    );
  }
} catch {}

return Response.json({
  success: false,
});

}
}