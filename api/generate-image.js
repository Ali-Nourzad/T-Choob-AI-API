import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(request, response) {
	response.setHeader("Access-Control-Allow-Origin","*");
	response.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
	response.setHeader("Access-Control-Allow-Headers","Content-Type");

	if (request.method === "OPTIONS") return response.status(200).end();
	if (request.method !== "POST") return response.status(405).json({error:"Method Not Allowed"});
	if (process.env.IMAGE_GENERATION_ENABLED !== "true") {
		return response.status(403).json({error:"تولید تصویر فعلاً در سرور فعال نشده است."});
	}
	if (!process.env.OPENAI_API_KEY) return response.status(500).json({error:"OPENAI_API_KEY در Vercel تنظیم نشده است."});

	try {
		const {prompt} = request.body || {};
		if (!prompt || !String(prompt).trim()) return response.status(400).json({error:"توضیح تصویر خالی است."});

		const result = await openai.images.generate({
			model:"gpt-image-2",
			prompt:String(prompt).trim()
		});

		const item = result.data?.[0];
		if (!item?.b64_json) throw new Error("Image data was not returned.");

		return response.status(200).json({
			success:true,
			imageDataUrl:`data:image/png;base64,${item.b64_json}`,
			revisedPrompt:item.revised_prompt || ""
		});
	} catch (error) {
		console.error("Image Generation Error:",error);
		return response.status(500).json({success:false,error:"تولید تصویر انجام نشد."});
	}
}
