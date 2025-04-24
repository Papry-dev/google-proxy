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

  const initMap = () => {
    const tbilisi = { lat: 41.7151, lng: 44.8271 };
    const map = new google.maps.Map(document.getElementById("map"), {
      center: tbilisi,
      zoom: 13,
    });

    const marker = new google.maps.Marker({ map, position: tbilisi, draggable: true });

    const input = document.getElementById("deliveryAddress");
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo("bounds", map);
    autocomplete.setFields(["geometry"]);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      const loc = place.geometry.location;
      marker.setPosition(loc);
      map.setCenter(loc);
      coords = loc.toJSON();
      calcCost();
    });

    marker.addListener("dragend", () => {
      coords = marker.getPosition().toJSON();
      calcCost();
    });
  };

  const calcCost = async () => {
    const time = document.getElementById("deliverySlot")?.value;
    if (!coords || !time) return;

    const label = document.getElementById("deliveryDate").selectedOptions[0]?.textContent;
    const datetime = `${label}, ${time}`;

    const res = await fetch("/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: coords.lat, lon: coords.lng, time: datetime, cart: cartValue }),
    });

    const data = await res.json();
    const delivery = parseFloat(data.deliveryCost || 0);
    document.getElementById("deliveryCost").value = `${delivery.toFixed(2)} ₾`;
    document.getElementById("totalCost").value = `${(delivery + cartValue).toFixed(2)} ₾`;
  };

  window.initMap = () => {
    initMap();
    generateOptions();
    document.getElementById("cartValue")?.setAttribute("value", `${cartValue.toFixed(2)} ₾`);
  };

  if (!window.google || !window.google.maps) {
    const gmapScript = document.createElement("script");
    gmapScript.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDRj1_fUDJqKatTrU4DMXAnVliqzAHPXjA&libraries=places&callback=initMap";
    gmapScript.async = true;
    gmapScript.defer = true;
    document.head.appendChild(gmapScript);
  } else {
    initMap();
  }
})();