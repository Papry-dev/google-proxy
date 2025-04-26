(function () {
  let cartValue = 0;
  let coords = null;

  function findCartAmount() {
    return (
      document.querySelector("#cart_amount") ||
      document.querySelector(".cart__amount span") ||
      document.querySelector("#cart_panel_amount") ||
      document.querySelector(".cart-panel__price")
    );
  }

  function updateCartValue() {
    const el = findCartAmount();
    if (!el) {
      console.warn("❗ Элемент с суммой корзины не найден");
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

  // ... дальше твой весь код initMap, initMapLogic, оформление, геопозиция, подсказки и т.д. — без изменений

})();