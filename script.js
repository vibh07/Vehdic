import { initializeApp }        from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set, push, child } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ── FIREBASE INIT ────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyCr4X0JCSg3GOLTbltdWihl5a4GZs6ipq8",
    authDomain: "vehdic.firebaseapp.com",
    projectId: "vehdic",
    databaseURL: "https://vehdic-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "vehdic.firebasestorage.app",
    messagingSenderId: "544387227261",
    appId: "1:544387227261:web:0ab1783048eb866ce55b14"
};
const firebaseApp   = initializeApp(firebaseConfig);
const db            = getDatabase(firebaseApp);
const auth          = getAuth(firebaseApp);
const googleProvider= new GoogleAuthProvider();

// ── STATE ────────────────────────────────────────────────────────────────────
let cart         = {};
let allProducts  = [];
let products     = [];
let isCheckingOut= false;
let activeView   = 'home';
let pendingCat   = '';
let currentUser  = null;

// Coupon state
let appliedCoupon = null;
const COUPONS = {
    'VEHDIC10':  { type: 'percent', value: 10,  label: '10% off' },
    'WELCOME20': { type: 'percent', value: 20,  label: '20% off' },
    'FLAT50':    { type: 'fixed',   value: 50,  label: '$50 off' },
    'SAVE100':   { type: 'fixed',   value: 100, label: '$100 off' },
    'FREESHIP':  { type: 'ship',    value: 0,   label: 'Free shipping' },
};

// Product detail state
let pdpProduct  = null;
let pdpQty      = 1;

// Avatar colour palette
const AVATAR_COLORS = ['#f42c37','#10b981','#1376f4','#fdc62e','#8b5cf6','#f97316','#06b6d4','#ec4899'];

// ── SEED DATA ────────────────────────────────────────────────────────────────
const svgImg = (emoji, bg='#f5f5f5') => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${bg}"/><text x="200" y="230" font-size="160" text-anchor="middle">${emoji}</text></svg>`)}`;

const dummyProducts = [
    {
        id:"p1", name:"Sony WH-1000XM5", price:349.99, originalPrice:399.99, category:"Audio", rating:4.8, reviews:2341,
        img: svgImg("🎧","#f0f0f0"),
        images: [svgImg("🎧","#f0f0f0"), svgImg("🎧","#e8e8e8"), svgImg("🎧","#ebebeb")],
        desc: "Industry-leading noise cancellation with the new Auto NC Optimizer. Crystal clear hands-free calling with precisely placed microphones. Up to 30 hours battery life with quick charge (3 min = 3 hours).",
        highlights: ["30hr battery life","Multipoint connection","LDAC Hi-Res Audio","Wear detection","Speak-to-Chat"]
    },
    {
        id:"p2", name:"Apple AirPods Pro 2", price:249.99, originalPrice:279.99, category:"Audio", rating:4.9, reviews:5820,
        img: svgImg("🎵","#f5f5f5"),
        images: [svgImg("🎵","#f5f5f5"), svgImg("🎵","#eee"), svgImg("🎵","#e8e8e8")],
        desc: "Up to 2x more Active Noise Cancellation than before. Adaptive Transparency lets you tune out the world while still hearing important sounds. Personalized Spatial Audio with dynamic head tracking.",
        highlights: ["Active Noise Cancellation","Adaptive Transparency","6hr listening time","MagSafe charging case","IPX4 water resistant"]
    },
    {
        id:"p3", name:"Samsung Galaxy Watch 6", price:299.99, originalPrice:329.99, category:"Wearables", rating:4.6, reviews:1203,
        img: svgImg("⌚","#f0f0f0"),
        images: [svgImg("⌚","#f0f0f0"), svgImg("⌚","#e8e8e8"), svgImg("⌚","#ebebeb")],
        desc: "Advanced health monitoring with BioActive Sensor for Body Composition analysis. Sleep Coaching powered by AI. Track over 90 workout types with enhanced GPS accuracy.",
        highlights: ["Advanced BioActive Sensor","Sleep coaching AI","40hr battery","5ATM + IP68","Sapphire Crystal glass"]
    },
    {
        id:"p4", name:"Logitech MX Master 3S", price:99.99, originalPrice:119.99, category:"Accessories", rating:4.7, reviews:876,
        img: svgImg("🖱️","#f5f5f5"),
        images: [svgImg("🖱️","#f5f5f5"), svgImg("🖱️","#eee"), svgImg("🖱️","#e8e8e8")],
        desc: "8K DPI Any-Surface Tracking works even on glass. MagSpeed electromagnetic scrolling — 90% quieter clicks. Flow cross-computer control lets you work seamlessly across Mac and PC.",
        highlights: ["8K DPI Any-Surface Tracking","MagSpeed scrolling","90% quieter clicks","USB-C fast charge","Multi-device Bluetooth"]
    },
    {
        id:"p5", name:"iPad Air M2", price:599.99, originalPrice:649.99, category:"Tablets", rating:4.9, reviews:3102,
        img: svgImg("📱","#f0f0f0"),
        images: [svgImg("📱","#f0f0f0"), svgImg("📱","#e8e8e8"), svgImg("📱","#ebebeb")],
        desc: "Supercharged by the M2 chip — 50% faster than M1. Stunning 10.9 Liquid Retina display. All-day battery life. Works with Apple Pencil and Magic Keyboard.",
        highlights: ["M2 chip performance","10.9 Liquid Retina","All-day battery","5G capable","Center Stage camera"]
    },
    {
        id:"p6", name:"JBL Flip 6", price:129.99, originalPrice:149.99, category:"Audio", rating:4.5, reviews:4231,
        img: svgImg("🔊","#f5f5f5"),
        images: [svgImg("🔊","#f5f5f5"), svgImg("🔊","#eee"), svgImg("🔊","#e8e8e8")],
        desc: "Powerful sound with 2 JBL drivers and 2 separate tweeters. IP67 waterproof and dustproof — perfect for outdoor adventures. JBL PartyBoost connects multiple speakers for a bigger sound.",
        highlights: ["IP67 waterproof","12hr playtime","JBL PartyBoost","USB-C charging","Racetrack-shaped driver"]
    },
    {
        id:"p7", name:"Apple Watch Ultra 2", price:799.99, originalPrice:899.99, category:"Wearables", rating:4.8, reviews:986,
        img: svgImg("⌚","#f0f0f0"),
        images: [svgImg("⌚","#f0f0f0"), svgImg("⌚","#e8e8e8"), svgImg("⌚","#ebebeb")],
        desc: "The most capable and rugged Apple Watch, redesigned with a natural titanium case. Up to 60 hours battery with Low Power mode. Precision dual-frequency GPS. Bright 2000 nit Always-On Retina display.",
        highlights: ["60hr battery life","100m water resistance","Dual-frequency GPS","2000 nit display","S9 SiP chip"]
    },
    {
        id:"p8", name:"Anker PowerCore 26K", price:59.99, originalPrice:79.99, category:"Accessories", rating:4.6, reviews:7823,
        img: svgImg("🔋","#f5f5f5"),
        images: [svgImg("🔋","#f5f5f5"), svgImg("🔋","#eee"), svgImg("🔋","#e8e8e8")],
        desc: "26800mAh massive capacity — enough to charge an iPhone 14 over 6 times. USB-C and dual USB-A ports for simultaneous charging. Compact enough for any bag or backpack.",
        highlights: ["26800mAh capacity","USB-C + dual USB-A","Charges iPhone 6x","PowerIQ 3.0","Trickle-Charge mode"]
    }
];

