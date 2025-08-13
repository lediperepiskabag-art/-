const catalogEl = document.getElementById('catalog');
const fBrand = document.getElementById('f-brand');
const fType = document.getElementById('f-type');
const fPrice = document.getElementById('f-price');

let productsData = [];

fetch('products.js')
  .then(() => {
    productsData = window.products;
    renderCatalog(productsData);
  });

function renderCatalog(products) {
  catalogEl.innerHTML = '';
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <strong>${p.price} грн</strong><br>
      <button onclick="addToCart(${p.id})">Додати в кошик</button>
    `;
    catalogEl.appendChild(div);
  });
}

function addToCart(id) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let product = productsData.find(p => p.id === id);
  let existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('[data-cart-count]').textContent = count;
}

updateCartCount();
