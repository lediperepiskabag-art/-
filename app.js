// Утиліти локального сховища
const CART_KEY = 'shop_cart';

const getCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
};
const saveCart = (arr) => localStorage.setItem(CART_KEY, JSON.stringify(arr));
const isInCart = (id) => getCart().some(x => x.id === id);
const addToCart = (id) => {
  const cart = getCart();
  if (!cart.some(x => x.id === id)) {
    const product = window.PRODUCTS.find(p => p.id === id);
    if (product) { cart.push({id, qty: 1}); saveCart(cart); }
  }
};
const removeFromCart = (id) => {
  const cart = getCart().filter(x => x.id !== id);
  saveCart(cart);
};
const cartCount = () => getCart().reduce((a,b)=>a + (b.qty||1), 0);

const formatUAH = (n) => new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(n);

// Відображення лічильника кошика в шапці
function renderHeaderCount() {
  const el = document.querySelector('[data-cart-count]');
  if (el) el.textContent = cartCount();
}

// ГОЛОВНА: рендер каталогу
function renderCatalog() {
  const grid = document.querySelector('#catalog');
  if (!grid) return;

  // Зібрати значення фільтрів
  const brand = document.querySelector('#f-brand').value;
  const type = document.querySelector('#f-type').value;
  const priceSort = document.querySelector('#f-price').value; // 'asc','desc','none'

  let list = [...window.PRODUCTS];
  if (brand !== 'Усі') list = list.filter(p => p.brand === brand);
  if (type !== 'Усі') list = list.filter(p => p.type === type);

  if (priceSort === 'asc') list.sort((a,b)=>a.price-b.price);
  if (priceSort === 'desc') list.sort((a,b)=>b.price-a.price);

  grid.innerHTML = list.map(p => `
    <a class="card" href="product.html?id=${p.id}" aria-label="${p.name}">
      <img loading="lazy" src="${p.img}" alt="${p.name}">
      <div class="body">
        <div class="title">${p.name}</div>
        <div class="desc">${p.desc}</div>
        <div class="price">${formatUAH(p.price)}</div>
      </div>
    </a>
  `).join('');
}

// Заповнення селектів типів
function populateTypeSelect() {
  const sel = document.querySelector('#f-type');
  if (!sel) return;
  const types = Array.from(new Set(window.PRODUCTS.map(p=>p.type))).sort();
  sel.innerHTML = ['Усі', ...types].map(t=>`<option value="${t}">${t}</option>`).join('');
}

// СТОРІНКА ТОВАРУ
function renderProductPage() {
  const wrap = document.querySelector('#product');
  if (!wrap) return;

  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  const p = window.PRODUCTS.find(x => x.id === id);
  if (!p) { wrap.innerHTML = '<p>Товар не знайдено.</p>'; return; }

  const already = isInCart(p.id);
  wrap.innerHTML = `
    <div class="product">
      <div><img src="${p.img}" alt="${p.name}"></div>
      <div>
        <h1>${p.name}</h1>
        <div class="meta">${p.brand} • ${p.type}</div>
        <p>${p.desc}</p>
        <p class="price" style="font-size:1.4rem">${formatUAH(p.price)}</p>
        <div id="cartArea">
          ${already 
            ? '<div class="badge">Вже у кошику</div>'
            : '<button class="btn" id="addBtn">Додати в кошик</button>'
          }
        </div>
      </div>
    </div>
  `;

  if (!already) {
    document.querySelector('#addBtn').addEventListener('click', () => {
      addToCart(p.id);
      const area = document.querySelector('#cartArea');
      area.innerHTML = '<div class="badge">Вже у кошику</div>';
      renderHeaderCount();
    });
  }
}