// ── AUTH STATE LISTENER ──────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        cart = loadCartFromStorage(user.uid);
        showApp();
        await bootApp();
    } else {
        currentUser = null;
        showAuthWall();
        hidePageLoader();
    }
});

// ── BOOT ─────────────────────────────────────────────────────────────────────
async function bootApp() {
    setupAppListeners();
    renderCartBadge();
    updateNavAvatar();
    await loadProducts();
}

// ── SHOW / HIDE SCREENS ──────────────────────────────────────────────────────
function showApp() {
    // Auth wall off
    const aw = document.getElementById('authWall');
    aw.classList.remove('view-visible');
    aw.classList.add('view-hidden');
    // App shell on — use display:block without any animation/transform
    const shell = document.getElementById('appShell');
    shell.classList.remove('app-shell-hidden');
    shell.classList.add('app-shell-visible');
}
function showAuthWall() {
    const shell = document.getElementById('appShell');
    shell.classList.add('app-shell-hidden');
    shell.classList.remove('app-shell-visible');
    const aw = document.getElementById('authWall');
    aw.classList.remove('view-hidden');
    aw.classList.add('view-visible');
}

// ── AUTH LISTENERS (run once, no user dependency) ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById('loginPanel').classList.toggle('view-hidden', target !== 'login');
            document.getElementById('registerPanel').classList.toggle('view-hidden', target !== 'register');
            clearAuthErrors();
        });
    });

    // Password toggle
    document.querySelectorAll('.toggle-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const inp = document.getElementById(btn.dataset.target);
            inp.type = inp.type === 'password' ? 'text' : 'password';
            btn.classList.toggle('pass-visible');
        });
    });

    // Password strength
    document.getElementById('regPassword')?.addEventListener('input', e => checkPasswordStrength(e.target.value));

    // Login
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('loginEmail')?.addEventListener('keydown', e => { if(e.key === 'Enter') document.getElementById('loginPassword').focus(); });
    document.getElementById('loginPassword')?.addEventListener('keydown', e => { if(e.key === 'Enter') handleLogin(); });

    // Register
    document.getElementById('registerBtn')?.addEventListener('click', handleRegister);

    // Google
    document.getElementById('googleSignInBtn')?.addEventListener('click', handleGoogleAuth);
    document.getElementById('googleSignUpBtn')?.addEventListener('click', handleGoogleAuth);

    // Forgot password
    document.getElementById('forgotPassBtn')?.addEventListener('click', handleForgotPassword);

    // iOS alert close
    document.getElementById('iosAlertClose')?.addEventListener('click', () =>
        document.getElementById('iosAlertBox').classList.remove('show')
    );
});

