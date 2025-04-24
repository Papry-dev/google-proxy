const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("public"));

// Точка расчёта доставки (оставь как есть)
app.post("/render", async (req, res) => {
  // ...твой код...
});

// Прокси к Google Places API
app.get("/fetch", async (req, res) => {
  const target = decodeURIComponent(req.query.q);
  if (!target || !target.startsWith("https://maps.googleapis.com")) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const response = await fetch(target);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Fetch failed", details: e.message });
  }
});