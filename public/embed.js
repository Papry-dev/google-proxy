// embed.js — встраиваемый блок карты, адреса и расчёта доставки

(function () {
  const cartRaw = document.getElementById("cart_amount")?.innerText || "26,10₾";
  const cartValue = parseFloat(cartRaw.replace(/[₾,]/g, '.')) || 0;
  let coords = null;
  let addressSelected = false;

  const style = document.createElement('style');
  style.textContent = `
    #delivery-widget * { box-sizing: border-box; }
    #delivery-widget { background: #1f1f1f; padding: 1rem; border-radius: 12px; color: white; margin-top: 1rem; }
    #delivery-widget label { display: block; margin-top: 0.5rem; font-weight: bold; }
    #delivery-widget input, #delivery-widget select {
      width: 100%; padding: 0.5rem; border-radius: 6px; border: none; margin-top: 0.3rem;
    }
    #delivery-widget #map { height: 200px; margin-top: 0.5rem; border-radius: 10px; }
    #delivery-widget .readonly { background: #2a2a2a; color: #ccc; }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
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

    const input = document.getElementById("deliveryAddress");
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo("bounds", map);
    autocomplete.setFields(["geometry"]);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      map.setCenter(place.geometry.location);
      marker.setPosition(place.geometry.location);
      coords = place.geometry.location.toJSON();
      addressSelected = true;
      calculateDelivery();
    });

    marker.addListener("dragend", () => {
      coords = marker.getPosition().toJSON();
      addressSelected = true;
      calculateDelivery();
    });

    generateDeliveryOptions();
  };

  function generateDeliveryOptions() {
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const now = new Date();
    const dateSelect = document.getElementById("deliveryDate");
    const slotSelect = document.getElementById("deliverySlot");

    const deliveryDays = [];
    for (let d = 0; d < 14; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      deliveryDays.push({
        label: d === 0 ? "Сегодня" : d === 1 ? "Завтра" : `${days[day.getDay()]}, ${day.getDate()}.${day.getMonth() + 1}`,
        date: new Date(day.setHours(0, 0, 0, 0))
      });
    }

    dateSelect.innerHTML = `<option value="" disabled selected hidden>Выберите дату доставки</option>` +
      deliveryDays.map((d, i) => `<option value="${i}">${d.label}</option>`).join("");

    dateSelect.addEventListener("change", (e) => generateSlots(parseInt(e.target.value)));
    slotSelect.addEventListener("change", calculateDelivery);
    generateSlots(0);
  }

  function generateSlots(dayIndex) {
    const now = new Date();
    const dateSelect = document.getElementById("deliveryDate");
    const slotSelect = document.getElementById("deliverySlot");
    const label = dateSelect.options[dayIndex + 1]?.textContent || "";

    let selectedDay = new Date();
    selectedDay.setDate(now.getDate() + dayIndex);
    let start = new Date(selectedDay);

    if (dayIndex === 0) {
      start.setHours(now.getHours(), now.getMinutes() + 90, 0, 0);
      const m = start.getMinutes();
      start.setMinutes(m <= 30 ? 30 : 60);
    } else {
      start.setHours(7, 0, 0, 0);
    }

    const end = new Date(selectedDay);
    end.setDate(end.getDate() + 1);
    end.setHours(2, 0, 0, 0);

    const slots = [];
    while (start < end) {
      const endSlot = new Date(start.getTime() + 30 * 60000);
      const format = d => d.toTimeString().substring(0, 5);
      slots.push(`${format(start)}–${format(endSlot)}`);
      start = endSlot;
    }

    slotSelect.innerHTML = `<option value="" disabled selected hidden>Выберите время</option>` +
      slots.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  async function calculateDelivery() {
    const dateText = document.getElementById("deliveryDate").selectedOptions[0]?.textContent;
    const timeText = document.getElementById("deliverySlot").value;
    const time = `${dateText}, ${timeText}`;

    if (!coords || !addressSelected || !time) return;

    const res = await fetch("https://proxy-server-zhn1.onrender.com/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: coords.lat,
        lon: coords.lng,
        time,
        cart: cartValue
      })
    });

    const data = await res.json();
    if (!data || data.deliveryCost === undefined) return;

    document.getElementById("deliveryCost").value = `${data.deliveryCost.toFixed(2)} ₾`;
    const total = data.deliveryCost + cartValue;
    document.getElementById("totalCost").value = `${total.toFixed(2)} ₾`;
  }
})();
