import { askGemini } from "@/lib/gemini";
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

const prompt = `

คุณเป็นผู้ช่วยกฎหมายไทยเบื้องต้น

กฎ:

ตอบเป็นภาษาไทย
ตอบขี้เล่น คุยสนุก มีอิโมจิได้บ้าง
หากไม่ทราบให้บอกว่าไม่ทราบ

คำถาม:
${question}
`;

const answer =
  await askGemini(prompt);

await replyMessage(
  event.replyToken,
  answer?.trim()
    ? answer
    : "Gemini ไม่ได้ส่งคำตอบกลับมา"
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