// КОШИК
function renderCartPage() {
  const listEl = document.querySelector('#cart-list');
  if (!listEl) return;

  const items = getCart().map(x => {
    const p = window.PRODUCTS.find(pp=>pp.id===x.id);
    return p ? { ...p, qty: x.qty || 1 } : null;
  }).filter(Boolean);

  // Лічильник у заголовку
  const titleCount = document.querySelector('[data-cart-title-count]');
  if (titleCount) titleCount.textContent = items.reduce((a,b)=>a+b.qty,0);

  if (items.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;opacity:.85">Кошик порожній</p>';
    document.querySelector('[data-total]').textContent = formatUAH(0);
    return;
  }

  listEl.innerHTML = items.map(p => `
    <div class="cart-item" data-id="${p.id}">
      <input type="checkbox" class="pick" aria-label="Вибрати" checked>
      <img src="${p.img}" alt="${p.name}">
      <div>
        <div class="name">${p.name}</div>
        <div class="meta">${p.brand} • ${p.type}</div>
        <div class="price">${formatUAH(p.price)}</div>
      </div>
      <div class="remove" role="button" tabindex="0">Прибрати</div>
    </div>
  `).join('');

  const updateTotal = () => {
    const rows = [...document.querySelectorAll('.cart-item')];
    const total = rows.reduce((sum,row)=>{
      const id = Number(row.getAttribute('data-id'));
      const checked = row.querySelector('.pick').checked;
      if (!checked) return sum;
      const prod = items.find(pp=>pp.id===id);
      return sum + (prod?.price || 0) * (prod?.qty || 1);
    },0);
    document.querySelector('[data-total]').textContent = formatUAH(total);
  };

  // Події
  listEl.querySelectorAll('.pick').forEach(cb => cb.addEventListener('change', updateTotal));
  listEl.querySelectorAll('.remove').forEach(btn => btn.addEventListener('click', (e)=>{
    const row = e.target.closest('.cart-item');
    const id = Number(row.getAttribute('data-id'));
    removeFromCart(id);
    row.remove();
    renderHeaderCount();
    // оновити заголовок-лічильник
    const titleCount2 = document.querySelector('[data-cart-title-count]');
    if (titleCount2) titleCount2.textContent = cartCount();
    updateTotal();
    if (document.querySelectorAll('.cart-item').length === 0) {
      listEl.innerHTML = '<p style="text-align:center;opacity:.85">Кошик порожній</p>';
    }
  }));

  updateTotal();
}

// Загальне ініціювання
document.addEventListener('DOMContentLoaded', () => {
  renderHeaderCount();
  populateTypeSelect();
  renderCatalog();
  renderProductPage();
  renderCartPage();

  // Прив'язати фільтри
  const selBrand = document.querySelector('#f-brand');
  const selType = document.querySelector('#f-type');
  const selPrice = document.querySelector('#f-price');
  [selBrand, selType, selPrice].forEach(el => el && el.addEventListener('change', renderCatalog));
});
// Заміна в renderCartPage
listEl.innerHTML = items.map(p => `
  <div class="cart-item" data-id="${p.id}">
    <input type="checkbox" class="pick" aria-label="Вибрати" checked>
    <img src="${p.img}" alt="${p.name}">
    <div>
      <div class="name">${p.name}</div>
      <div class="meta">${p.brand} • ${p.type}</div>
      <div class="price">${formatUAH(p.price)}</div>
    </div>
    <div class="qty-control">
      <button class="qty-minus">-</button>
      <span class="qty">${p.qty}</span>
      <button class="qty-plus">+</button>
    </div>
    <div class="remove" role="button" tabindex="0">Прибрати</div>
  </div>
`).join('');

// Логіка для +/-
listEl.querySelectorAll('.qty-plus').forEach(btn => btn.addEventListener('click', e => {
  const row = e.target.closest('.cart-item');
  const id = Number(row.getAttribute('data-id'));
  const cart = getCart();
  const item = cart.find(x => x.id === id);
  if (item) { item.qty++; saveCart(cart); }
  row.querySelector('.qty').textContent = item.qty;
  renderHeaderCount();
  updateTotal();
}));

listEl.querySelectorAll('.qty-minus').forEach(btn => btn.addEventListener('click', e => {
  const row = e.target.closest('.cart-item');
  const id = Number(row.getAttribute('data-id'));
  const cart = getCart();
  const item = cart.find(x => x.id === id);
  if (item && item.qty > 1) {
    item.qty--; saveCart(cart);
    row.querySelector('.qty').textContent = item.qty;
    renderHeaderCount();
    updateTotal();
  }
}));

