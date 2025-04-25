(function () {
  let cartValue = 0;
  let coords = null;

  function updateCartValue() {
    const el = document.getElementById("cart_amount");
    if (!el) return;

    const raw = el.innerText || "0₾";
    cartValue = parseFloat(raw.replace(/[₾,]/g, ".").replace(/[^\d.]/g, "")) || 0;

    const cartValueInput = document.getElementById("cartValue");
    if (cartValueInput) {
      cartValueInput.value = `${cartValue.toFixed(2)} ₾`;
    }

    calcCost();
  }

  setInterval(updateCartValue, 1000);

  const style = document.createElement("style");
  style.textContent = `
    #delivery-widget * { box-sizing: border-box; }
    #delivery-widget {
      background: #1f1f1f;
      padding: 1rem;
      border-radius: 12px;
      color: white;
      margin-top: 1rem;
      position: relative;
    }
    #delivery-widget label {
      display: block;
      margin-top: 0.5rem;
      font-weight: bold;
    }
    #delivery-widget input, #delivery-widget select {
      width: 100%;
      padding: 0.5rem;
      border-radius: 6px;
      border: none;
      margin-top: 0.3rem;
    }
    #delivery-widget #map {
      height: 200px;
      margin-top: 0.5rem;
      border-radius: 10px;
    }
    #delivery-widget .readonly {
      background: #2a2a2a;
      color: #ccc;
    }
    #suggestionBox {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background: #333;
      z-index: 1000;
      border-radius: 0 0 6px 6px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      max-height: 200px;
      overflow-y: auto;
      display: none;
    }
    #suggestionBox div {
      padding: 0.5rem;
      cursor: pointer;
    }
    #suggestionBox div:hover {
      background: #444;
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "delivery-widget";
  container.innerHTML = `
    <label>Адрес доставки
      <input type="text" id="deliveryAddress" placeholder="Введите адрес" required />
    </label>
    <div id="map"></div>
    <label>Дата доставки
      <select id="deliveryDate" required></select>
    </label>
    <label>Время доставки
      <select id="deliverySlot" required></select>
    </label>
    <label>Стоимость корзины
      <input type="text" id="cartValue" class="readonly" readonly />
    </label>
    <label>Стоимость доставки
      <input type="text" id="deliveryCost" class="readonly" readonly />
    </label>
    <label>Итого
      <input type="text" id="totalCost" class="readonly" readonly />
    </label>
  `;
  document.getElementById("delivery-block")?.appendChild(container);

  const deliveryCostInput = document.getElementById("deliveryCost");
  const totalCostInput = document.getElementById("totalCost");

  const generateOptions = () => {
    const dateEl = document.getElementById("deliveryDate");
    const timeEl = document.getElementById("deliverySlot");

    const now = new Date();
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const label = i === 0 ? "Сегодня" : d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
      dates.push({ date: d, label });
    }

    dateEl.innerHTML = dates.map((d, i) => `<option value="${i}">${d.label}</option>`).join("");

    const updateTimeSlots = (i) => {
      const date = dates[i].date;
      const start = new Date(date);
      const nowTime = new Date();
      start.setHours(i === 0 ? nowTime.getHours() + 1.5 : 7, 0, 0, 0);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      end.setHours(2, 0, 0, 0);

      const slots = [];
      while (start < end) {
        const endSlot = new Date(start.getTime() + 30 * 60 * 1000);
        const fmt = d => d.toTimeString().slice(0, 5);
        slots.push(`${fmt(start)}–${fmt(endSlot)}`);
        start.setTime(endSlot.getTime());
      }

      timeEl.innerHTML = slots.map(s => `<option value="${s}">${s}</option>`).join("");
      calcCost();
    };

    dateEl.addEventListener("change", () => updateTimeSlots(parseInt(dateEl.value)));
    timeEl.addEventListener("change", calcCost);
    updateTimeSlots(0);
  };

  const calcCost = async () => {
    const time = document.getElementById("deliverySlot")?.value;
    if (!coords || !time) return;

    const label = document.getElementById("deliveryDate").selectedOptions[0]?.textContent;
    const datetime = `${label}, ${time}`;

    try {
      const res = await fetch("https://google-proxy-phpb.onrender.com/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: coords.lat, lon: coords.lng, time: datetime, cart: cartValue })
      });

      const data = await res.json();
      if (!data || data.deliveryCost === undefined || data.deliveryCost === null) {
        deliveryCostInput.value = "По согласованию";
        totalCostInput.value = "—";
        return;
      }

      const delivery = parseFloat(data.deliveryCost || 0);
      deliveryCostInput.value = `${delivery.toFixed(2)} ₾`;
      totalCostInput.value = `${(delivery + cartValue).toFixed(2)} ₾`;
    } catch (err) {
      console.error("Ошибка при расчёте доставки:", err);
      deliveryCostInput.value = "Ошибка";
    }
  };
})();