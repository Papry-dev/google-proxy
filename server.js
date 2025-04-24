const express = require("express");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;
const GOOGLE_API_KEY = "AIzaSyDRj1_fUDJqKatTrU4DMXAnVliqzAHPXjA";

app.use(express.json());
app.use(express.static("public"));

app.post("/render", async (req, res) => {
  // Твой код доставки
});

app.get("/fetch", async (req, res) => {
  let target = decodeURIComponent(req.query.q);
  if (!target.includes("key=")) {
    target += `&key=${GOOGLE_API_KEY}`;
  }
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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});