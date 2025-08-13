function renderCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const container = document.querySelector('#cart-items');
  const totalElem = document.querySelector('#total-price');
  const countElem = document.querySelector('#cart-count');
  let total = 0;
  let count = 0;

  container.innerHTML = '';

  cart.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.name}</span>
      <div class="cart-qty">
        <button class="qty-btn" data-index="${index}" data-action="decrease">-</button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn" data-index="${index}" data-action="increase">+</button>
      </div>
      <span>${item.price * item.quantity} грн</span>
    `;
    container.appendChild(div);
    total += item.price * item.quantity;
    count += item.quantity;
  });

  totalElem.textContent = `${total} грн`;
  countElem.textContent = `(${count} шт.)`;
  updateCartCount();
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('qty-btn')) {
    const index = parseInt(e.target.dataset.index);
    const action = e.target.dataset.action;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (action === 'increase') {
      cart[index].quantity += 1;
    } else if (action === 'decrease') {
      cart[index].quantity = Math.max(1, cart[index].quantity - 1);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
  }
});

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('[data-cart-count]').textContent = count;
}

renderCart();
