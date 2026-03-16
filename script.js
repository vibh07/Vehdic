import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set, push, child } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ─────────────────────────────────────────────
// FIREBASE CONFIGURATION
// ─────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyCr4X0JCSg3GOLTbltdWihl5a4GZs6ipq8",
    authDomain: "vehdic.firebaseapp.com",
    projectId: "vehdic",
    databaseURL: "https://vehdic-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "vehdic.firebasestorage.app",
    messagingSenderId: "544387227261",
    appId: "1:544387227261:web:0ab1783048eb866ce55b14"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ─────────────────────────────────────────────
// STATE
// Cart structure: { [productId]: { ...productData, qty: number } }
// ─────────────────────────────────────────────
let cart = loadCartFromStorage();
let products = [];       // currently displayed (after filters)
let allProducts = [];    // full unfiltered master list
let isCheckingOut = false;

// ─────────────────────────────────────────────
// CART PERSISTENCE  (FIX: cart was lost on refresh)
// ─────────────────────────────────────────────
function loadCartFromStorage() {
    try { return JSON.parse(localStorage.getItem('vehdic_cart')) || {}; }
    catch { return {}; }
}
function saveCartToStorage() {
    localStorage.setItem('vehdic_cart', JSON.stringify(cart));
}

// ─────────────────────────────────────────────
// DUMMY PRODUCTS (DB seed / fallback)
// ─────────────────────────────────────────────
const dummyProducts = [
    { id: "p1", name: "Sony WH-1000XM5",      price: 349.99, category: "Audio",       img: "https://via.placeholder.com/200x200/f0f0f0/222222?text=Sony+XM5" },
    { id: "p2", name: "Apple AirPods Pro 2",   price: 249.99, category: "Audio",       img: "https://via.placeholder.com/200x200/f0f0f0/222222?text=AirPods+Pro" },
    { id: "p3", name: "Samsung Galaxy Watch 6",price: 299.99, category: "Wearables",   img: "https://via.placeholder.com/200x200/f0f0f0/222222?text=Galaxy+Watch" },
    { id: "p4", name: "Logitech MX Master 3S", price:  99.99, category: "Accessories", img: "https://via.placeholder.com/200x200/f0f0f0/222222?text=MX+Master" },
    { id: "p5", name: "iPad Air M2",           price: 599.99, category: "Tablets",     img: "https://via.placeholder.com/200x200/f0f0f0/222222?text=iPad+Air" },
    { id: "p6", name: "JBL Flip 6",            price: 129.99, category: "Audio",       img: "https://via.placeholder.com/200x200/f0f0f0/222222?text=JBL+Flip+6" },
    { id: "p7", name: "Apple Watch Ultra 2",   price: 799.99, category: "Wearables",   img: "https://via.placeholder.com/200x200/f0f0f0/222222?text=Apple+Watch" },
    { id: "p8", name: "Anker PowerCore 26K",   price:  59.99, category: "Accessories", img: "https://via.placeholder.com/200x200/f0f0f0/222222?text=Anker+26K" }
];

