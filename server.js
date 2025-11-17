import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// --- INICIALIZA GEMINI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- ROTA TESTE ---
app.get("/", (req, res) => {
  res.json({ ok: true });
});

// --- ROTA DE CHAT (SSE) ---
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

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

// --- PORTA CORRETA PARA RENDER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

