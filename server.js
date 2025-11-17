import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";

dotenv.config();
const app = express();

// --- CORS e JSON ---
app.use(cors({ origin: "*" })); // Troque "*" pelo domínio do front-end em produção
app.use(express.json());

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

// --- ROTA DE CHAT (SSE) ---
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // Headers SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: message }] }]
    });

    try {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) res.write(`data: ${text}\n\n`);
      }
      // Marca o fim da resposta
      res.write("data: [END]\n\n");
      res.end();
    } catch (streamErr) {
      console.error("Erro no stream:", streamErr);
      res.write("data: ERRO NO STREAM\n\n");
      res.end();
    }
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


