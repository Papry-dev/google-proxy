(function () {
  let cartValue = 0;
  let coords = null;

  function updateCartValue() {
    const el = document.querySelector("#cart_amount") || document.querySelector(".cart__amount span");
    if (!el) {
      console.warn("\u2757 \u042dлемент #cart_amount не найден");
      return;
    }

    const raw = el.innerText || "0₾";
    cartValue = parseFloat(raw.replace(/[\u20be,]/g, ".").replace(/[^\d.]/g, "")) || 0;

    const cartValueInput = document.getElementById("cartValue");
    if (cartValueInput) {
      cartValueInput.value = `${cartValue.toFixed(2)} ₾`;
    }

    console.log("\ud83d\uded2 \u041eбновлена сумма корзины:", cartValue);
  }

  setInterval(updateCartValue, 1000);

  const deliveryCostInput = document.getElementById("deliveryCost");
  const totalCostInput = document.getElementById("totalCost");

  const calcCost = async () => {
    const time = document.getElementById("deliverySlot")?.value;
    if (!coords || !time) return;

    const label = document.getElementById("deliveryDate").selectedOptions[0]?.textContent;
    const datetime = `${label}, ${time}`;

    try {
      const res = await fetch("https://google-proxy-phpb.onrender.com/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coords.lat,
          lon: coords.lng,
          time: datetime,
          cart: cartValue // <<-- исправлено здесь
        })
      });

      const data = await res.json();
      if (!data || data.deliveryCost === undefined || data.deliveryCost === null) {
        deliveryCostInput.value = "\u041fо согласованию";
        totalCostInput.value = "—";
        return;
      }

      const delivery = parseFloat(data.deliveryCost || 0);
      deliveryCostInput.value = `${delivery.toFixed(2)} ₾`;
      totalCostInput.value = `${(delivery + cartValue).toFixed(2)} ₾`;
    } catch (err) {
      console.error("\u041eшибка при расчете доставки:", err);
      deliveryCostInput.value = "\u041eшибка";
    }
  };

  // Остальная часть initMap, initMapLogic и весь остальной код остаётся без изменений

})();