// ── AUTH HANDLERS ────────────────────────────────────────────────────────────
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPassword').value;
    clearAuthErrors();

    let valid = true;
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr('loginEmailErr', 'Enter a valid email'); valid = false; }
    if (!pass) { setErr('loginPassErr', 'Enter your password'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('loginBtn');
    setAuthBtnLoading(btn, true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        const msg = friendlyAuthError(err.code);
        setErr('loginPassErr', msg);
    } finally {
        setAuthBtnLoading(btn, false);
    }
}

async function handleRegister() {
    const name  = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass  = document.getElementById('regPassword').value;
    clearAuthErrors();

    let valid = true;
    if (!name)   { setErr('regNameErr', 'Enter your full name'); valid = false; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr('regEmailErr', 'Enter a valid email'); valid = false; }
    if (pass.length < 6) { setErr('regPassErr', 'Password must be 6+ characters'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('registerBtn');
    setAuthBtnLoading(btn, true);
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name });
        // Save to DB
        await set(ref(db, `users/${cred.user.uid}/profile`), {
            name, email, phone: '', address: '', gender: '', avatarColor: AVATAR_COLORS[0], createdAt: Date.now()
        });
    } catch (err) {
        setErr('regEmailErr', friendlyAuthError(err.code));
    } finally {
        setAuthBtnLoading(btn, false);
    }
}

async function handleGoogleAuth() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user   = result.user;
        // Create profile if new user
        const snap = await get(ref(db, `users/${user.uid}/profile`));
        if (!snap.exists()) {
            await set(ref(db, `users/${user.uid}/profile`), {
                name: user.displayName || '', email: user.email || '',
                phone: '', address: '', gender: '',
                avatarColor: AVATAR_COLORS[0], createdAt: Date.now()
            });
        }
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') showAlert('Sign In Failed', friendlyAuthError(err.code));
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();
    clearAuthErrors();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setErr('loginEmailErr', 'Enter your email address first');
        return;
    }
    const btn = document.getElementById('forgotPassBtn');
    btn.textContent = 'Sending…';
    btn.style.opacity = '0.6';
    try {
        await sendPasswordResetEmail(auth, email);
        showAlert('Reset Email Sent ✉️', `A password reset link has been sent to:<br><strong>${email}</strong><br><br>Check your inbox and spam folder.`);
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            setErr('loginEmailErr', 'No account found with this email.');
        } else {
            setErr('loginEmailErr', friendlyAuthError(err.code));
        }
    } finally {
        btn.textContent = 'Forgot password?';
        btn.style.opacity = '1';
    }
}

// ── APP LISTENERS (run after login) ─────────────────────────────────────────
function setupAppListeners() {
    // Scroll reveal
    const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('active'); o.unobserve(e.target); });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // Mobile 3-dot
    const mobileMenuBtn  = document.getElementById('mobileMenuBtn');
    const mobileDropdown = document.getElementById('mobileDropdown');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', e => { e.stopPropagation(); mobileDropdown.classList.toggle('show'); });
        document.addEventListener('click', e => { if (!e.target.closest('.mobile-nav-icons')) mobileDropdown.classList.remove('show'); });
    }

    // Install button
    document.getElementById('installAppBtn')?.addEventListener('click', () =>
        showAlert('Install App', 'To install on iOS:<br>1. Tap the Share icon.<br>2. Select "Add to Home Screen".')
    );

    // Desktop nav
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', e => {
            const txt = link.textContent.trim();
            if (txt === 'Cart')     { e.preventDefault(); openCart(); }
            if (txt === 'Shop')     { e.preventDefault(); switchView('shop'); setActiveNav('Shop'); }
            if (txt === 'My Order') { e.preventDefault(); switchView('orders'); setActiveNav('My Order'); }
            if (txt === 'Home')     { e.preventDefault(); switchView('home'); setActiveNav('Home'); }
            if (txt === 'Profile')  { e.preventDefault(); openProfileSheet(); }
        });
    });

    // Desktop category dropdown
    const navCatBtn  = document.getElementById('navCategoryBtn');
    const navCatDrop = document.getElementById('navCategoryDropdown');
    if (navCatBtn) {
        navCatBtn.addEventListener('click', e => { e.stopPropagation(); navCatDrop.classList.toggle('show'); });
        document.addEventListener('click', () => navCatDrop.classList.remove('show'));
    }

    // Bottom nav (delegated)
    document.querySelector('.bottom-nav').addEventListener('click', e => {
        const item = e.target.closest('.nav-item');
        if (!item) return;
        e.preventDefault();
        const label = item.querySelector('span')?.textContent.trim();
        document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        if      (label === 'Cart')     openCart();
        else if (label === 'My Order') switchView('orders');
        else if (label === 'Shop')     switchView('shop');
        else if (label === 'Category') openCatSheet();
        else                           switchView('home');
    });

    // Category sheet
    document.getElementById('catSheetOverlay')?.addEventListener('click', closeCatSheet);
    document.getElementById('catSheetClose')?.addEventListener('click', closeCatSheet);
    document.querySelectorAll('.cat-card').forEach(card => {
        card.addEventListener('click', () => { closeCatSheet(); switchView('shop', card.dataset.cat || ''); setActiveBottomNav('Shop'); });
    });

    // Shop search (debounced)
    let st;
    document.getElementById('shopSearchInput')?.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => renderShopProducts(), 180); });

    // Cart
    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);

    // Product detail sheet
    document.getElementById('pdpOverlay')?.addEventListener('click', closePDP);
    document.getElementById('pdpClose')?.addEventListener('click', closePDP);
    document.getElementById('pdpQtyMinus')?.addEventListener('click', () => { if(pdpQty>1){pdpQty--;document.getElementById('pdpQtyNum').textContent=pdpQty;} });
    document.getElementById('pdpQtyPlus')?.addEventListener('click', () => { pdpQty++;document.getElementById('pdpQtyNum').textContent=pdpQty; });
    document.getElementById('pdpAddBtn')?.addEventListener('click', () => {
        if(!pdpProduct) return;
        for(let i=0;i<pdpQty;i++) addToCart(pdpProduct.id);
        closePDP();
    });

    // Coupon
    document.getElementById('couponApplyBtn')?.addEventListener('click', applyCoupon);
    document.getElementById('couponInput')?.addEventListener('keydown', e => { if(e.key==='Enter') applyCoupon(); });

    // Profile icon (mobile)
    document.getElementById('profileIconBtn')?.addEventListener('click', openProfileSheet);

    // Profile sheet
    document.getElementById('profileOverlay')?.addEventListener('click', closeProfileSheet);
    document.getElementById('editProfileBtn')?.addEventListener('click', openEditMode);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditMode);
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
    document.getElementById('signOutBtn')?.addEventListener('click', handleSignOut);
    document.getElementById('avatarColorBtn')?.addEventListener('click', cycleAvatarColor);
}

