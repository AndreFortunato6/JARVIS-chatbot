async function sendToGemini(message) {
  try {
    const resp = await fetch("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await resp.json();
    return data.reply;
  } catch (e) {
    return "⚠️ Erro ao conectar ao servidor.";
  }
}
