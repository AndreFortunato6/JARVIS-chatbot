import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MODELO COMPATÍVEL COM API v1
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
});

// --- ROTA DE STREAMING ---
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;

        // Headers do SSE
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const result = await model.generateContentStream({
            contents: [
                {
                    role: "user",
                    parts: [{ text: message }]
                }
            ]
        });

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                res.write(`data: ${text}\n\n`);
            }
        }

        res.write("data: [END]\n\n");
        res.end();

    } catch (err) {
        console.error("Erro:", err);
        res.write(`data: ERROR\n\n`);
        res.end();
    }
});

// Rota teste
app.get("/", (req, res) => res.json({ ok: true }));

app.listen(3000, () => {
    console.log("🚀 Servidor rodando http://localhost:3000");
});
