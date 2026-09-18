import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-5.6-luna";

function cors(response) {
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeMessages(messages) {
	return messages.slice(-20).map(message => {
		const content = [];
		if (message.content) content.push({ type:"input_text", text:String(message.content) });

		for (const file of message.attachments || []) {
			if (!file?.dataUrl) continue;

			if (String(file.type).startsWith("image/")) {
				content.push({ type:"input_image", image_url:file.dataUrl });
			} else {
				content.push({
					type:"input_file",
					filename:String(file.name || "file"),
					file_data:file.dataUrl
				});
			}
		}

		return {
			role:message.role === "assistant" ? "assistant" : "user",
			content
		};
	});
}

export default async function handler(request, response) {
	cors(response);

	if (request.method === "OPTIONS") return response.status(200).end();
	if (request.method !== "POST") return response.status(405).json({error:"Method Not Allowed"});
	if (!process.env.OPENAI_API_KEY) return response.status(500).json({error:"OPENAI_API_KEY در Vercel تنظیم نشده است."});

	try {
		const {messages} = request.body || {};
		if (!Array.isArray(messages) || !messages.length) {
			return response.status(400).json({error:"لیست پیام‌ها معتبر نیست."});
		}

		const result = await openai.responses.create({
			model:MODEL,
			instructions:`تو T-Choob AI هستی؛ دستیار هوشمند پلتفرم T-Choob.
با کاربر به فارسی طبیعی و دوستانه صحبت کن، مگر اینکه زبان دیگری بخواهد.
پاسخ‌ها واضح و کاربردی باشند.
اگر تصویر یا فایل فرستاده شد، محتوای قابل مشاهده یا قابل پردازش آن را بررسی کن.
اطلاعاتی درباره T-Choob که در ورودی وجود ندارد را به عنوان واقعیت قطعی نساز.`,
			input:normalizeMessages(messages)
		});

		return response.status(200).json({success:true,answer:result.output_text || "پاسخی دریافت نشد."});
	} catch (error) {
		console.error("OpenAI API Error:",error);
		return response.status(500).json({success:false,error:"خطایی هنگام ارتباط با هوش مصنوعی رخ داد."});
	}
}
