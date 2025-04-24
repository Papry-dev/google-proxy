// server.js — с прокси для Google Places API

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

// Твоя точка расчёта стоимости (уже есть, пусть останется)
app.post("/render", async (req, res) => {
  // ...твой код доставки...
});

// ⚡ Новый прокси endpoint для Google API
app.get("/fetch", async (req, res) => {
  const target = req.query.q;
  if (!target || !target.startsWith("https://maps.googleapis.com")) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const response = await fetch(target);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error("Fetch proxy error:", e);
    res.status(500).json({ error: "Fetch failed", details: e.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});