import OpenAI from "openai";


const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});


export default async function handler(
	request,
	response
) {

	/*
	=========================================================
	 CORS
	=========================================================
	*/

	response.setHeader(
		"Access-Control-Allow-Origin",
		"*"
	);

	response.setHeader(
		"Access-Control-Allow-Methods",
		"POST, OPTIONS"
	);

	response.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type"
	);


	/*
	=========================================================
	 OPTIONS
	=========================================================
	*/

	if (request.method === "OPTIONS") {

		return response.status(200).end();
	}


	/*
	=========================================================
	 فقط POST
	=========================================================
	*/

	if (request.method !== "POST") {

		return response.status(405).json({
			error: "Method Not Allowed"
		});
	}


	try {

		/*
		=====================================================
		 بررسی API Key
		=====================================================
		*/

		if (!process.env.OPENAI_API_KEY) {

			console.error(
				"OPENAI_API_KEY is not configured."
			);

			return response.status(500).json({
				error:
					"کلید API در سرور تنظیم نشده است."
			});
		}


		/*
		=====================================================
		 دریافت اطلاعات
		=====================================================
		*/

		const {
			messages
		} = request.body || {};


		if (
			!Array.isArray(messages) ||
			messages.length === 0
		) {

			return response.status(400).json({
				error:
					"لیست پیام‌ها معتبر نیست."
			});
		}


		/*
		=====================================================
		 محدود کردن ورودی
		 
		 فعلاً برای جلوگیری از ارسال حجم خیلی زیاد
		 تاریخچه گفتگو را محدود می‌کنیم.
		=====================================================
		*/

		const recentMessages =
			messages.slice(-20);


		/*
		=====================================================
		 ساخت ورودی برای OpenAI
		=====================================================
		*/

		const input =
			recentMessages.map(
				message => {

					return {
						role:
							message.role === "assistant"
								? "assistant"
								: "user",

						content:
							String(
								message.content || ""
							)
					};
				}
			);


		/*
		=====================================================
		 درخواست به OpenAI
		=====================================================
		*/

		const result =
			await openai.responses.create({

				model: "gpt-5.6-luna",

				instructions:
					`
تو دستیار هوشمند T-Choob هستی.

نام تو T-Choob AI است.

با کاربر به زبان فارسی و به شکل طبیعی
و دوستانه صحبت کن، مگر اینکه کاربر زبان
دیگری را درخواست کند.

پاسخ‌ها را واضح، کاربردی و نسبتاً خلاصه
ارائه کن.

اگر کاربر درباره T-Choob سؤال کرد،
آن را یک برند و پلتفرم در حال توسعه در نظر بگیر.

اطلاعاتی که درباره T-Choob در اختیار نداری
را به عنوان واقعیت قطعی بیان نکن.

اگر سؤال کاربر به اطلاعاتی خارج از
اطلاعات موجود نیاز داشت، شفاف بگو که
اطلاعات کافی در اختیار نداری.
`,

				input

			});


		/*
		=====================================================
		 استخراج پاسخ
		=====================================================
		*/

		const answer =
			result.output_text ||
			"متأسفانه پاسخی دریافت نشد.";


		/*
		=====================================================
		 ارسال پاسخ
		=====================================================
		*/

		return response.status(200).json({

			success: true,

			answer: answer

		});


	} catch (error) {

		console.error(
			"OpenAI API Error:",
			error
		);


		return response.status(500).json({

			success: false,

			error:
				"خطایی هنگام ارتباط با هوش مصنوعی رخ داد."

		});
	}
}
