// embed.js — отладочная версия с логами для Telegram WebApp

(function () {
  console.log("📦 embed.js загружен");

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

    <label>Адрес доставки <span class="required-note">* (необходимое поле)</span>
      <input type="text" id="deliveryAddress" placeholder="Введите адрес" required />
    </label>

    <div id="map"></div>
  `;
  document.getElementById("delivery-block")?.appendChild(container);

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDRj1_fUDJqKatTrU4DMXAnVliqzAHPXjA&libraries=places&callback=initDeliveryMap`;
  script.async = true;
  document.body.appendChild(script);

  window.initDeliveryMap = () => {
    console.log("🗺️ initDeliveryMap вызван");

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

    const input = document.getElementById("deliveryAddress");
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.setFields(["geometry", "formatted_address", "name"]);

    autocomplete.addListener("place_changed", () => {
      console.log("📍 place_changed событие сработало");
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      map.setCenter(place.geometry.location);
      marker.setPosition(place.geometry.location);
      coords = place.geometry.location.toJSON();
      input.value = place.formatted_address || place.name || place.vicinity || "";
      console.log("📝 Вставлен адрес:", input.value);
    });

    marker.addListener("dragend", () => {
      coords = marker.getPosition().toJSON();
      console.log("📦 Маркер перемещён. Координаты:", coords);
    });
  };
})();
