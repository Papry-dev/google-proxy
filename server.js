// server.js с расчётом по радиусу

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

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDeliveryCost(distanceKm, cartValue, timeLabel) {
  const distanceRanges = [
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
    { max: 14, cost: 21.5 },
    { max: 15, cost: 21.5 },
    { max: 16, cost: 23.5 },
    { max: 17, cost: 23.5 },
    { max: 18, cost: 23.5 },
    { max: 19, cost: 23.5 },
  ];

  const distanceEntry = distanceRanges.find(r => distanceKm <= r.max);
  if (!distanceEntry) return null;

  let baseCost = distanceEntry.cost;

  const timeCorrections = [
    { start: "00:00", end: "07:00", multiplier: 0.9 },
    { start: "07:00", end: "08:00", multiplier: 0.95 },
    { start: "08:00", end: "11:00", multiplier: 1.10 },
    { start: "11:00", end: "15:00", multiplier: 1.00 },
    { start: "15:00", end: "16:30", multiplier: 1.10 },
    { start: "16:30", end: "19:30", multiplier: 1.25 },
    { start: "19:30", end: "23:00", multiplier: 1.00 },
    { start: "23:00", end: "24:00", multiplier: 0.9 },
  ];

  function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  const match = timeLabel.match(/(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/);
  if (!match) {
    console.warn("Не могу распарсить время доставки:", timeLabel);
    return null;
  }
  const deliveryTime = timeToMinutes(match[1]);

  const timeEntry = timeCorrections.find(tc => {
    return deliveryTime >= timeToMinutes(tc.start) && deliveryTime < timeToMinutes(tc.end);
  });

  const timeMultiplier = timeEntry ? timeEntry.multiplier : 1;

  baseCost = baseCost * timeMultiplier;

  if (cartValue <= 70) {
    baseCost += 0;
  } else if (cartValue <= 100) {
    baseCost += 3;
  } else if (cartValue <= 150) {
    baseCost += 5;
  } else if (cartValue <= 250) {
    baseCost += 10;
  } else if (cartValue <= 500) {
    baseCost = baseCost * 2 + 15;
  } else if (cartValue <= 800) {
    baseCost = baseCost * 3 + 15;
  } else if (cartValue <= 1500) {
    baseCost = baseCost * 4 + 20;
  }

  return Math.round(baseCost * 100) / 100;
}
app.post("/render", async (req, res) => {
  const { lat, lon, time, cart } = req.body;
  const start = { lat: 41.776127, lon: 44.753418 }; // Магазин

  try {
    const km = haversineDistance(start.lat, start.lon, lat, lon);
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