// ─────────────────────────────────────────────
// DOM READY
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Scroll Reveal
    const revealObs = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('active'); obs.unobserve(e.target); });
    }, { threshold: 0.10, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // Mobile 3-dot dropdown
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDropdown = document.getElementById('mobileDropdown');
    if (mobileMenuBtn && mobileDropdown) {
        mobileMenuBtn.addEventListener('click', e => {
            e.stopPropagation();
            mobileDropdown.classList.toggle('show');
        });
        document.addEventListener('click', e => {
            if (!e.target.closest('.mobile-nav-icons')) {
                mobileDropdown.classList.remove('show');
            }
        });
    }

    // Install App button
    document.getElementById('installAppBtn')?.addEventListener('click', () =>
        showAlert('Install App', 'To install this app on iOS:<br>1. Tap the Share icon below.<br>2. Select "Add to Home Screen".')
    );

    // iOS Alert close
    document.getElementById('iosAlertClose')?.addEventListener('click', () =>
        document.getElementById('iosAlertBox').classList.remove('show')
    );

    // Bottom nav
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const label = item.querySelector('span')?.textContent.trim();
            bottomNavItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            if (label === 'Cart')          openCart();
            else if (label === 'My Order') showOrdersView();
            else if (label === 'Shop')     showShopView();
            else if (label === 'Category') openCatSheet();
            else showHomeView();
        });
    });

    // Desktop Cart link
    document.querySelectorAll('.nav-links a').forEach(link => {
        const txt = link.textContent.trim();
        if (txt === 'Cart') link.addEventListener('click', e => { e.preventDefault(); openCart(); });
        if (txt === 'Shop') link.addEventListener('click', e => { e.preventDefault(); showShopView(); setActiveNav('Shop'); });
        if (txt === 'My Order') link.addEventListener('click', e => { e.preventDefault(); showOrdersView(); setActiveNav('My Order'); });
        if (txt === 'Home') link.addEventListener('click', e => { e.preventDefault(); showHomeView(); setActiveNav('Home'); });
    });

    // Desktop Category dropdown toggle
    const navCategoryBtn = document.getElementById('navCategoryBtn');
    const navCategoryDropdown = document.getElementById('navCategoryDropdown');
    if (navCategoryBtn && navCategoryDropdown) {
        navCategoryBtn.addEventListener('click', e => {
            e.stopPropagation();
            navCategoryDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => navCategoryDropdown.classList.remove('show'));
    }

    // Mobile Category dropdown toggle — REMOVED (now uses bottom sheet)

    // Category bottom sheet
    document.getElementById('catSheetOverlay')?.addEventListener('click', closeCatSheet);
    document.getElementById('catSheetClose')?.addEventListener('click', closeCatSheet);
    document.querySelectorAll('.cat-card').forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.cat || '';
            closeCatSheet();
            showShopView(cat);
            setActiveBottomNav('Shop');
        });
    });

    // Shop page search
    document.getElementById('shopSearchInput')?.addEventListener('input', () => {
        const activeCat = document.querySelector('.nav-cat-item.active-cat')?.dataset.cat || '';
        renderShopProducts(activeCat);
    });

    // Cart sidebar close
    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);

    // Checkout (FIX: removed { once:true }, now guarded by isCheckingOut flag)
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);

    // Search & filter
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('categoryFilter')?.addEventListener('change', applyFilters);

    // Boot
    loadProducts();
    renderCartBadge();
});

// ─────────────────────────────────────────────
// VIEW SWITCHING
// ─────────────────────────────────────────────
function hideAllViews() {
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('ordersView').style.display = 'none';
    document.getElementById('shopView').style.display = 'none';
}
function showHomeView() {
    hideAllViews();
    document.getElementById('homeContent').style.display = '';
}
function showOrdersView() {
    hideAllViews();
    document.getElementById('ordersView').style.display = '';
    loadOrders();
}
function showShopView(filterCategory = '') {
    hideAllViews();
    document.getElementById('shopView').style.display = '';
    // Reset search input
    const shopSearch = document.getElementById('shopSearchInput');
    if (shopSearch) shopSearch.value = '';
    renderShopProducts(filterCategory);
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
async function loadProducts() {
    const grid = document.querySelector('.products-grid');
    // Skeleton loaders while fetching
    grid.innerHTML = Array(4).fill('<div class="loading-skeleton"></div>').join('');

    try {
        const snapshot = await get(child(ref(db), 'products'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            allProducts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        } else {
            allProducts = dummyProducts;
            allProducts.forEach(p => set(ref(db, 'products/' + p.id), p));
        }
        products = [...allProducts];
        populateCategoryFilter();
        renderProducts(products);
    } catch (err) {
        console.error('Product fetch error:', err);
        grid.innerHTML = `<p style="text-align:center;width:100%;padding:40px;color:#999">Failed to load products. Please refresh.</p>`;
    }
}

function renderShopProducts(filterCategory = '') {
    const grid = document.getElementById('shopProductsGrid');
    const query = document.getElementById('shopSearchInput')?.value.trim().toLowerCase() || '';
    const list = allProducts.filter(p => {
        const matchCat = !filterCategory || p.category === filterCategory;
        const matchSearch = !query || p.name.toLowerCase().includes(query) || (p.category||'').toLowerCase().includes(query);
        return matchCat && matchSearch;
    });

    grid.innerHTML = '';
    if (list.length === 0) {
        grid.innerHTML = `<p style="text-align:center;width:100%;padding:40px;color:#999">No products found.</p>`;
        return;
    }
    list.forEach(product => {
        const cartItem = cart[product.id];
        const inCart = cartItem && cartItem.qty > 0;
        const card = document.createElement('div');
        card.className = 'product-card ios-tap';
        card.innerHTML = `
            <img src="${product.img}" alt="${product.name}" loading="lazy">
            ${product.category ? `<span class="product-badge">${product.category}</span>` : ''}
            <h3>${product.name}</h3>
            <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
            ${inCart
                ? `<div class="qty-controls">
                    <button class="qty-btn minus ios-tap" data-id="${product.id}">−</button>
                    <span class="qty-num">${cartItem.qty}</span>
                    <button class="qty-btn plus ios-tap" data-id="${product.id}">+</button>
                   </div>`
                : `<button class="add-to-cart-btn ios-tap" data-id="${product.id}">Add to Cart</button>`
            }
        `;
        grid.appendChild(card);
    });
    grid.addEventListener('click', handleGridClick, { once: true });
}


function populateCategoryFilter() {
    const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

    // Desktop navbar dropdown
    const desktopDrop = document.getElementById('navCategoryDropdown');
    if (desktopDrop) {
        desktopDrop.innerHTML = `<a class="nav-cat-item ios-tap" data-cat="">All</a>`;
        cats.forEach(cat => {
            desktopDrop.innerHTML += `<a class="nav-cat-item ios-tap" data-cat="${cat}">${cat}</a>`;
        });
        desktopDrop.querySelectorAll('.nav-cat-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                desktopDrop.classList.remove('show');
                showShopView(item.dataset.cat);
                setActiveNav('Shop');
            });
        });
    }

    // Mobile navbar dropdown
    const mobileDrop = document.getElementById('mobileCategoryDropdown');
    if (mobileDrop) {
        mobileDrop.innerHTML = `<a class="ios-tap mobile-cat-item" data-cat="">All</a>`;
        cats.forEach(cat => {
            mobileDrop.innerHTML += `<div class="ios-divider"></div><a class="ios-tap mobile-cat-item" data-cat="${cat}">${cat}</a>`;
        });
        mobileDrop.querySelectorAll('.mobile-cat-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                mobileDrop.classList.remove('show');
                showShopView(item.dataset.cat);
                setActiveBottomNav('Shop');
            });
        });
    }
}

