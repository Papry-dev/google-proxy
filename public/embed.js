
(function () {
  const cartRaw = document.getElementById("cart_amount")?.innerText || "26,10₾";
  const cartValue = parseFloat(cartRaw.replace(/[₾,]/g, '.')) || 0;
  let coords = null;

  const style = document.createElement("style");
  style.textContent = `
    #delivery-widget * { box-sizing: border-box; }
    #delivery-widget {
      background: #1f1f1f;
      padding: 1rem;
      border-radius: 12px;
      color: white;
      margin-top: 1rem;
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
    <label>Стоимость доставки
      <input type="text" id="deliveryCost" class="readonly" readonly />
    </label>
    <label>Итого
      <input type="text" id="totalCost" class="readonly" readonly />
    </label>
  `;
  document.getElementById("delivery-block")?.appendChild(container);

  // Остальной функционал карты, подсказок и расчета цены
})();
