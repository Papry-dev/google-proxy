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
    { max: 3, cost: 10 },
    { max: 4, cost: 11 },
    { max: 5, cost: 11.5 },
    { max: 6, cost: 12 },
    { max: 7, cost: 13 },
    { max: 8, cost: 13.5 },
    { max: 10, cost: 14 },
    { max: 11, cost: 18 },
    { max: 12, cost: 19 },
    { max: 13, cost: 21.5 },
    { max: 15, cost: 21.5 },
    { max: 16, cost: 23.5 },
    { max: 18, cost: 23.5 },
    { max: 19, cost: 23.5 }
  ];

  const base = ranges.find(r => distanceKm <= r.max)?.cost;
  if (!base) return null;

  // 2. Надбавка по времени
  let timeMultiplier = 1;
  const timeMap = [
    { from: "00:00", to: "07:00", mult: 0.9 },
    { from: "07:00", to: "08:00", mult: 0.95 },
    { from: "08:00", to: "11:00", mult: 1.1 },
    { from: "11:00", to: "15:00", mult: 1 },
    { from: "15:00", to: "16:30", mult: 1.1 },
    { from: "16:30", to: "19:30", mult: 1.25 },
    { from: "19:30", to: "23:00", mult: 1 },
    { from: "23:00", to: "24:00", mult: 0.9 }
  ];
  const timeOnly = timeLabel?.match(/\b\d{2}:\d{2}\b/)?.[0];
  if (timeOnly) {
    for (const { from, to, mult } of timeMap) {
      if (timeOnly >= from && timeOnly < to) {
        timeMultiplier = mult;
        break;
      }
    }
  }

  let cost = base * timeMultiplier;

  // 3. Надбавка за корзину
  if (cart > 70 && cart <= 100) {
    cost += 3;
  } else if (cart > 100 && cart <= 150) {
    cost += 5;
  } else if (cart > 150 && cart <= 250) {
    cost += 10;
  } else if (cart > 250 && cart <= 500) {
    cost = 2 * cost + 15;
  } else if (cart > 500 && cart <= 800) {
    cost = 3 * cost + 15;
  } else if (cart > 800 && cart <= 1500) {
    cost = 4 * cost + 20;
  }

  return cost;
}

app.post("/render", async (req, res) => {
  const { lat, lon, time, cart } = req.body;
  const start = { lat: 41.776127, lon: 44.753418 };

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
