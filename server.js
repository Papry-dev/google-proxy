const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;
const GOOGLE_API_KEY = "AIzaSyDRj1_fUDJqKatTrU4DMXAnVliqzAHPXjA";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function calculateDeliveryCost(distanceKm, cart, timeLabel) {
  // 1. Базовая цена по расстоянию
  const ranges = [
    { max: 1, cost: 7 },
    { max: 2, cost: 9 },
    { max: 3, cost: 11 },
    { max: 4, cost: 13 },
    { max: 5, cost: 15 },
    { max: 6, cost: 17 },
    { max: 7, cost: 19 },
    { max: 8, cost: 21 },
    { max: 9, cost: 23 },
    { max: 10, cost: 25 },
    { max: 12, cost: 30 },
    { max: 14, cost: 35 },
    { max: 16, cost: 40 },
    { max: 18, cost: 45 },
    { max: 19, cost: 50 }
  ];

  const base = ranges.find(r => distanceKm <= r.max)?.cost;
  if (!base) return null; // Доставка по согласованию

  // 2. Надбавка за время
  let timeMultiplier = 1;
  if (/\b(21:30|22:00|22:30|23:00|23:30|00:00|00:30|01:00|01:30|02:00)\b/.test(timeLabel)) {
    timeMultiplier = 1.2;
  }

  // 3. Надбавка за сумму корзины
  let extra = 0;
  if (cart > 500 && cart <= 800) {
    return 3 * (base * timeMultiplier) + 15;
  } else if (cart > 250 && cart <= 500) {
    return 2 * (base * timeMultiplier) + 15;
  } else if (cart > 150 && cart <= 250) {
    return (base * timeMultiplier) + 10;
  } else if (cart > 100 && cart <= 150) {
    return (base * timeMultiplier) + 5;
  } else if (cart > 70 && cart <= 100) {
    return (base * timeMultiplier) + 3;
  } else {
    return base * timeMultiplier;
  }
}

app.post("/render", async (req, res) => {
  const { lat, lon, time, cart } = req.body;
  const start = { lat: 41.776127, lon: 44.753418 }; // Магазин

  const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${start.lat},${start.lon}&destinations=${lat},${lon}&units=metric&key=${GOOGLE_API_KEY}`;

  try {
    const result = await fetch(distanceUrl);
    const json = await result.json();
    const meters = json.rows?.[0]?.elements?.[0]?.distance?.value;
    if (!meters) throw new Error("Can't determine distance");

    const km = meters / 1000;
    const cost = calculateDeliveryCost(km, cart, time);
    if (cost === null) {
      return res.json({ deliveryCost: null, note: "Стоимость будет согласована с менеджером" });
    }

    res.json({ deliveryCost: cost });
  } catch (e) {
    console.error("Ошибка расчёта доставки:", e);
    res.status(500).json({ error: "Ошибка расчёта доставки", details: e.message });
  }
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
    res.set("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Fetch failed", details: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
