import { GoogleGenAI } from '@google/genai';
import { inngest } from './client'
import { db } from './prisma';
export const generateIndustryIsights = inngest.createFunction(
    { name: "Generate Industry Insights" },
    { cron: "0 0 * * 0" },
    async ({ event, step }) => {
        const industries = await step.run("Fetch industries", async () => {
            return await db.industryInsight.findMany({
                select: { industry: true },
            });
        });

        const model = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY
        })

        for (const { industry } of industries) {
            const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

            const res = await step.ai.wrap(
                "gemini",
                async (p) => {
                    return await model.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: [{ text: p }]
                    });
                }, prompt
            );

            // const result = await model.models.generateContent({
            //     model: "gemini-2.5-flash",
            //     contents: [{ text: prompt }]
            // });

            // const text = res.text;
            // const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

            const text =
  res.candidates?.[0]?.content?.parts?.[0]?.text || "";

if (!text) {
  console.error("Gemini raw response:", JSON.stringify(res, null, 2));
  throw new Error(`Gemini returned empty or undefined response for industry: ${industry}`);
}


const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();


            const insights = JSON.parse(cleanedText);

            await step.run(`Update ${industry} insights`, async () => {
                await db.industryInsight.update({
                    where: { industry },
                    data: {
                        ...insights,
                        lastUpdated: new Date(),
                        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            })
        }
    }
)