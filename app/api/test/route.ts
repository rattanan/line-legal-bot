import { askGemini } from "@/lib/gemini";
import { getFAQData } from "@/lib/google-sheet";

export async function GET() {

const faq = await getFAQData();

const knowledge = faq
.map((row) => `${row[0]} : ${row[1]}`)
.join("\n");

const prompt = `
คุณเป็นผู้ช่วยกฎหมายไทยเบื้องต้น

ข้อมูลอ้างอิง:

${knowledge}

คำถาม:

ผู้เช่าไม่จ่ายค่าเช่า ต้องทำอย่างไร

ตอบเป็นภาษาไทย
`;

const answer = await askGemini(prompt);

return Response.json({
answer,
});
}