function setActiveNav(label) {
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.toggle('active', a.textContent.trim() === label);
    });
}
function setActiveBottomNav(label) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(n => {
        n.classList.toggle('active', n.querySelector('span')?.textContent.trim() === label);
    });
}

function renderProducts(list) {
    const grid = document.querySelector('.products-grid');
    grid.innerHTML = '';

    if (list.length === 0) {
        grid.innerHTML = `<p style="text-align:center;width:100%;padding:40px;color:#999">No products found.</p>`;
        return;
    }

    list.forEach(product => {
        const cartItem = cart[product.id];
        const inCart = cartItem && cartItem.qty > 0;
        const card = document.createElement('div');
        card.className = 'product-card ios-tap';
        card.innerHTML = `
            <img src="${product.img}" alt="${product.name}" loading="lazy">
            ${product.category ? `<span class="product-badge">${product.category}</span>` : ''}
            <h3>${product.name}</h3>
            <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
            ${inCart
                ? `<div class="qty-controls">
                    <button class="qty-btn minus ios-tap" data-id="${product.id}">−</button>
                    <span class="qty-num">${cartItem.qty}</span>
                    <button class="qty-btn plus ios-tap" data-id="${product.id}">+</button>
                   </div>`
                : `<button class="add-to-cart-btn ios-tap" data-id="${product.id}">Add to Cart</button>`
            }
        `;
        grid.appendChild(card);
    });

    // Single delegated listener for the whole grid
    grid.addEventListener('click', handleGridClick, { once: true });
}

function handleGridClick(e) {
    const add   = e.target.closest('.add-to-cart-btn');
    const plus  = e.target.closest('.qty-btn.plus');
    const minus = e.target.closest('.qty-btn.minus');
    if (add)   addToCart(add.dataset.id);
    if (plus)  changeQty(plus.dataset.id, +1);
    if (minus) changeQty(minus.dataset.id, -1);
}

// ─────────────────────────────────────────────
// CART LOGIC
// ─────────────────────────────────────────────
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    if (cart[productId]) cart[productId].qty += 1;
    else cart[productId] = { ...product, qty: 1 };
    saveCartToStorage();
    showToast(`Added ${product.name}!`);
    renderCartBadge();
    renderProducts(products);
    if (document.getElementById('cartSidebar').classList.contains('show')) renderCartUI();
}

function changeQty(productId, delta) {
    if (!cart[productId]) return;
    cart[productId].qty += delta;
    if (cart[productId].qty <= 0) delete cart[productId];
    saveCartToStorage();
    renderCartBadge();
    renderProducts(products);
    if (document.getElementById('cartSidebar').classList.contains('show')) renderCartUI();
}

function openCart() {
    document.getElementById('cartOverlay').classList.add('show');
    document.getElementById('cartSidebar').classList.add('show');
    renderCartUI();
}
function closeCart() {
    document.getElementById('cartOverlay').classList.remove('show');
    document.getElementById('cartSidebar').classList.remove('show');
}