// ── VIEW SWITCHING ────────────────────────────────────────────────────────────
function switchView(name, category = '') {
    pendingCat  = category;
    activeView  = name;
    const views = { home: 'homeContent', shop: 'shopView', orders: 'ordersView' };
    Object.entries(views).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (key === name) { el.classList.remove('view-hidden'); el.classList.add('view-visible'); }
        else              { el.classList.remove('view-visible'); el.classList.add('view-hidden'); }
    });
    if (name === 'shop')   { const i = document.getElementById('shopSearchInput'); if(i) i.value=''; renderShopProducts(category); }
    if (name === 'orders') loadOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setActiveNav(label) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.textContent.trim() === label));
}
function setActiveBottomNav(label) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(n =>
        n.classList.toggle('active', n.querySelector('span')?.textContent.trim() === label)
    );
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
async function loadProducts() {
    document.querySelector('.products-grid').innerHTML = Array(4).fill('<div class="loading-skeleton"></div>').join('');
    try {
        const snap = await get(child(ref(db), 'products'));
        if (snap.exists()) {
            allProducts = Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] }));
        } else {
            allProducts = dummyProducts;
            allProducts.forEach(p => set(ref(db, 'products/' + p.id), p));
        }
        products = [...allProducts];
        buildCategoryDropdowns();
        renderProducts(products);
    } catch (err) {
        document.querySelector('.products-grid').innerHTML = `<p class="grid-empty-msg">Failed to load. Refresh.</p>`;
    } finally {
        hidePageLoader();
    }
}

function buildProductCard(p) {
    const ci = cart[p.id], inCart = ci && ci.qty > 0;
    const card = document.createElement('div');
    card.className = 'product-card ios-tap';
    card.innerHTML = `
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        ${p.category ? `<span class="product-badge">${p.category}</span>` : ''}
        <h3>${p.name}</h3>
        <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
        ${inCart
            ? `<div class="qty-controls"><button class="qty-btn minus ios-tap" data-id="${p.id}">−</button><span class="qty-num">${ci.qty}</span><button class="qty-btn plus ios-tap" data-id="${p.id}">+</button></div>`
            : `<button class="add-to-cart-btn ios-tap" data-id="${p.id}">Add to Cart</button>`}`;
    return card;
}

function renderProducts(list) {
    const grid = document.querySelector('.products-grid');
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = `<p class="grid-empty-msg">No products found.</p>`; return; }
    const f = document.createDocumentFragment();
    list.forEach(p => f.appendChild(buildProductCard(p)));
    grid.appendChild(f);
    attachGridListeners(grid);
}

function renderShopProducts(cat = pendingCat) {
    pendingCat = cat;
    const grid  = document.getElementById('shopProductsGrid');
    const query = document.getElementById('shopSearchInput')?.value.trim().toLowerCase() || '';
    const list  = allProducts.filter(p =>
        (!cat || p.category === cat) &&
        (!query || p.name.toLowerCase().includes(query) || (p.category||'').toLowerCase().includes(query))
    );
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = `<p class="grid-empty-msg">No products found.</p>`; return; }
    const f = document.createDocumentFragment();
    list.forEach(p => f.appendChild(buildProductCard(p)));
    grid.appendChild(f);
    attachGridListeners(grid);
}

function attachGridListeners(grid) {
    if (grid._h) grid.removeEventListener('click', grid._h);
    grid._h = e => {
        const add   = e.target.closest('.add-to-cart-btn');
        const plus  = e.target.closest('.qty-btn.plus');
        const minus = e.target.closest('.qty-btn.minus');
        const card  = e.target.closest('.product-card');
        if (add)   { addToCart(add.dataset.id); return; }
        if (plus)  { changeQty(plus.dataset.id, +1); return; }
        if (minus) { changeQty(minus.dataset.id, -1); return; }
        // Tap anywhere else on card → open PDP
        if (card) {
            const pid = card.querySelector('[data-id]')?.dataset.id;
            if (pid) openPDP(pid);
        }
    };
    grid.addEventListener('click', grid._h);
}

