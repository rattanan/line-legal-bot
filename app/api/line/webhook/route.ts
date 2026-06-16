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

ข้อกำหนด:
- ตอบเป็นภาษาไทย
- ไม่ฟันธงผลคดี
- ไม่ให้คำแนะนำหลีกเลี่ยงกฎหมาย
- หากข้อมูลไม่เพียงพอให้แนะนำปรึกษาทนาย

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