function renderCartUI() {
    const container = document.getElementById('cartItemsContainer');
    const totalEl   = document.getElementById('cartTotalPrice');
    const cartItems = Object.values(cart);

    if (cartItems.length === 0) {
        container.innerHTML = `<p class="empty-cart-msg">Your cart is empty.</p>`;
        totalEl.textContent = '$0.00';
        return;
    }

    let total = 0;
    container.innerHTML = '';
    cartItems.forEach(item => {
        const subtotal = parseFloat(item.price) * item.qty;
        total += subtotal;
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${parseFloat(item.price).toFixed(2)} × ${item.qty} = <strong>$${subtotal.toFixed(2)}</strong></p>
            </div>
            <div class="cart-item-controls">
                <button class="cart-qty-btn minus ios-tap" data-id="${item.id}">−</button>
                <span>${item.qty}</span>
                <button class="cart-qty-btn plus ios-tap" data-id="${item.id}">+</button>
            </div>
        `;
        container.appendChild(el);
    });

    totalEl.textContent = `$${total.toFixed(2)}`;
    container.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', () =>
            changeQty(btn.dataset.id, btn.classList.contains('plus') ? 1 : -1)
        );
    });
}

function renderCartBadge() {
    const totalQty = Object.values(cart).reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => {
        if (nav.querySelector('span')?.textContent.trim() !== 'Cart') return;
        let badge = nav.querySelector('.cart-badge');
        if (totalQty > 0) {
            if (!badge) { nav.style.position = 'relative'; nav.insertAdjacentHTML('beforeend', `<span class="cart-badge">${totalQty}</span>`); }
            else badge.textContent = totalQty;
        } else if (badge) badge.remove();
    });
}

// ─────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────
async function handleCheckout() {
    if (isCheckingOut) return;
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) { showAlert('Cart Empty', 'Please add items first.'); return; }

    const btn = document.getElementById('checkoutBtn');
    isCheckingOut = true;
    btn.textContent = 'Processing...';
    btn.style.opacity = '0.7';

    try {
        const total = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
        await set(push(ref(db, 'orders')), {
            items: cartItems,
            totalAmount: parseFloat(total.toFixed(2)),
            timestamp: Date.now(),
            status: 'Pending'
        });
        cart = {};
        saveCartToStorage();
        renderCartUI();
        renderCartBadge();
        renderProducts(products);
        showToast('Order placed! 🎉');
        closeCart();
    } catch (err) {
        console.error('Checkout error:', err);
        showAlert('Order Failed', 'Something went wrong. Please try again.');
    } finally {
        btn.textContent = 'Place Order';
        btn.style.opacity = '1';
        isCheckingOut = false;
    }
}

// ─────────────────────────────────────────────
// ORDER HISTORY
// ─────────────────────────────────────────────
async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = `<div class="orders-loading"><div class="spinner"></div><p>Loading orders…</p></div>`;

    try {
        const snapshot = await get(ref(db, 'orders'));
        if (!snapshot.exists()) {
            container.innerHTML = `<div class="orders-empty"><p>No orders yet. Shop something! 🛍️</p></div>`;
            return;
        }
        const data = snapshot.val();
        const orders = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = '';
        orders.forEach(order => {
            const date = new Date(order.timestamp).toLocaleString();
            const el = document.createElement('div');
            el.className = 'order-card';
            el.innerHTML = `
                <div class="order-header">
                    <div>
                        <span class="order-id">#${order.id.slice(-6).toUpperCase()}</span>
                        <span class="order-date">${date}</span>
                    </div>
                    <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(i => `
                        <div class="order-item-row">
                            <span>${i.name} × ${i.qty || 1}</span>
                            <span>$${(parseFloat(i.price) * (i.qty || 1)).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <span>Total</span>
                    <strong>$${parseFloat(order.totalAmount).toFixed(2)}</strong>
                </div>
            `;
            container.appendChild(el);
        });
    } catch (err) {
        console.error('Orders fetch error:', err);
        container.innerHTML = `<p style="text-align:center;padding:40px;color:#999">Failed to load orders.</p>`;
    }
}

// ─────────────────────────────────────────────
// CATEGORY BOTTOM SHEET
// ─────────────────────────────────────────────
function openCatSheet() {
    document.getElementById('catSheetOverlay').classList.add('show');
    document.getElementById('catSheet').classList.add('show');
}
function closeCatSheet() {
    document.getElementById('catSheetOverlay').classList.remove('show');
    document.getElementById('catSheet').classList.remove('show');
    // Restore nav active state after close (don't leave Category highlighted)
    setActiveBottomNav(document.getElementById('shopView').style.display !== 'none' ? 'Shop'
        : document.getElementById('ordersView').style.display !== 'none' ? 'My Order' : 'Home');
}

// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────
function showToast(message = 'Done!') {
    const toast = document.getElementById('iosToast');
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}
function showAlert(title, message) {
    document.getElementById('iosAlertTitle').textContent = title;
    document.getElementById('iosAlertMessage').innerHTML = message;
    document.getElementById('iosAlertBox').classList.add('show');
}