function buildCategoryDropdowns() {
    const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    const drop  = document.getElementById('navCategoryDropdown');
    if (!drop) return;
    drop.innerHTML = `<a class="nav-cat-item ios-tap" data-cat="">All</a>`;
    cats.forEach(c => drop.innerHTML += `<a class="nav-cat-item ios-tap" data-cat="${c}">${c}</a>`);
    drop.querySelectorAll('.nav-cat-item').forEach(item =>
        item.addEventListener('click', e => { e.preventDefault(); drop.classList.remove('show'); switchView('shop', item.dataset.cat); setActiveNav('Shop'); })
    );
}

// ── CART ──────────────────────────────────────────────────────────────────────
function loadCartFromStorage(uid) {
    try { return JSON.parse(localStorage.getItem(`vehdic_cart_${uid}`)) || {}; }
    catch { return {}; }
}
function saveCartToStorage() {
    if (!currentUser) return;
    localStorage.setItem(`vehdic_cart_${currentUser.uid}`, JSON.stringify(cart));
}

function addToCart(pid) {
    const p = allProducts.find(x => x.id === pid); if(!p) return;
    if (cart[pid]) cart[pid].qty++; else cart[pid] = { ...p, qty: 1 };
    saveCartToStorage(); showToast(`Added ${p.name}!`); renderCartBadge(); refreshGrid();
    if (document.getElementById('cartSidebar').classList.contains('show')) renderCartUI();
}
function changeQty(pid, d) {
    if (!cart[pid]) return;
    cart[pid].qty += d;
    if (cart[pid].qty <= 0) delete cart[pid];
    saveCartToStorage(); renderCartBadge(); refreshGrid();
    if (document.getElementById('cartSidebar').classList.contains('show')) renderCartUI();
}
function refreshGrid() {
    if (activeView === 'shop') renderShopProducts(); else renderProducts(products);
}

function openCart()  { document.getElementById('cartOverlay').classList.add('show'); document.getElementById('cartSidebar').classList.add('show'); renderCartUI(); }
function closeCart() { document.getElementById('cartOverlay').classList.remove('show'); document.getElementById('cartSidebar').classList.remove('show'); }

