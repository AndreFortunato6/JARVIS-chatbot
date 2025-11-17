import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";

dotenv.config();
const app = express();

// --- CORS CONFIGURADO PARA FRONT-END ---
app.use(cors({
    origin: "https://jarvis-chatbot-2.onrender.com", // seu front-end
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

// --- PARSE JSON ---
app.use(express.json());

// --- TRATAR PRELIGHT OPTIONS PARA CORS ---
app.options("/chat", (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://jarvis-chatbot-2.onrender.com");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204); // resposta vazia para OPTIONS
});

// --- SERVIR ARQUIVOS ESTÁTICOS ---
const publicPath = path.join(process.cwd(), "public");
app.use(express.static(publicPath));

// --- INICIALIZA GEMINI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- ROTA TESTE ---
app.get("/api-test", (req, res) => {
    res.json({ ok: true });
});

app.post("/chat", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "https://jarvis-chatbot-2.onrender.com");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    // 🔥 Cabeçalhos do SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    try {
        const { message } = req.body;

        const result = await model.generateContentStream({
            contents: [{ role: "user", parts: [{ text: message }] }]
        });

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) res.write(`data: ${text}\n\n`);
        }

        res.write("data: [END]\n\n");
        res.end();

    } catch (err) {
        console.error("Erro no /chat:", err);
        res.write("data: ERRO NO SERVIDOR\n\n");
        res.end();
    }
});

// --- FALLBACK PARA FRONT-END ---
app.get("*", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

