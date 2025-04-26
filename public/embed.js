(function () {
  let cartValue = 0;
  let coords = null;

  function updateCartValue() {
    const raw = sessionStorage.getItem("papry_cart") || "0₾";
    cartValue = parseFloat(raw.replace(/[\u20be,]/g, ".").replace(/[^\d.]/g, "")) || 0;

    const cartValueInput = document.getElementById("cartValue");
    if (cartValueInput) {
      cartValueInput.value = `${cartValue.toFixed(2)} ₾`;
    }

    console.log("🛒 Обновлена сумма корзины:", cartValue);
  }

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
      font-size: 18px;

    }
    #delivery-widget label small {
    display: inline;
    color: #00BFFF;
    font-weight: normal;
    margin-left: 0.3rem;
    font-size: 13px;
    }

    #delivery-widget input, #delivery-widget select {
      width: 100%;
      padding: 0.5rem;
      border-radius: 6px;
      border: none;
      margin-top: 0.3rem;
    }

    #deliverySlot {
  margin-bottom: 4rem; 
    }

    #delivery-widget #map {
      height: 300px;
      margin-top: 0.5rem;
      margin-bottom: 4rem;
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
  
  function setupFieldHighlighting() {
  const fieldsToHighlight = [
    "deliveryAddress",
    "deliveryDate",
    "deliverySlot",
    "cartValue",
    "deliveryCost",
    "totalCost",
    "phone",
    "paymentMethod"
  ];

  fieldsToHighlight.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const updateColor = () => {
      if (el.value && el.value.trim() !== "") {
        el.style.color = "#ffffff"; // Белый, если заполнено
      } else {
        el.style.color = "#ccc"; // Серый, если пусто
      }
    };

    el.addEventListener("input", updateColor);
    el.addEventListener("change", updateColor);
    updateColor(); // сразу обновить при загрузке
  });
}
  const container = document.createElement("div");
  container.id = "delivery-widget";
  container.innerHTML = `
    <label>Адрес доставки <span style="color:red">*</span><small>Обязательное поле</small>
      <input type="text" id="deliveryAddress" placeholder="Введите адрес" required />
    </label>
    <div id="map"></div>
    <label>Дата доставки <span style="color:red">*</span><small>Обязательное поле</small>
      <select id="deliveryDate" required></select>
    </label>
    <label>Время доставки <span style="color:red">*</span><small>Обязательное поле</small>
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
    <label>Номер телефона <span style="color:red">*</span><small>Обязательное поле</small>
      <input type="tel" id="phone" placeholder="Введите номер телефона" required />
    </label>
    <label>Комментарий к заказу
      <input type="text" id="orderComment" placeholder="Комментарий для магазина" />
    </label>
    <label>Способ оплаты <span style="color:red">*</span><small>Обязательное поле</small>
      <select id="paymentMethod" required>
        <option value="card">Оплата картой</option>
        <option value="transfer">Оплата переводом</option>
      </select>
    </label>
    <label>Номер подъезда
      <input type="text" id="entrance" placeholder="№ подъезда/входа" />
    </label>
    <label>Этаж
      <input type="text" id="floor" placeholder="Этаж" />
    </label>
    <label>Квартира
      <input type="text" id="flat" placeholder="№ квартиры" />
    </label>
    <label>Код домофона
      <input type="text" id="intercom" placeholder="Код домофона" />
    </label>
    <label>Код лифта
      <input type="text" id="elevator" placeholder="Код лифта (если есть)" />
    </label>
    <label>Прочее
      <input type="text" id="other" placeholder="Дополнительная информация" />
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

  dateEl.innerHTML = `<option value="" disabled selected>Выберите дату</option>` +
    dates.map((d, i) => `<option value="${i}">${d.label}</option>`).join("");

  const updateTimeSlots = (i) => {
    const date = dates[i].date;
    const nowTime = new Date();
    const slots = [];

    let start = new Date(date);

    if (i === 0) {
      // Если сегодня — учитываем +1.5 часа от текущего момента
      start.setHours(nowTime.getHours(), nowTime.getMinutes(), 0, 0);
      start = new Date(start.getTime() + 90 * 60 * 1000); // +1.5 часа

      // Округляем до ближайших 30 минут
      const mins = start.getMinutes();
      if (mins < 30) {
        start.setMinutes(30, 0, 0);
      } else {
        start.setHours(start.getHours() + 1, 0, 0, 0);
      }
    } else {
      // Если не сегодня — с 7:00 утра
      start.setHours(7, 0, 0, 0);
    }

    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    end.setHours(2, 0, 0, 0); // до 2:00 ночи следующего дня

    while (start < end) {
      const endSlot = new Date(start.getTime() + 30 * 60 * 1000);
      const fmt = d => d.toTimeString().slice(0, 5);
      slots.push(`${fmt(start)}–${fmt(endSlot)}`);
      start.setTime(endSlot.getTime());
    }

    timeEl.innerHTML = `<option value="" disabled selected>Выберите время</option>` +
      slots.map(s => `<option value="${s}">${s}</option>`).join("");

    calcCost();
  };

  dateEl.addEventListener("change", () => updateTimeSlots(parseInt(dateEl.value)));
  timeEl.addEventListener("change", calcCost);
}

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

  window.initMap = () => {
    const waitForInput = setInterval(() => {
      const input = document.getElementById("deliveryAddress");
      if (!input) return;
      clearInterval(waitForInput);
      initMapLogic(input);
    }, 100);
  };

  function initMapLogic(input) {
    const tbilisi = { lat: 41.7151, lng: 44.8271 };
    const map = new google.maps.Map(document.getElementById("map"), {
      center: tbilisi,
      zoom: 13,
    });

    const marker = new google.maps.Marker({ map, position: tbilisi, draggable: true });
  
   const geoButton = document.createElement("button");
geoButton.textContent = "📍 Определить местоположение";
geoButton.style.display = "block";
geoButton.style.width = "100%";
geoButton.style.padding = "0.7rem";
geoButton.style.fontSize = "14px";
geoButton.style.borderRadius = "8px";
geoButton.style.border = "none";
geoButton.style.marginTop = "2rem";  // 🔥 Вот тут добавили отступ сверху
geoButton.style.marginBottom = "0.5rem";
geoButton.style.background = "#3a3a3a";
geoButton.style.color = "white";
geoButton.style.cursor = "pointer";
geoButton.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";

const mapContainer = document.getElementById("map").parentElement;
mapContainer.insertBefore(geoButton, document.getElementById("map"));  // Вставляем перед картой
geoButton.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const userLoc = new google.maps.LatLng(latitude, longitude);
        marker.setPosition(userLoc);
        map.setCenter(userLoc);
        coords = { lat: latitude, lng: longitude };
        getAddressFromCoords(coords);
        calcCost();
      },
      (err) => {
        console.warn("Геолокация отклонена или недоступна", err);
      }
    );
  }
});

    const suggestionBox = document.createElement("div");
    suggestionBox.id = "suggestionBox";
    input.parentElement.appendChild(suggestionBox);

    const positionBox = () => {
      const rect = input.getBoundingClientRect();
      suggestionBox.style.position = "absolute";
      suggestionBox.style.top = window.scrollY + rect.bottom + "px";
      suggestionBox.style.left = window.scrollX + rect.left + "px";
      suggestionBox.style.width = rect.width + "px";
    };

    window.addEventListener("resize", positionBox);
    window.addEventListener("scroll", positionBox);

    let timeout;
    input.addEventListener("input", () => {
      clearTimeout(timeout);
      const query = input.value.trim();
      if (query.length < 3) {
        suggestionBox.style.display = "none";
        return;
      }

      timeout = setTimeout(async () => {
        const url = `https://google-proxy-phpb.onrender.com/fetch?q=${encodeURIComponent(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&language=ru&components=country:ge`
        )}`;

        try {
          const res = await fetch(url);
          const data = await res.json();
          suggestionBox.innerHTML = "";

          if (data.predictions?.length) {
            positionBox();
            data.predictions.forEach(p => {
              const div = document.createElement("div");
              div.textContent = p.description;
              div.onclick = async () => {
                input.value = p.description;
                suggestionBox.style.display = "none";

                const detailsUrl = `https://google-proxy-phpb.onrender.com/fetch?q=${encodeURIComponent(
                  `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=geometry`
                )}`;

                const res2 = await fetch(detailsUrl);
                const data2 = await res2.json();

                if (data2.result?.geometry?.location) {
                  const { lat, lng } = data2.result.geometry.location;
                  coords = { lat, lng };
                  const loc = new google.maps.LatLng(lat, lng);
                  marker.setPosition(loc);
                  map.setCenter(loc);
                  calcCost();
                }
              };
              suggestionBox.appendChild(div);
            });
            suggestionBox.style.display = "block";
          } else {
            suggestionBox.style.display = "none";
          }
        } catch (err) {
          console.error("Failed to fetch suggestions", err);
          suggestionBox.style.display = "none";
        }
      }, 400);
    });

    marker.addListener("dragend", async () => {
      coords = marker.getPosition().toJSON();
      getAddressFromCoords(coords);
      calcCost();

      try {
        const geocodeUrl = `https://google-proxy-phpb.onrender.com/fetch?q=${encodeURIComponent(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&language=ru`
        )}`;
        const geocodeRes = await fetch(geocodeUrl);
        const geocodeData = await geocodeRes.json();
        const newAddress = geocodeData.results?.[0]?.formatted_address;
        if (newAddress) {
          input.value = newAddress;
        }
      } catch (e) {
        console.error("Ошибка при обратном геокодировании:", e);
      }
    });

    async function getAddressFromCoords(coords) {
      const url = `https://google-proxy-phpb.onrender.com/fetch?q=${encodeURIComponent(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&language=ru`
      )}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        const address = data.results?.[0]?.formatted_address;
        if (address) {
          const input = document.getElementById("deliveryAddress");
          if (input) input.value = address;
        }
      } catch (err) {
        console.error("Не удалось получить адрес по координатам", err);
      }
    }

    generateOptions();
    updateCartValue();
    setupFieldHighlighting();
  }

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
