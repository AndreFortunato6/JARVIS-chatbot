import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da raiz
app.use(express.static(process.cwd()));

// Abrir index.html na raiz
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

// Inicializa Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Rota de chat SSE
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
    res.write("data: Desculpe, ocorreu um erro.\n\n");
    res.end();
  }
});

// Porta dinâmica para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
