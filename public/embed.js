// Новый правильный embed.js
(function () {
  let cartValue = 0;
  let coords = null;

  function updateCartValue() {
  const el =
    document.querySelector("#cart_amount") ||
    document.querySelector(".cart__amount span") ||
    document.querySelector("#cart_panel_amount");

  if (!el) {
    console.warn("❗ Элемент суммы корзины не найден");
    return;
  }

  const raw = el.innerText || "0₾";
  cartValue = parseFloat(raw.replace(/[₾,]/g, ".").replace(/[^\d.]/g, "")) || 0;

  const cartValueInput = document.getElementById("cartValue");
  if (cartValueInput) {
    cartValueInput.value = `${cartValue.toFixed(2)} ₾`;
  }

  console.log("🛒 Обновлена сумма корзины:", cartValue);
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
    #geoButton {
      margin-top: 0.5rem;
      width: 100%;
      padding: 0.5rem;
      border-radius: 6px;
      border: none;
      background: #444;
      color: white;
      cursor: pointer;
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
    <button id="geoButton">📍 Определить местоположение</button>
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

  // Дальше -- init карты, кнопка геопозиции и калькуляция (добавлю сразу после фикса контейнера)
})();