import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
process.env.GEMINI_API_KEY!
);

const model = genAI.getGenerativeModel({
model: "gemini-1.5-flash",
});

export async function askGemini(
prompt: string
): Promise<string> {
try {
const result =
await model.generateContent(prompt);

```
const text =
  result.response.text();

return text || "";
```

} catch (error) {
console.error(
"Gemini API Error:",
error
);

```
return "";
```

}
}
