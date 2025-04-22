// server.js (обновлённый с расчётом стоимости по PDF)
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOP_COORDS = { lat: 41.776127, lon: 44.753418 };

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

app.post('/render', async (req, res) => {
  const { lat, lon, time, cart } = req.body;
  if (!(lat && lon && time && cart)) {
    return res.status(400).json({ error: 'Missing lat, lon, time or cart' });
  }

  const distance = calcDistance(lat, lon, SHOP_COORDS.lat, SHOP_COORDS.lon);
  const basePrice = getBasePrice(distance);
  const timeFactor = getTimeFactor(time);
  const volumeAddon = getVolumeAddon(cart, basePrice * (1 + timeFactor));

  const deliveryCost = (basePrice * (1 + timeFactor)) + volumeAddon;

  if (distance > 19) {
    return res.json({ deliveryCost: 0, message: 'Цена согласуется с менеджером' });
  }

  res.json({ deliveryCost: parseFloat(deliveryCost.toFixed(2)) });
});

function calcDistance(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371; // км
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBasePrice(km) {
  const table = [
    { max: 1, price: 7 },
    { max: 3, price: 10 },
    { max: 4, price: 11 },
    { max: 5, price: 11.5 },
    { max: 6, price: 12 },
    { max: 7, price: 13 },
    { max: 8, price: 13.5 },
    { max: 10, price: 14 },
    { max: 11, price: 18 },
    { max: 12, price: 19 },
    { max: 13, price: 21.5 },
    { max: 15, price: 21.5 },
    { max: 16, price: 23.5 },
    { max: 18, price: 23.5 },
    { max: 19, price: 23.5 },
  ];
  const entry = table.find(row => km <= row.max);
  return entry ? entry.price : 0;
}

function getTimeFactor(timeString) {
  const time = timeString.split(', ')[1];
  const hour = parseInt(time.split(':')[0]);

  if (hour >= 0 && hour < 7) return -0.10;
  if (hour >= 7 && hour < 8) return -0.05;
  if (hour >= 8 && hour < 11) return 0.10;
  if (hour >= 11 && hour < 15) return 0.00;
  if (hour >= 15 && hour < 16.5) return 0.10;
  if (hour >= 16.5 && hour < 19.5) return 0.25;
  if (hour >= 19.5 && hour < 23) return 0.00;
  if (hour >= 23 && hour < 24) return -0.10;

  return 0;
}

function getVolumeAddon(cart, adjustedBase) {
  const cartVal = parseFloat(cart);
  if (cartVal <= 70) return 0;
  if (cartVal <= 100) return 3;
  if (cartVal <= 150) return 5;
  if (cartVal <= 250) return 10;
  if (cartVal <= 500) return (adjustedBase * 2) + 15;
  if (cartVal <= 800) return (adjustedBase * 3) + 15;
  if (cartVal <= 1500) return (adjustedBase * 4) + 20;
  return 0;
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
