const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com'
  });


app.post('/api/ask', async (req, res) => {
    const {question, history =[] } = req.body;

    // const prompt = `
    // You are a helpful assistant for PartSelect, an appliance part site. Focus only on Refrigerator and dishwasher parts.
    // To offer help for client and customers, do not answer questions outside this scope. 
    // Customer question: ${question}`;

    const prompt = `
    You are an expert assistant fro the PartSelect website.
    You need 
    1.Understand the user query (focus only on refrigerator and dishwasher parts).
    2.Identify the intent:like CompatibilityCheck, TroubleShooting, ProductSearch, OrderSupport or other generals
    3.Return JSON in this format:
    {
    "intent" : "<IntentName>",
    "answer" : "<Answer in plain english>",
    "product": {
                "title": "...",
                "url": "...",
                "function": "...",
                "price": "...", 
                "image": "...",
                "info": "..."
                }
    "otherInfo" : "<Other or general info>",
    }
    Include relevant, do not answer questions outside this scope. 
    If found someting not relecant to those appliance or product or not even related topic ignore and not answer.
    User: ${question}
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: 'You are a refrigerator and dishwasher part expert.' },
                ...history,
                { role: 'user', content: prompt }
            ]
        });
        let reply = completion.choices[0].message.content;


        console.log("🧠 LLM RAW reply:", completion.choices[0].message.content);

        // Strip markdown formatting like ```json ... ```
        reply = reply.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(reply);

        console.log("✅ Parsed product:", parsed.product);

        res.json({ 
            reply: parsed.answer, 
            product: parsed.product || null,
            history: [
                ...history,
                {role: 'user', content: question},
                {role: 'assistant', content: parsed.answer}
            ]
        });
    } catch (err) {
        console.error('DeepSeek API error:', err);
        res.status(500).json({ error: 'Failed to query DeepSeek' });
    }

    // try{
    //     const response = await axios.post(
    //         'https://api.deepseek.com/v1/chat/completions',
    //         {
    //             model: 'deepseek-chat',
    //             messages:[
    //                 {role: 'system', content:'You are a refrigerator and dishwasher part expert.'},
    //                 {role: 'user', content: prompt }
    //             ],
    //         },
    //         {
    //             headers: {
    //                 Authorization:`Bearer ${process.env.DEEPSEEK_API_KEY}`,
    //                 'Content-Type': 'application/json',
    //             },
    //         }
    //     );

    //     const reply = response.data.choice[0].message.content;
    //     // res.json({ reply });
    //     const parsed = JSON.parse(reply);
    //     res.json({ reply: parsed.answer, product: parsed.product || null});
    // } catch (err) {
    //     console.error(err.response?.data || err.message);
    //     res.status(500).json({ error: "Failed to get response from deepseek"});
    // }


});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));