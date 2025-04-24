// embed.js — обновлён для автозаполнения адреса и обратного геокодирования

(function () {
  const cartRaw = document.getElementById("cart_amount")?.innerText || "26,10₾";
  const cartValue = parseFloat(cartRaw.replace(/[₾,]/g, '.')) || 0;
  let coords = null;
  let addressSelected = false;

  const style = document.createElement('style');
  style.textContent = `
    #delivery-widget * { box-sizing: border-box; }
    #delivery-widget {
      background: #121212; color: white; font-family: Arial, sans-serif;
      padding: 1rem; border-radius: 12px; margin-top: 1rem;
    }
    #delivery-widget h1 {
      font-size: 1.3rem; margin-bottom: 1rem;
    }
    #delivery-widget label {
      display: block; margin-top: 1rem; font-weight: bold;
    }
    #delivery-widget input, #delivery-widget select {
      width: 100%; padding: 0.5rem; border-radius: 6px; border: none; margin-top: 0.4rem;
    }
    #delivery-widget button {
      width: 100%; padding: 0.75rem; background: #3b82f6;
      color: white; border: none; border-radius: 8px; font-weight: bold;
      margin-top: 2rem; font-size: 1rem;
    }
    #map {
      height: 300px; max-height: 50vh; margin-top: 0.5rem; border-radius: 10px;
    }
    .readonly {
      background-color: #2a2a2a; color: #ccc;
    }
    .required-note {
      color: #f87171; font-size: 0.85rem;
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "delivery-widget";
  container.innerHTML = `
    <h1>Оформление заказа</h1>

    <label>Дата доставки <span class="required-note">* (необходимое поле)</span>
      <select id="deliveryDate" required></select>
    </label>

    <label>Время доставки <span class="required-note">* (необходимое поле)</span>
      <select id="deliverySlot" required></select>
    </label>

    <label>Адрес доставки <span class="required-note">* (необходимое поле)</span>
      <input type="text" id="deliveryAddress" placeholder="Введите адрес" required />
    </label>

    <div id="map"></div>

    <label>Стоимость товаров
      <input type="text" id="cartValue" class="readonly" readonly value="${cartValue.toFixed(2)} ₾" />
    </label>

    <label>Стоимость доставки
      <input type="text" id="deliveryCost" class="readonly" readonly />
    </label>

    <label>Итого к оплате
      <input type="text" id="totalCost" class="readonly" readonly />
    </label>

    <label>Номер телефона <span class="required-note">* (необходимое поле)</span>
      <input type="tel" id="phone" required />
    </label>

    <label>Способ оплаты <span class="required-note">* (необходимое поле)</span>
      <select id="paymentMethod" required>
        <option value="payze">Онлайн оплата</option>
        <option value="manual">Перевод</option>
      </select>
    </label>

    <label>№ входа / подъезда
      <input type="text" id="entrance" />
    </label>

    <label>Этаж
      <input type="text" id="floor" />
    </label>

    <label>Квартира
      <input type="text" id="apartment" />
    </label>

    <label>Код домофона
      <input type="text" id="intercom" />
    </label>

    <label>Код лифта
      <input type="text" id="elevator" />
    </label>

    <button id="submitOrder">Оформить заказ</button>
  `;
  document.getElementById("delivery-block")?.appendChild(container);

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDRj1_fUDJqKatTrU4DMXAnVliqzAHPXjA&libraries=places&callback=initDeliveryMap`;
  script.async = true;
  document.body.appendChild(script);

  window.initDeliveryMap = () => {
    const tbilisi = { lat: 41.7151, lng: 44.8271 };
    const map = new google.maps.Map(document.getElementById("map"), {
      center: tbilisi,
      zoom: 13,
    });

    const marker = new google.maps.Marker({
      position: tbilisi,
      map,
      draggable: true,
    });

    const geocoder = new google.maps.Geocoder();

    const input = document.getElementById("deliveryAddress");
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ["geocode"],
      componentRestrictions: { country: "ge" }
    });
    autocomplete.bindTo("bounds", map);
    autocomplete.setFields(["geometry", "formatted_address", "name"]);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      map.setCenter(place.geometry.location);
      marker.setPosition(place.geometry.location);
      coords = place.geometry.location.toJSON();
      input.value = place.formatted_address || place.name || place.vicinity || "";
      addressSelected = true;
      calculateDelivery();
    });

    marker.addListener("dragend", () => {
      coords = marker.getPosition().toJSON();
      geocoder.geocode({ location: coords }, (results, status) => {
        if (status === "OK" && results[0]) {
          input.value = results[0].formatted_address || "";
        }
      });
      addressSelected = true;
      calculateDelivery();
    });

    generateDeliveryOptions();
  };

  // ... остальной код без изменений ...
})();
