// embed.js с собственной реализацией автоподсказок через Google API (fetch)
(function () {
  const cartRaw = document.getElementById("cart_amount")?.innerText || "26,10₾";
  const cartValue = parseFloat(cartRaw.replace(/[₾,]/g, '.')) || 0;
  let coords = null;
  let addressSelected = false;
  const apiKey = "AIzaSyDRj1_fUDJqKatTrU4DMXAnVliqzAHPXjA";

  const style = document.createElement('style');
  style.textContent = `
    #delivery-widget * { box-sizing: border-box; }
    #delivery-widget {
      background: #121212; color: white; font-family: Arial, sans-serif;
      padding: 1rem; border-radius: 12px; margin-top: 1rem;
    }
    #delivery-widget input, #delivery-widget select {
      width: 100%; padding: 0.5rem; border-radius: 6px; border: none; margin-top: 0.4rem;
    }
    #map { height: 300px; margin-top: 1rem; border-radius: 10px; }
    #suggestions {
      background: #fff; color: black; border-radius: 8px; box-shadow: 0 0 5px #0003;
      margin-top: 0.3rem; position: absolute; width: calc(100% - 2rem);
      z-index: 9999;
    }
    .suggestion-item {
      padding: 0.5rem; cursor: pointer;
    }
    .suggestion-item:hover {
      background-color: #eee;
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "delivery-widget";
  container.innerHTML = `
    <label>Адрес доставки
      <input type="text" id="deliveryAddress" placeholder="Введите адрес" />
      <div id="suggestions"></div>
    </label>
    <div id="map"></div>
  `;
  document.getElementById("delivery-block")?.appendChild(container);

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initDeliveryMap`;
  script.async = true;
  document.body.appendChild(script);

  window.initDeliveryMap = () => {
    const tbilisi = { lat: 41.7151, lng: 44.8271 };
    const map = new google.maps.Map(document.getElementById("map"), {
      center: tbilisi,
      zoom: 13,
    });
    const marker = new google.maps.Marker({ position: tbilisi, map, draggable: true });
    coords = tbilisi;

    const input = document.getElementById("deliveryAddress");
    const suggestions = document.getElementById("suggestions");

    input.addEventListener("input", async () => {
      const query = input.value.trim();
      if (query.length < 3) return (suggestions.innerHTML = "");
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${apiKey}&language=ru&components=country:ge`;
      const res = await fetch("https://proxy-server-zhn1.onrender.com/fetch?q=" + encodeURIComponent(url));
      const data = await res.json();
      suggestions.innerHTML = "";
      if (!data.predictions) return;

      data.predictions.forEach((item) => {
        const el = document.createElement("div");
        el.className = "suggestion-item";
        el.innerText = item.description;
        el.onclick = async () => {
          input.value = item.description;
          suggestions.innerHTML = "";
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${apiKey}`;
          const detailRes = await fetch("https://proxy-server-zhn1.onrender.com/fetch?q=" + encodeURIComponent(detailUrl));
          const details = await detailRes.json();
          const location = details.result.geometry.location;
          coords = location;
          addressSelected = true;
          map.setCenter(location);
          marker.setPosition(location);
        };
        suggestions.appendChild(el);
      });
    });

    marker.addListener("dragend", () => {
      coords = marker.getPosition().toJSON();
      addressSelected = true;
    });
  };
})();
