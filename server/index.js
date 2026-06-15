require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "10mb" })); // allow base64 image payloads
app.use(express.static(path.join(__dirname, "../public")));

// POST /api/chat — proxies the request to Gemini, keeping the key server-side
app.post("/api/chat", async (req, res) => {
  const { contents } = req.body;

  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: "Invalid request: 'contents' array is required." });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY in environment." });
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  try {
    const geminiResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({ error: data.error?.message || "Gemini API error." });
    }

    return res.json(data);
  } catch (err) {
    console.error("Error contacting Gemini API:", err);
    return res.status(502).json({ error: "Failed to reach Gemini API." });
  }
});

// Catch-all: serve index.html for any unknown route (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Chatbot server running at http://localhost:${PORT}`);
});