function renderCartUI() {
    const con = document.getElementById('cartItemsContainer');
    const items = Object.values(cart);

    if (!items.length) {
        con.innerHTML = `<p class="empty-cart-msg">Your cart is empty.</p>`;
        updateCartTotals(0);
        appliedCoupon = null;
        updateCouponStatus('');
        return;
    }

    let subtotal = 0;
    const f = document.createDocumentFragment();
    items.forEach(item => {
        const sub = parseFloat(item.price) * item.qty;
        subtotal += sub;
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <img class="cart-item-img" src="${item.img||''}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">$${parseFloat(item.price).toFixed(2)} each</p>
                <p class="cart-item-sub">Subtotal: <strong>$${sub.toFixed(2)}</strong></p>
            </div>
            <div class="cart-item-controls">
                <button class="cart-qty-btn minus ios-tap" data-id="${item.id}">−</button>
                <span>${item.qty}</span>
                <button class="cart-qty-btn plus ios-tap" data-id="${item.id}">+</button>
            </div>`;
        f.appendChild(el);
    });
    con.innerHTML = '';
    con.appendChild(f);
    con.querySelectorAll('.cart-qty-btn').forEach(b =>
        b.addEventListener('click', () => changeQty(b.dataset.id, b.classList.contains('plus') ? 1 : -1))
    );
    updateCartTotals(subtotal);
}

function updateCartTotals(subtotal) {
    const subtotalEl  = document.getElementById('cartSubtotal');
    const totalEl     = document.getElementById('cartTotalPrice');
    const discountRow = document.getElementById('discountRow');
    const discountEl  = document.getElementById('cartDiscount');
    const discLabelEl = document.getElementById('discountLabel');
    const shippingEl  = document.getElementById('cartShipping');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

    let discount = 0;
    let shippingFree = subtotal >= 50; // free shipping above $50

    if (appliedCoupon) {
        const c = appliedCoupon;
        if (c.type === 'percent') discount = subtotal * (c.value / 100);
        else if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
        else if (c.type === 'ship') shippingFree = true;
    }

    discount = Math.min(discount, subtotal);
    const shipping = shippingFree ? 0 : 4.99;
    const total = Math.max(0, subtotal - discount + shipping);

    if (discountRow) {
        discountRow.style.display = discount > 0 ? 'flex' : 'none';
        if (discountEl) discountEl.textContent = `−$${discount.toFixed(2)}`;
        if (discLabelEl && appliedCoupon) discLabelEl.textContent = `${appliedCoupon.label}`;
    }
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free 🎉' : `$${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function applyCoupon() {
    const input = document.getElementById('couponInput');
    const code = input?.value.trim().toUpperCase();
    if (!code) { updateCouponStatus('Enter a coupon code', 'error'); return; }

    const coupon = COUPONS[code];
    if (!coupon) {
        updateCouponStatus('Invalid coupon code ✗', 'error');
        appliedCoupon = null;
    } else {
        appliedCoupon = { ...coupon, code };
        updateCouponStatus(`${coupon.label} applied ✓`, 'success');
        if(input) input.blur();
    }
    renderCartUI();
}

function updateCouponStatus(msg, type='') {
    const el = document.getElementById('couponStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = `coupon-status ${type}`;
}

function renderCartBadge() {
    const q = Object.values(cart).reduce((s,i) => s+i.qty, 0);
    document.querySelectorAll('.bottom-nav .nav-item').forEach(n => {
        if (n.querySelector('span')?.textContent.trim() !== 'Cart') return;
        let badge = n.querySelector('.cart-badge');
        if (q > 0) { if (!badge) { n.style.position='relative'; n.insertAdjacentHTML('beforeend',`<span class="cart-badge">${q}</span>`); } else badge.textContent=q; }
        else if (badge) badge.remove();
    });
}

// ── CHECKOUT ──────────────────────────────────────────────────────────────────
async function handleCheckout() {
    if (isCheckingOut) return;
    const items = Object.values(cart);
    if (!items.length) { showAlert('Cart Empty','Add items first.'); return; }
    const btn = document.getElementById('checkoutBtn');
    isCheckingOut = true; btn.innerHTML = `<span class="btn-spinner"></span> Processing…`; btn.style.opacity='0.75';
    try {
        const subtotal = items.reduce((s,i) => s + parseFloat(i.price)*i.qty, 0);
        let discount = 0;
        const shippingFree = subtotal >= 50 || (appliedCoupon && appliedCoupon.type==='ship');
        if (appliedCoupon) {
            if (appliedCoupon.type==='percent') discount = subtotal*(appliedCoupon.value/100);
            else if (appliedCoupon.type==='fixed') discount = Math.min(appliedCoupon.value, subtotal);
        }
        const shipping = shippingFree ? 0 : 4.99;
        const total = Math.max(0, subtotal - discount + shipping);
        await set(push(ref(db,`orders/${currentUser.uid}`)), { items, subtotal:parseFloat(subtotal.toFixed(2)), discount:parseFloat(discount.toFixed(2)), coupon:appliedCoupon?.code||null, shipping, totalAmount:parseFloat(total.toFixed(2)), timestamp:Date.now(), status:'Pending' });
        cart={}; appliedCoupon=null; saveCartToStorage(); renderCartUI(); renderCartBadge(); refreshGrid(); updateCouponStatus('');
        showToast('Order placed! 🎉'); closeCart();
    } catch(err) { showAlert('Order Failed','Something went wrong. Try again.'); }
    finally { btn.textContent='Place Order'; btn.style.opacity='1'; isCheckingOut=false; }
}

// ── ORDERS ────────────────────────────────────────────────────────────────────
async function loadOrders() {
    const con = document.getElementById('ordersContainer');
    con.innerHTML = `<div class="orders-loading"><div class="vehdic-loader"><span>V</span><span>e</span><span>h</span><span>d</span><span>i</span><span>c</span></div></div>`;
    try {
        const snap = await get(ref(db,`orders/${currentUser.uid}`));
        if (!snap.exists()) { con.innerHTML=`<div class="orders-empty"><p>No orders yet. Shop something! 🛍️</p></div>`; return; }
        const orders = Object.keys(snap.val()).map(k=>({id:k,...snap.val()[k]})).sort((a,b)=>b.timestamp-a.timestamp);
        const f = document.createDocumentFragment();
        orders.forEach(o => {
            const el = document.createElement('div'); el.className='order-card';
            el.innerHTML=`<div class="order-header"><div><span class="order-id">#${o.id.slice(-6).toUpperCase()}</span><span class="order-date">${new Date(o.timestamp).toLocaleString()}</span></div><span class="order-status status-${o.status.toLowerCase()}">${o.status}</span></div><div class="order-items">${o.items.map(i=>`<div class="order-item-row"><span>${i.name} × ${i.qty||1}</span><span>$${(parseFloat(i.price)*(i.qty||1)).toFixed(2)}</span></div>`).join('')}</div><div class="order-total"><span>Total</span><strong>$${parseFloat(o.totalAmount).toFixed(2)}</strong></div>`;
            f.appendChild(el);
        });
        con.innerHTML=''; con.appendChild(f);
    } catch(err) { con.innerHTML=`<p class="grid-empty-msg">Failed to load orders.</p>`; }
}

// ── CATEGORY SHEET ────────────────────────────────────────────────────────────
function openCatSheet()  { document.getElementById('catSheetOverlay').classList.add('show'); document.getElementById('catSheet').classList.add('show'); }
function closeCatSheet() {
    document.getElementById('catSheetOverlay').classList.remove('show'); document.getElementById('catSheet').classList.remove('show');
    setActiveBottomNav(activeView==='shop'?'Shop':activeView==='orders'?'My Order':'Home');
}

// ── PROFILE SHEET ─────────────────────────────────────────────────────────────
async function openProfileSheet() {
    document.getElementById('profileOverlay').classList.add('show');
    document.getElementById('profileSheet').classList.add('show');
    closeEditMode();
    await loadProfileData();
}
function closeProfileSheet() {
    document.getElementById('profileOverlay').classList.remove('show');
    document.getElementById('profileSheet').classList.remove('show');
}

async function loadProfileData() {
    if (!currentUser) return;
    // Show what we know immediately — no "Loading…"
    const quickName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
    document.getElementById('profileDisplayName').textContent = quickName;
    document.getElementById('profileDisplayEmail').textContent = currentUser.email || '';
    try {
        const snap = await get(ref(db, `users/${currentUser.uid}/profile`));
        const data = snap.exists() ? snap.val() : {};
        const name = data.name || currentUser.displayName || quickName;
        document.getElementById('profileDisplayName').textContent = name;
        document.getElementById('profileDisplayEmail').textContent = currentUser.email || '';
        document.getElementById('profilePhone').textContent   = data.phone   || '—';
        document.getElementById('profileGender').textContent  = data.gender  || '—';
        document.getElementById('profileAddress').textContent = data.address || '—';
        // Avatar
        const color    = data.avatarColor || AVATAR_COLORS[0];
        const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        const av = document.getElementById('profileAvatarLarge');
        av.style.background = color;
        document.getElementById('profileInitials').textContent = initials;
        // Store current color for cycling
        av.dataset.colorIdx = AVATAR_COLORS.indexOf(color) >= 0 ? AVATAR_COLORS.indexOf(color) : 0;
    } catch(e) { console.error(e); }
}

function openEditMode() {
    document.getElementById('profileViewMode').classList.add('view-hidden');
    document.getElementById('profileEditMode').classList.remove('view-hidden');
    // Pre-fill fields
    document.getElementById('editName').value    = document.getElementById('profileDisplayName').textContent !== 'Loading…' ? document.getElementById('profileDisplayName').textContent : '';
    document.getElementById('editPhone').value   = document.getElementById('profilePhone').textContent   !== '—' ? document.getElementById('profilePhone').textContent   : '';
    document.getElementById('editAddress').value = document.getElementById('profileAddress').textContent !== '—' ? document.getElementById('profileAddress').textContent : '';
    const g = document.getElementById('profileGender').textContent;
    document.querySelectorAll('input[name="gender"]').forEach(r => { r.checked = r.value === g; });
}
function closeEditMode() {
    document.getElementById('profileViewMode').classList.remove('view-hidden');
    document.getElementById('profileEditMode').classList.add('view-hidden');
}

async function saveProfile() {
    const btn  = document.getElementById('saveProfileBtn');
    const name = document.getElementById('editName').value.trim();
    const phone= document.getElementById('editPhone').value.trim();
    const addr = document.getElementById('editAddress').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked')?.value || '';
    const color  = AVATAR_COLORS[parseInt(document.getElementById('profileAvatarLarge').dataset.colorIdx || 0)];

    if (!name) { showToast('Name cannot be empty'); return; }

    btn.innerHTML = `<span class="btn-spinner"></span> Saving…`; btn.style.opacity='0.75';
    try {
        await set(ref(db, `users/${currentUser.uid}/profile`), { name, email: currentUser.email, phone, address: addr, gender, avatarColor: color, updatedAt: Date.now() });
        await updateProfile(currentUser, { displayName: name });
        showToast('Profile updated! ✨');
        closeEditMode();
        await loadProfileData();
        updateNavAvatar();
    } catch(e) { showToast('Save failed. Try again.'); }
    finally { btn.textContent='Save Changes'; btn.style.opacity='1'; }
}

function cycleAvatarColor() {
    const av  = document.getElementById('profileAvatarLarge');
    const idx = ((parseInt(av.dataset.colorIdx || 0)) + 1) % AVATAR_COLORS.length;
    av.dataset.colorIdx = idx;
    av.style.background = AVATAR_COLORS[idx];
}

async function updateNavAvatar() {
    if (!currentUser) return;
    try {
        const snap = await get(ref(db, `users/${currentUser.uid}/profile`));
        const data = snap.exists() ? snap.val() : {};
        const name    = data.name || currentUser.displayName || 'U';
        const initials= name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        const color   = data.avatarColor || AVATAR_COLORS[0];
        const av = document.getElementById('navAvatar');
        if (!av) return;
        av.innerHTML = `<span>${initials}</span>`;
        av.style.cssText = `background:${color};color:#fff;font-size:11px;font-weight:800;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;`;
    } catch(e) {}
}

async function handleSignOut() {
    try {
        cart = {}; closeProfileSheet();
        await signOut(auth);
        showToast('Signed out. See you soon!');
    } catch(e) { showAlert('Error','Could not sign out.'); }
}

// ── PAGE LOADER ───────────────────────────────────────────────────────────────
function hidePageLoader() {
    const l = document.getElementById('pageLoader'); if(!l) return;
    l.classList.add('fade-out');
    setTimeout(() => { l.classList.remove('show','fade-out'); }, 500);
}

// ── TOAST & ALERT ─────────────────────────────────────────────────────────────
function showToast(msg='Done!') {
    const t = document.getElementById('iosToast');
    t.querySelector('span').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}
function showAlert(title, msg) {
    document.getElementById('iosAlertTitle').textContent = title;
    document.getElementById('iosAlertMessage').innerHTML = msg;
    document.getElementById('iosAlertBox').classList.add('show');
}

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────
function setErr(id, msg) { const el=document.getElementById(id); if(el){el.textContent=msg;} }
function clearAuthErrors() {
    ['loginEmailErr','loginPassErr','regNameErr','regEmailErr','regPassErr'].forEach(id => setErr(id,''));
}
function setAuthBtnLoading(btn, loading) {
    if (loading) { btn.innerHTML=`<span class="btn-spinner"></span>`; btn.disabled=true; }
    else         { btn.innerHTML=`<span>${btn.id==='loginBtn'?'Sign In':'Create Account'}</span>`; btn.disabled=false; }
}
function friendlyAuthError(code) {
    // Firebase v9/v10 unified error codes
    const map = {
        'auth/user-not-found':         'No account found with this email.',
        'auth/wrong-password':         'Incorrect password. Please try again.',
        'auth/invalid-credential':     'Incorrect email or password. Please check and try again.',
        'auth/invalid-login-credentials':'Incorrect email or password. Please check and try again.',
        'auth/email-already-in-use':   'This email is already registered. Try signing in.',
        'auth/invalid-email':          'Please enter a valid email address.',
        'auth/weak-password':          'Password must be at least 6 characters.',
        'auth/too-many-requests':      'Too many failed attempts. Please wait a few minutes.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/user-disabled':          'This account has been disabled.',
        'auth/popup-blocked':          'Popup was blocked. Please allow popups for this site.',
        'auth/cancelled-popup-request':'Sign in cancelled.',
        'auth/operation-not-allowed':  'This sign-in method is not enabled.',
    };
    return map[code] || `Sign in failed. Please try again. (${code})`;
}
function checkPasswordStrength(val) {
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !val) { if(fill) fill.style.width='0%'; if(label) label.textContent=''; return; }
    let score = 0;
    if (val.length >= 6)  score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
        {w:'20%', color:'#f42c37', text:'Weak'},
        {w:'40%', color:'#f97316', text:'Fair'},
        {w:'60%', color:'#fdc62e', text:'Good'},
        {w:'80%', color:'#10b981', text:'Strong'},
        {w:'100%',color:'#059669', text:'Excellent'},
    ];
    const l = levels[Math.min(score, 4)];
    fill.style.width  = l.w;
    fill.style.background = l.color;
    label.textContent = l.text;
    label.style.color = l.color;
}

// ── PRODUCT DETAIL PAGE (PDP) ─────────────────────────────────────────────────
function openPDP(productId) {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return;
    pdpProduct = p;
    pdpQty = 1;

    // Populate
    document.getElementById('pdpTitle').textContent    = p.name;
    document.getElementById('pdpPrice').textContent    = `$${parseFloat(p.price).toFixed(2)}`;
    document.getElementById('pdpBadge').textContent    = p.category || '';
    document.getElementById('pdpQtyNum').textContent   = '1';
    document.getElementById('pdpDesc').textContent     = p.desc || 'Premium quality product from Vehdic store.';

    // Original price + discount tag
    const origEl = document.getElementById('pdpOrigPrice');
    const tagEl  = document.getElementById('pdpDiscountTag');
    if (p.originalPrice && p.originalPrice > p.price) {
        const discPct = Math.round((1 - p.price / p.originalPrice) * 100);
        origEl.textContent = `$${parseFloat(p.originalPrice).toFixed(2)}`;
        origEl.style.display = '';
        tagEl.textContent = `${discPct}% OFF`;
        tagEl.style.display = '';
    } else {
        origEl.style.display = 'none';
        tagEl.style.display  = 'none';
    }

    // Stars
    const r = p.rating || 4.5;
    const fullStars = Math.floor(r);
    const half = r % 1 >= 0.5;
    let stars = '★'.repeat(fullStars) + (half ? '½' : '') + '☆'.repeat(5 - fullStars - (half?1:0));
    document.getElementById('pdpStars').textContent = stars;
    document.getElementById('pdpReviewCount').textContent = p.reviews ? `(${p.reviews.toLocaleString()} reviews)` : '';

    // Highlights
    const hl = document.getElementById('pdpHighlights');
    hl.innerHTML = '';
    if (p.highlights?.length) {
        const ul = document.createElement('ul');
        ul.className = 'pdp-highlights-list';
        p.highlights.forEach(h => {
            const li = document.createElement('li');
            li.textContent = h;
            ul.appendChild(li);
        });
        hl.appendChild(ul);
    }

    // Gallery — use images array or fallback to single img
    const imgs = p.images?.length ? p.images : [p.img];
    const mainImg = document.getElementById('pdpMainImg');
    mainImg.src = imgs[0];
    mainImg.alt = p.name;

    const thumbsEl = document.getElementById('pdpThumbnails');
    thumbsEl.innerHTML = '';
    if (imgs.length > 1) {
        imgs.forEach((src, i) => {
            const t = document.createElement('button');
            t.className = `pdp-thumb ios-tap ${i === 0 ? 'active' : ''}`;
            t.innerHTML = `<img src="${src}" alt="${p.name} view ${i+1}">`;
            t.addEventListener('click', () => {
                mainImg.src = src;
                thumbsEl.querySelectorAll('.pdp-thumb').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
            });
            thumbsEl.appendChild(t);
        });
    }

    // Update add button based on cart state
    updatePDPCartBtn();

    // Show
    document.getElementById('pdpOverlay').classList.add('show');
    document.getElementById('pdpSheet').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function updatePDPCartBtn() {
    if (!pdpProduct) return;
    const btn = document.getElementById('pdpAddBtn');
    const inCart = cart[pdpProduct.id];
    if (inCart) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg> Add More (${inCart.qty} in cart)`;
        btn.style.background = '#10b981';
    } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M5 3h1.81l2.4 10.8c.16.71.8 1.2 1.53 1.2h8.52c.73 0 1.37-.49 1.53-1.2L23 5H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="2" fill="currentColor"/><circle cx="18" cy="20" r="2" fill="currentColor"/></svg> Add to Cart`;
        btn.style.background = '';
    }
}

function closePDP() {
    document.getElementById('pdpOverlay').classList.remove('show');
    document.getElementById('pdpSheet').classList.remove('show');
    document.body.style.overflow = '';
    pdpProduct = null;
}
