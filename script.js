import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set, push, child, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signOut, GoogleAuthProvider, signInWithPopup, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ── FIREBASE ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:"AIzaSyCr4X0JCSg3GOLTbltdWihl5a4GZs6ipq8",
    authDomain:"vehdic.firebaseapp.com",
    projectId:"vehdic",
    databaseURL:"https://vehdic-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket:"vehdic.firebasestorage.app",
    messagingSenderId:"544387227261",
    appId:"1:544387227261:web:0ab1783048eb866ce55b14"
};
const fbApp = initializeApp(firebaseConfig);
const db    = getDatabase(fbApp);
const auth  = getAuth(fbApp);
const gProvider = new GoogleAuthProvider();

// ── STATE ────────────────────────────────────────────────────────────────────
let currentUser   = null;
let cart          = {};
let allProducts   = [];
let products      = [];
let activeView    = 'home';
let pendingCat    = '';
let isCheckingOut = false;
let appliedCoupon = null;
let pdpProduct    = null;
let pdpQty        = 1;
let shopActiveCat = '';

const AVATAR_COLORS = ['#f42c37','#10b981','#1376f4','#fdc62e','#8b5cf6','#f97316','#06b6d4','#ec4899'];
const COUPONS = {
    'ANADI10':  {type:'percent', value:10,  label:'10% off'},
    'WELCOME20': {type:'percent', value:20,  label:'20% off'},
    'FLAT100':   {type:'fixed',   value:100, label:'₹100 off'},
    'SAVE200':   {type:'fixed',   value:200, label:'₹200 off'},
    'FREESHIP':  {type:'ship',    value:0,   label:'Free shipping'},
};

// ── PRODUCT DATA ─────────────────────────────────────────────────────────────
const svgImg = (e,bg='#f5f5f5') => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${bg}"/><text x="200" y="235" font-size="170" text-anchor="middle">${e}</text></svg>`)}`;

const BASE = 'https://anadi.co.in/wp-content/uploads/2024/10/';
const dummyProducts = [
    {
        id:"p1", name:"Gir Ahinsak Nasya", price:610, originalPrice:680,
        category:"Health", rating:4.9, reviews:312, superSpecial:true,
        img: BASE+'WhatsApp-Image-2024-10-19-at-1.33.23-PM-600x960.jpeg',
        images:[
            BASE+'WhatsApp-Image-2024-10-19-at-1.33.23-PM-600x960.jpeg',
            BASE+'WhatsApp-Image-2024-10-14-at-12.03.34-PM-11-600x960.jpeg',
            BASE+'WhatsApp-Image-2024-10-14-at-12.03.34-PM-10-600x960.jpeg',
            BASE+'WhatsApp-Image-2024-10-14-at-12.03.34-PM-9-600x960.jpeg',
        ],
        desc:"Our most prized offering — Gir Ahinsak Nasya is prepared from pure A2 Gir cow ghee using ancient Ayurvedic methods. Nasya therapy (nasal administration) purifies the head, improves clarity, strengthens senses and boosts immunity. 100% chemical-free, preservative-free.",
        highlights:["Pure A2 Gir Cow Ghee base","Ancient Ayurvedic formula","Clears nasal passage & sinuses","Improves memory & focus","No chemicals or preservatives","Available in 10gm variant"]
    },
    {
        id:"p2", name:"Premium Sambrani Cup", price:160, originalPrice:177,
        category:"Puja", rating:4.8, reviews:521,
        img: BASE+'XXXX-600x960.png',
        images:[
            BASE+'XXXX-600x960.png',
            BASE+'WhatsApp-Image-2024-10-05-at-4.25.59-PM-scaled.jpeg',
        ],
        desc:"Premium Sambrani Cups made from pure Benzoin resin and cow dung. Creates a divine, calming fragrance that purifies the air, repels insects and elevates your puja experience. Easy to use — just light and place.",
        highlights:["Pure Benzoin resin","Made with cow dung","Air purifying properties","Insect repellent","Long-lasting fragrance","10 cups per pack"]
    },
    {
        id:"p3", name:"Badi Hawan Tikki", price:330, originalPrice:365,
        category:"Puja", rating:4.7, reviews:289,
        img: BASE+'WhatsApp-Image-2024-10-19-at-1.33.23-PM-1-600x960.jpeg',
        images:[
            BASE+'WhatsApp-Image-2024-10-19-at-1.33.23-PM-1-600x960.jpeg',
            BASE+'WhatsApp-Image-2024-10-05-at-4.46.33-PM-scaled.jpeg',
        ],
        desc:"Traditional Hawan Tikkis made with pure cow dung, ghee and medicinal herbs. Used in Havan ceremonies to purify the atmosphere, remove negative energy and create positive vibrations. Completely natural and non-toxic.",
        highlights:["Pure cow dung base","Infused with medicinal herbs","Purifies atmosphere","No synthetic chemicals","Smokeless & eco-friendly","Pack of 10 tikkis"]
    },
    {
        id:"p4", name:"Dhoop Batti", price:135, originalPrice:150,
        category:"Puja", rating:4.6, reviews:743,
        img: BASE+'WhatsApp-Image-2024-10-19-at-1.39.54-PM-600x960.jpeg',
        images:[
            BASE+'WhatsApp-Image-2024-10-19-at-1.39.54-PM-600x960.jpeg',
            BASE+'WhatsApp-Image-2024-10-05-at-4.25.56-PM-scaled.jpeg',
        ],
        desc:"Handcrafted Dhoop Batti made from pure cow dung, natural resins and aromatic herbs. Fills your home with sacred fragrance, drives away insects and negative energy. No charcoal, no harmful chemicals.",
        highlights:["Pure cow dung base","Natural aromatic herbs","No charcoal used","Drives away insects","Sacred fragrance","Pack of 20 sticks"]
    },
    {
        id:"p5", name:"Choti Hawan Tikki", price:280, originalPrice:310,
        category:"Puja", rating:4.7, reviews:198,
        img: BASE+'WhatsApp-Image-2024-10-19-at-1.32.50-PM-600x960.jpeg',
        images:[
            BASE+'WhatsApp-Image-2024-10-19-at-1.32.50-PM-600x960.jpeg',
            BASE+'WhatsApp-Image-2024-10-05-at-4.26.04-PM-scaled.jpeg',
        ],
        desc:"Smaller variant of our traditional Hawan Tikkis — perfect for daily puja and small havan ceremonies at home. Made from pure cow dung and medicinal herbs. Compact size, powerful purification.",
        highlights:["Compact for daily puja","Pure cow dung & herbs","Creates positive vibrations","Smokeless burning","Eco-friendly & safe","Pack of 15 tikkis"]
    },
    {
        id:"p6", name:"Gau Mutra (Ark)", price:40, originalPrice:44,
        category:"Health", rating:4.5, reviews:156,
        img: BASE+'WhatsApp-Image-2024-10-05-at-4.25.54-PM-scaled.jpeg',
        images:[
            BASE+'WhatsApp-Image-2024-10-05-at-4.25.54-PM-scaled.jpeg',
        ],
        desc:"Pure distilled Gau Mutra (cow urine ark) from our healthy Gir cows. Used in Ayurveda for centuries for its antimicrobial, immunity-boosting and detoxifying properties. Collected hygienically, distilled and bottled fresh.",
        highlights:["Pure Gir cow urine ark","Ayurvedic immunity booster","Antimicrobial properties","Freshly distilled","Hygienically collected","250ml bottle"]
    },
];

// ── AUTH STATE ────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        cart = loadCartFromStorage(user.uid);
        updateNavAvatar();
    } else {
        cart = loadCartFromStorage('guest');
    }
    renderCartBadge();
    hidePageLoader();
});

// ── DOM READY ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadSiteSettings();
    loadCouponsFromDB();
    setupAuthListeners();
    setupAppListeners();
});

function loadSiteSettings() {
    // Use onValue for REALTIME updates — changes from admin reflect immediately
    onValue(ref(db,'siteSettings'), snap => {
        if (!snap.exists()) return;
        const s = snap.val();
        if (s.hero) {
            const h = s.hero;
            if (h.eyebrow)  { const el=document.querySelector('.hero-eyebrow');       if(el) el.textContent=h.eyebrow; }
            if (h.subtitle) { const el=document.querySelector('.hero-text h3');        if(el) el.textContent=h.subtitle; }
            if (h.title)    { const el=document.querySelector('.hero-text h2');        if(el) el.textContent=h.title; }
            if (h.bgText)   { const el=document.querySelector('.hero-bg-text');        if(el) el.textContent=h.bgText; }
            if (h.desc)     { const el=document.querySelector('.hero-sub');            if(el) el.textContent=h.desc; }
            if (h.imgUrl)   { const el=document.querySelector('.hero-img-container img'); if(el) el.src=h.imgUrl; }
        }
        if (s.banner1) {
            const banners=document.querySelectorAll('.sale-banner');
            if (banners[0]) {
                if (s.banner1.leftTitle)  { const e=banners[0].querySelector('.banner-left h2');  if(e) e.innerHTML=s.banner1.leftTitle.replace(' ','<br>'); }
                if (s.banner1.discount)   { const e=banners[0].querySelector('.discount');         if(e) e.textContent=s.banner1.discount; }
                if (s.banner1.rightTitle) { const e=banners[0].querySelector('.banner-right h2'); if(e) e.textContent=s.banner1.rightTitle; }
                if (s.banner1.desc)       { const e=banners[0].querySelector('.desc');             if(e) e.textContent=s.banner1.desc; }
                if (s.banner1.imgUrl)     { const e=banners[0].querySelector('.banner-product-img'); if(e) e.src=s.banner1.imgUrl; }
            }
        }
        if (s.banner2) {
            const banners=document.querySelectorAll('.sale-banner');
            if (banners[1]) {
                if (s.banner2.leftTitle)  { const e=banners[1].querySelector('.banner-left h2');  if(e) e.innerHTML=s.banner2.leftTitle.replace(' ','<br>'); }
                if (s.banner2.discount)   { const e=banners[1].querySelector('.discount');         if(e) e.textContent=s.banner2.discount; }
                if (s.banner2.rightTitle) { const e=banners[1].querySelector('.banner-right h2'); if(e) e.textContent=s.banner2.rightTitle; }
                if (s.banner2.desc)       { const e=banners[1].querySelector('.desc');             if(e) e.textContent=s.banner2.desc; }
                if (s.banner2.imgUrl)     { const e=banners[1].querySelector('.banner-product-img'); if(e) e.src=s.banner2.imgUrl; }
            }
        }
        if (s.section) {
            if (s.section.title)    { const e=document.querySelector('.section-title');    if(e) e.textContent=s.section.title; }
            if (s.section.subtitle) { const e=document.querySelector('.section-subtitle'); if(e) e.textContent=s.section.subtitle; }
        }
    }, err => { console.log('siteSettings error (non-critical)', err); });
}

function loadCouponsFromDB() {
    // Realtime — when admin updates coupons, website picks them up immediately
    onValue(ref(db,'coupons'), snap => {
        if (snap.exists()) Object.assign(COUPONS, snap.val());
    });
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function openAuthModal(preferTab = 'login') {
    const overlay = document.getElementById('authModalOverlay');
    overlay.classList.remove('view-hidden');
    overlay.classList.add('view-visible');
    // Set active tab
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === preferTab));
    document.getElementById('loginPanel').classList.toggle('view-hidden', preferTab !== 'login');
    document.getElementById('registerPanel').classList.toggle('view-hidden', preferTab !== 'register');
    clearAuthErrors();
    document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
    const overlay = document.getElementById('authModalOverlay');
    overlay.classList.remove('view-visible');
    overlay.classList.add('view-hidden');
    document.body.style.overflow = '';
}

function setupAuthListeners() {
    // Dismiss (guest)
    document.getElementById('authModalDismiss')?.addEventListener('click', closeAuthModal);
    document.getElementById('authModalOverlay')?.addEventListener('click', e => {
        if (e.target === document.getElementById('authModalOverlay')) closeAuthModal();
    });

    // Tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const t = tab.dataset.tab;
            document.getElementById('loginPanel').classList.toggle('view-hidden', t !== 'login');
            document.getElementById('registerPanel').classList.toggle('view-hidden', t !== 'register');
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
    document.getElementById('loginPassword')?.addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); });
    document.getElementById('loginEmail')?.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('loginPassword')?.focus(); });

    // Register
    document.getElementById('registerBtn')?.addEventListener('click', handleRegister);

    // Google
    document.getElementById('googleSignInBtn')?.addEventListener('click', handleGoogleAuth);
    document.getElementById('googleSignUpBtn')?.addEventListener('click', handleGoogleAuth);

    // Forgot
    document.getElementById('forgotPassBtn')?.addEventListener('click', handleForgotPassword);

    // Alert close
    document.getElementById('iosAlertClose')?.addEventListener('click', () => document.getElementById('iosAlertBox').classList.remove('show'));
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPassword').value;
    clearAuthErrors();
    let ok = true;
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr('loginEmailErr','Enter a valid email'); ok=false; }
    if (!pass) { setErr('loginPassErr','Enter your password'); ok=false; }
    if (!ok) return;
    const btn = document.getElementById('loginBtn');
    setBtnLoading(btn, true, 'Sign In');
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        closeAuthModal();
        showToast('Welcome back! 👋');
    } catch(e) { setErr('loginPassErr', friendlyError(e.code)); }
    finally { setBtnLoading(btn, false, 'Sign In'); }
}

async function handleRegister() {
    const name  = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass  = document.getElementById('regPassword').value;
    clearAuthErrors();
    let ok = true;
    if (!name)   { setErr('regNameErr','Enter your full name'); ok=false; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr('regEmailErr','Enter a valid email'); ok=false; }
    if (pass.length < 6) { setErr('regPassErr','Password must be 6+ characters'); ok=false; }
    if (!ok) return;
    const btn = document.getElementById('registerBtn');
    setBtnLoading(btn, true, 'Create Account');
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, {displayName: name});
        await set(ref(db,`users/${cred.user.uid}/profile`), {name, email, phone:'', address:'', gender:'', avatarColor:AVATAR_COLORS[0], createdAt:Date.now()});
        closeAuthModal();
        showToast('Account created! 🎉');
    } catch(e) { setErr('regEmailErr', friendlyError(e.code)); }
    finally { setBtnLoading(btn, false, 'Create Account'); }
}

async function handleGoogleAuth() {
    try {
        const result = await signInWithPopup(auth, gProvider);
        const snap = await get(ref(db,`users/${result.user.uid}/profile`));
        if (!snap.exists()) {
            await set(ref(db,`users/${result.user.uid}/profile`), {name:result.user.displayName||'', email:result.user.email||'', phone:'', address:'', gender:'', avatarColor:AVATAR_COLORS[0], createdAt:Date.now()});
        }
        closeAuthModal();
        showToast('Signed in! 👋');
    } catch(e) {
        if (e.code !== 'auth/popup-closed-by-user') showAlert('Sign In Failed', friendlyError(e.code));
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();
    clearAuthErrors();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr('loginEmailErr','Enter your email first'); return; }
    const btn = document.getElementById('forgotPassBtn');
    btn.textContent = 'Sending…'; btn.style.opacity = '0.6';
    try {
        await sendPasswordResetEmail(auth, email);
        showAlert('Email Sent ✉️', `Reset link sent to <strong>${email}</strong>. Check your inbox.`);
    } catch(e) { setErr('loginEmailErr', friendlyError(e.code)); }
    finally { btn.textContent = 'Forgot password?'; btn.style.opacity = '1'; }
}

// ── APP LISTENERS ────────────────────────────────────────────────────────────
function setupAppListeners() {
    // Scroll reveal
    const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(e => { if(!e.isIntersecting) return; e.target.classList.add('active'); o.unobserve(e.target); });
    }, {threshold:0.08, rootMargin:"0px 0px -40px 0px"});
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // Mobile 3-dot
    const mmBtn = document.getElementById('mobileMenuBtn'), mmDrop = document.getElementById('mobileDropdown');
    if (mmBtn) {
        mmBtn.addEventListener('click', e => { e.stopPropagation(); mmDrop.classList.toggle('show'); });
        document.addEventListener('click', e => { if(!e.target.closest('.mobile-nav-icons')) mmDrop.classList.remove('show'); });
    }

    // Install
    document.getElementById('mobileCartBtn')?.addEventListener('click', () => openCart());

    // Desktop nav
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.addEventListener('click', e => {
            const t = a.textContent.trim();
            if (t==='Cart')     { e.preventDefault(); openCart(); }
            if (t==='Shop')     { e.preventDefault(); switchView('shop'); setActiveNav('Shop'); }
            if (t==='My Order') { e.preventDefault(); switchView('orders'); setActiveNav('My Order'); }
            if (t==='Home')     { e.preventDefault(); switchView('home'); setActiveNav('Home'); }
            if (t==='Profile')  { e.preventDefault(); handleProfileTap(); }
        });
    });

    // Category dropdown
    const nCBtn = document.getElementById('navCategoryBtn'), nCDrop = document.getElementById('navCategoryDropdown');
    if (nCBtn) {
        nCBtn.addEventListener('click', e => { e.stopPropagation(); nCDrop.classList.toggle('show'); });
        document.addEventListener('click', () => nCDrop.classList.remove('show'));
    }

    // Bottom nav
    document.querySelector('.bottom-nav')?.addEventListener('click', e => {
        const item = e.target.closest('.nav-item'); if(!item) return;
        e.preventDefault();
        const label = item.querySelector('span')?.textContent.trim();
        document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        if      (label==='Cart')     openCart();
        else if (label==='My Order') switchView('orders');
        else if (label==='Shop')     switchView('shop');
        else if (label==='Category') openCatSheet();
        else                         switchView('home');
    });

    // Category sheet
    document.getElementById('catSheetOverlay')?.addEventListener('click', closeCatSheet);
    document.getElementById('catSheetClose')?.addEventListener('click', closeCatSheet);
    document.querySelectorAll('.cat-card').forEach(card => {
        card.addEventListener('click', () => { closeCatSheet(); switchView('shop', card.dataset.cat||''); setActiveBottomNav('Shop'); });
    });

    // Shop search + filter
    const si = document.getElementById('shopSearchInput'), sc = document.getElementById('shopSearchClear');
    let st;
    si?.addEventListener('input', () => {
        clearTimeout(st);
        sc && (sc.style.display = si.value ? '' : 'none');
        st = setTimeout(() => renderShopProducts(), 180);
    });
    sc?.addEventListener('click', () => { if(si) { si.value=''; si.focus(); sc.style.display='none'; renderShopProducts(); } });
    document.getElementById('shopSortSelect')?.addEventListener('change', () => renderShopProducts());

    // Cart
    document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
    document.getElementById('couponApplyBtn')?.addEventListener('click', applyCoupon);
    document.getElementById('couponInput')?.addEventListener('keydown', e => { if(e.key==='Enter') applyCoupon(); });

    // Profile
    document.getElementById('profileIconBtn')?.addEventListener('click', handleProfileTap);
    document.getElementById('profileOverlay')?.addEventListener('click', closeProfileSheet);
    document.getElementById('editProfileBtn')?.addEventListener('click', openEditMode);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditMode);
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
    document.getElementById('signOutBtn')?.addEventListener('click', handleSignOut);
    document.getElementById('avatarColorBtn')?.addEventListener('click', cycleAvatarColor);

    // PDP
    document.getElementById('pdpOverlay')?.addEventListener('click', closePDP);
    document.getElementById('pdpClose')?.addEventListener('click', closePDP);
    document.getElementById('pdpQtyMinus')?.addEventListener('click', () => { if(pdpQty>1){pdpQty--;document.getElementById('pdpQtyNum').textContent=pdpQty;} });
    document.getElementById('pdpQtyPlus')?.addEventListener('click', () => { pdpQty++;document.getElementById('pdpQtyNum').textContent=pdpQty; });
    document.getElementById('pdpAddBtn')?.addEventListener('click', () => {
        if(!pdpProduct) return;
        for(let i=0;i<pdpQty;i++) addToCart(pdpProduct.id);
        closePDP();
    });
}

function handleProfileTap() {
    if (currentUser) openProfileSheet();
    else openAuthModal('login');
}

// ── VIEW SWITCHING ────────────────────────────────────────────────────────────
function switchView(name, category='') {
    pendingCat  = category;
    activeView  = name;
    ['home','shop','orders'].forEach(k => {
        const el = document.getElementById({home:'homeContent',shop:'shopView',orders:'ordersView'}[k]);
        if (k===name) { el.classList.remove('view-hidden'); el.classList.add('view-visible'); }
        else          { el.classList.remove('view-visible'); el.classList.add('view-hidden'); }
    });
    if (name==='shop')   { const i=document.getElementById('shopSearchInput'); if(i){i.value=''; document.getElementById('shopSearchClear').style.display='none';} renderShopProducts(category); }
    if (name==='orders') renderOrdersView();
    window.scrollTo({top:0,behavior:'smooth'});
}

function setActiveNav(label) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.textContent.trim()===label));
}
function setActiveBottomNav(label) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.toggle('active', n.querySelector('span')?.textContent.trim()===label));
}

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
function loadProducts() {
    // Show skeletons initially
    document.querySelector('.products-grid').innerHTML = Array(4).fill('<div class="loading-skeleton"></div>').join('');
    document.getElementById('shopProductsGrid').innerHTML = Array(4).fill('<div class="loading-skeleton"></div>').join('');
    // Use onValue for REALTIME — admin product changes show without refresh
    onValue(ref(db,'products'), snap => {
        // Start with local dummyProducts as base
        allProducts = [...dummyProducts];
        if (snap.exists()) {
            const dbProds = Object.keys(snap.val()).map(k=>({id:k,...snap.val()[k]}));
            // Admin-added products (not in dummy list) get appended
            dbProds.forEach(dp => {
                const idx = allProducts.findIndex(p => p.id === dp.id);
                if (idx >= 0) {
                    // If admin edited a product, use DB version
                    allProducts[idx] = {...allProducts[idx], ...dp};
                } else {
                    allProducts.push(dp);
                }
            });
        } else {
            // No products in DB yet — seed with dummyProducts
            dummyProducts.forEach(p => set(ref(db,'products/'+p.id), {
                id:p.id, name:p.name, price:p.price, originalPrice:p.originalPrice||null,
                category:p.category, rating:p.rating||null, reviews:p.reviews||null,
                img:p.img, images:p.images||[p.img],
                desc:p.desc||'', highlights:p.highlights||[],
                superSpecial:p.superSpecial||false
            }));
        }
        products = [...allProducts];
        buildCategoryUI();
        renderProducts(products);
        if (activeView === 'shop') renderShopProducts(shopActiveCat);
    }, err => {
        console.error('loadProducts error:', err);
        allProducts = [...dummyProducts];
        products = [...allProducts];
        buildCategoryUI();
        renderProducts(products);
        if (activeView === 'shop') renderShopProducts(shopActiveCat);
    });
}

function buildCategoryUI() {
    const cats = [...new Set(allProducts.map(p=>p.category).filter(Boolean))];

    // Desktop dropdown
    const drop = document.getElementById('navCategoryDropdown');
    if (drop) {
        drop.innerHTML = '<a class="nav-cat-item ios-tap" data-cat="">All</a>';
        cats.forEach(c => drop.innerHTML += `<a class="nav-cat-item ios-tap" data-cat="${c}">${c}</a>`);
        drop.querySelectorAll('.nav-cat-item').forEach(item => item.addEventListener('click', e => {
            e.preventDefault(); drop.classList.remove('show'); switchView('shop',item.dataset.cat); setActiveNav('Shop');
        }));
    }

    // Filter chips
    const chipsEl = document.getElementById('shopFilterChips');
    if (chipsEl) {
        // keep "All" chip, add category chips
        cats.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'chip'; btn.dataset.cat = c; btn.textContent = c;
            chipsEl.appendChild(btn);
        });
        chipsEl.addEventListener('click', e => {
            const chip = e.target.closest('.chip');
            if (!chip) return;
            shopActiveCat = chip.dataset.cat;
            chipsEl.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('chip-active', ch===chip));
            renderShopProducts(shopActiveCat);
        });
    }
}

function buildProductCard(p) {
    const ci = cart[p.id], inCart = ci && ci.qty>0;
    const pct = p.originalPrice ? Math.round((1-p.price/p.originalPrice)*100) : 0;
    const div = document.createElement('div');
    div.className = 'product-card ios-tap';
    div.innerHTML = `
        <div class="product-card-img-wrap">
            <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23f5ede0%22%2F%3E%3Ctext%20x%3D%22100%22%20y%3D%22115%22%20font-size%3D%2280%22%20text-anchor%3D%22middle%22%3E%F0%9F%8C%BF%3C%2Ftext%3E%3C%2Fsvg%3E'">
            ${pct>0 ? `<span class="product-sale-tag">-${pct}%</span>` : ''}
        </div>
        ${(p.superSpecial||p.name.includes('Nasya')) ? `<span class="product-super-badge">⭐ Super Special</span>` : (p.category ? `<span class="product-badge">${p.category}</span>` : '')}
        <h3>${p.name}</h3>
        <div class="product-price-row">
            <p class="product-price">₹${p.price.toLocaleString("en-IN")}</p>
            ${p.originalPrice ? `<p class="product-orig-price">₹${p.originalPrice.toLocaleString("en-IN")}</p>` : ''}
        </div>
        ${p.rating ? `<div class="product-rating"><span class="pstar">★</span> ${p.rating} <span class="prev">(${(p.reviews||0).toLocaleString()})</span></div>` : ''}
        ${inCart
            ? `<div class="qty-controls"><button class="qty-btn minus ios-tap" data-id="${p.id}">−</button><span class="qty-num">${ci.qty}</span><button class="qty-btn plus ios-tap" data-id="${p.id}">+</button></div>`
            : `<button class="add-to-cart-btn ios-tap" data-id="${p.id}">Add to Cart</button>`}`;
    return div;
}

function renderProducts(list) {
    const grid = document.querySelector('.products-grid');
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML='<p class="grid-empty-msg">No products found.</p>'; return; }
    const f = document.createDocumentFragment();
    list.forEach(p => f.appendChild(buildProductCard(p)));
    grid.appendChild(f);
    attachGridListeners(grid);
}

function renderShopProducts(cat=shopActiveCat) {
    shopActiveCat = cat;
    const grid  = document.getElementById('shopProductsGrid');
    const query = document.getElementById('shopSearchInput')?.value.trim().toLowerCase()||'';
    const sort  = document.getElementById('shopSortSelect')?.value||'';
    // If products not loaded yet, show skeleton and wait
    if (!allProducts.length) {
        grid.innerHTML = Array(4).fill('<div class="loading-skeleton"></div>').join('');
        return;
    }
    let list = allProducts.filter(p =>
        (!cat||p.category===cat) &&
        (!query||p.name.toLowerCase().includes(query)||(p.category||'').toLowerCase().includes(query))
    );
    if (sort==='price-asc')  list = [...list].sort((a,b)=>a.price-b.price);
    if (sort==='price-desc') list = [...list].sort((a,b)=>b.price-a.price);
    if (sort==='name')       list = [...list].sort((a,b)=>a.name.localeCompare(b.name));
    if (sort==='rating')     list = [...list].sort((a,b)=>(b.rating||0)-(a.rating||0));

    const countEl = document.getElementById('shopResultsCount');
    if (countEl) countEl.textContent = `${list.length} product${list.length!==1?'s':''}`;

    grid.innerHTML='';
    if (!list.length) { grid.innerHTML='<p class="grid-empty-msg">No products found.</p>'; return; }
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
        if (plus)  { changeQty(plus.dataset.id,+1); return; }
        if (minus) { changeQty(minus.dataset.id,-1); return; }
        if (card)  { const pid=card.querySelector('[data-id]')?.dataset.id; if(pid) openPDP(pid); }
    };
    grid.addEventListener('click', grid._h);
}

// ── CART ─────────────────────────────────────────────────────────────────────
function loadCartFromStorage(uid) {
    try { return JSON.parse(localStorage.getItem(`vehdic_cart_${uid}`))||{}; }
    catch { return {}; }
}
function saveCartToStorage() {
    const uid = currentUser ? currentUser.uid : 'guest';
    localStorage.setItem(`vehdic_cart_${uid}`, JSON.stringify(cart));
}

function addToCart(pid) {
    const p = allProducts.find(x=>x.id===pid); if(!p) return;
    if (cart[pid]) cart[pid].qty++; else cart[pid]={...p,qty:1};
    saveCartToStorage(); showToast(`Added ${p.name}!`); renderCartBadge(); refreshGrid();
    if (document.getElementById('cartSidebar').classList.contains('show')) renderCartUI();
    if (pdpProduct?.id===pid) updatePDPCartBtn();
}
function changeQty(pid, d) {
    if (!cart[pid]) return;
    cart[pid].qty+=d;
    if (cart[pid].qty<=0) delete cart[pid];
    saveCartToStorage(); renderCartBadge(); refreshGrid();
    if (document.getElementById('cartSidebar').classList.contains('show')) renderCartUI();
}
function refreshGrid() {
    if (activeView==='shop') renderShopProducts(); else renderProducts(products);
}

function openCart()  { document.getElementById('cartOverlay').classList.add('show'); document.getElementById('cartSidebar').classList.add('show'); renderCartUI(); }
function closeCart() { document.getElementById('cartOverlay').classList.remove('show'); document.getElementById('cartSidebar').classList.remove('show'); }

function renderCartUI() {
    const con = document.getElementById('cartItemsContainer');
    const items = Object.values(cart);
    if (!items.length) {
        con.innerHTML=`
            <div class="cart-empty-state">
                <div class="cart-empty-icon">🛒</div>
                <h4>Your cart is empty</h4>
                <p>Add some products to get started</p>
                <button class="cart-shop-now-btn ios-tap" id="cartShopNowBtn">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M3 6h18l-2 15H5L3 6z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4a4 4 0 018 0v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    Shop Now
                </button>
            </div>`;
        document.getElementById('cartShopNowBtn')?.addEventListener('click', () => {
            closeCart();
            switchView('shop');
            setActiveBottomNav('Shop');
        });
        updateCartTotals(0);
        return;
    }
    let sub=0; const f=document.createDocumentFragment();
    items.forEach(item => {
        const s=parseFloat(item.price)*item.qty; sub+=s;
        const el=document.createElement('div'); el.className='cart-item';
        el.innerHTML=`<img class="cart-item-img" src="${item.img||''}" alt="${item.name}"><div class="cart-item-info"><h4>${item.name}</h4><p class="cart-item-price">₹${item.price.toLocaleString("en-IN")} each</p><p class="cart-item-sub">Subtotal: <strong>₹${Math.round(s).toLocaleString("en-IN")}</strong></p></div><div class="cart-item-controls"><button class="cart-qty-btn minus ios-tap" data-id="${item.id}">−</button><span>${item.qty}</span><button class="cart-qty-btn plus ios-tap" data-id="${item.id}">+</button></div>`;
        f.appendChild(el);
    });
    con.innerHTML=''; con.appendChild(f);
    con.querySelectorAll('.cart-qty-btn').forEach(b=>b.addEventListener('click',()=>changeQty(b.dataset.id,b.classList.contains('plus')?1:-1)));
    updateCartTotals(sub);
}

function updateCartTotals(sub) {
    const subtotalEl=document.getElementById('cartSubtotal'), totalEl=document.getElementById('cartTotalPrice');
    const discRow=document.getElementById('discountRow'), discEl=document.getElementById('cartDiscount');
    const discLabel=document.getElementById('discountLabel'), shipEl=document.getElementById('cartShipping');
    if(subtotalEl) subtotalEl.textContent=`₹${Math.round(sub).toLocaleString("en-IN")}`;
    let disc=0, shipFree=sub>=1500;
    if(appliedCoupon){
        if(appliedCoupon.type==='percent') disc=sub*(appliedCoupon.value/100);
        else if(appliedCoupon.type==='fixed') disc=Math.min(appliedCoupon.value,sub);
        else if(appliedCoupon.type==='ship') shipFree=true;
    }
    disc=Math.min(disc,sub);
    const ship=shipFree?0:99;
    const total=Math.max(0,sub-disc+ship);
    if(discRow) discRow.style.display=disc>0?'flex':'none';
    if(discEl) discEl.textContent=`−₹${Math.round(disc).toLocaleString("en-IN")}`;
    if(discLabel&&appliedCoupon) discLabel.textContent=appliedCoupon.label;
    if(shipEl) shipEl.textContent=ship===0?'Free 🎉':`₹${Math.round(ship).toLocaleString("en-IN")}`;
    if(totalEl) totalEl.textContent=`₹${Math.round(total).toLocaleString("en-IN")}`;
}

function applyCoupon() {
    const inp=document.getElementById('couponInput');
    const code=inp?.value.trim().toUpperCase();
    if(!code){updateCouponStatus('Enter a coupon code','error');return;}
    const c=COUPONS[code];
    if(!c){appliedCoupon=null;updateCouponStatus('Invalid coupon code ✗','error');}
    else{appliedCoupon={...c,code};updateCouponStatus(`${c.label} applied ✓`,'success');inp?.blur();}
    renderCartUI();
}
function updateCouponStatus(msg,type=''){const el=document.getElementById('couponStatus');if(el){el.textContent=msg;el.className=`coupon-status ${type}`;}}

function renderCartBadge() {
    const q=Object.values(cart).reduce((s,i)=>s+i.qty,0);
    document.querySelectorAll('.bottom-nav .nav-item').forEach(n=>{
        if(n.querySelector('span')?.textContent.trim()!=='Cart') return;
        let badge=n.querySelector('.cart-badge');
        if(q>0){if(!badge){n.style.position='relative';n.insertAdjacentHTML('beforeend',`<span class="cart-badge">${q}</span>`);}else badge.textContent=q;}
        else if(badge) badge.remove();
    });
    const mb=document.getElementById('mobileCartBadge');
    if(mb){if(q>0){mb.textContent=q;mb.style.display='flex';}else mb.style.display='none';}
}

// ── CHECKOUT ─────────────────────────────────────────────────────────────────
async function handleCheckout() {
    if (isCheckingOut) return;
    if (!currentUser) {
        closeCart();
        openAuthModal('login');
        showToast('Please sign in to place your order');
        return;
    }
    const items=Object.values(cart);
    if(!items.length){showAlert('Cart Empty','Add items first.');return;}
    const btn=document.getElementById('checkoutBtn');
    isCheckingOut=true; btn.innerHTML=`<span class="btn-spinner"></span> Processing…`; btn.style.opacity='0.75';
    try{
        const sub=items.reduce((s,i)=>s+parseFloat(i.price)*i.qty,0);
        let disc=0; const shipFree=sub>=1500||(appliedCoupon?.type==='ship');
        if(appliedCoupon){if(appliedCoupon.type==='percent')disc=sub*(appliedCoupon.value/100);else if(appliedCoupon.type==='fixed')disc=Math.min(appliedCoupon.value,sub);}
        const ship=shipFree?0:99; const total=Math.max(0,sub-disc+ship);
        await set(push(ref(db,`orders/${currentUser.uid}`)),{items,subtotal:parseFloat(sub.toFixed(2)),discount:parseFloat(disc.toFixed(2)),coupon:appliedCoupon?.code||null,shipping:ship,totalAmount:parseFloat(total.toFixed(2)),timestamp:Date.now(),status:'Pending'});
        cart={}; appliedCoupon=null; saveCartToStorage(); renderCartUI(); renderCartBadge(); refreshGrid(); updateCouponStatus('');
        showToast('Order placed! 🎉'); closeCart();
    }catch{showAlert('Order Failed','Something went wrong. Try again.');}
    finally{btn.textContent='Place Order';btn.style.opacity='1';isCheckingOut=false;}
}

// ── ORDERS ────────────────────────────────────────────────────────────────────
function renderOrdersView() {
    if (!currentUser) {
        document.getElementById('ordersContainer').innerHTML = `
            <div class="orders-login-prompt">
                <div class="olp-icon">🛍️</div>
                <h3>Track your orders</h3>
                <p>Sign in to view your order history and track deliveries</p>
                <button class="auth-submit ios-tap olp-btn" id="ordersLoginBtn">
                    <span>Sign In to Continue</span>
                </button>
                <button class="olp-create-btn ios-tap" id="ordersCreateBtn">Create an account</button>
            </div>`;
        document.getElementById('ordersLoginBtn')?.addEventListener('click', () => openAuthModal('login'));
        document.getElementById('ordersCreateBtn')?.addEventListener('click', () => openAuthModal('register'));
        return;
    }
    loadOrders();
}

async function loadOrders() {
    const con=document.getElementById('ordersContainer');
    con.innerHTML=`<div class="orders-loading"><div class="vehdic-loader"><span>V</span><span>e</span><span>h</span><span>d</span><span>i</span><span>c</span></div></div>`;
    try{
        const snap=await get(ref(db,`orders/${currentUser.uid}`));
        if(!snap.exists()){con.innerHTML='<div class="orders-empty"><p>No orders yet. Shop something! 🛍️</p></div>';return;}
        const orders=Object.keys(snap.val()).map(k=>({id:k,...snap.val()[k]})).sort((a,b)=>b.timestamp-a.timestamp);
        const f=document.createDocumentFragment();
        orders.forEach(o=>{
            const el=document.createElement('div'); el.className='order-card';
            el.innerHTML=`<div class="order-header"><div><span class="order-id">#${o.id.slice(-6).toUpperCase()}</span><span class="order-date">${new Date(o.timestamp).toLocaleString()}</span></div><span class="order-status status-${o.status.toLowerCase()}">${o.status}</span></div><div class="order-items">${o.items.map(i=>`<div class="order-item-row"><span>${i.name} × ${i.qty||1}</span><span>$${(parseFloat(i.price)*(i.qty||1)).toFixed(2)}</span></div>`).join('')}</div><div class="order-total"><span>Total</span><strong>₹${o.totalAmount.toLocaleString("en-IN")}</strong></div>`;
            f.appendChild(el);
        });
        con.innerHTML=''; con.appendChild(f);
    }catch{con.innerHTML='<p class="grid-empty-msg">Failed to load orders.</p>';}
}

// ── CATEGORY SHEET ────────────────────────────────────────────────────────────
function openCatSheet(){document.getElementById('catSheetOverlay').classList.add('show');document.getElementById('catSheet').classList.add('show');}
function closeCatSheet(){
    document.getElementById('catSheetOverlay').classList.remove('show');document.getElementById('catSheet').classList.remove('show');
    setActiveBottomNav(activeView==='shop'?'Shop':activeView==='orders'?'My Order':'Home');
}

// ── PROFILE SHEET ─────────────────────────────────────────────────────────────
async function openProfileSheet() {
    if (!currentUser) { openAuthModal('login'); return; }
    document.getElementById('profileOverlay').classList.add('show');
    document.getElementById('profileSheet').classList.add('show');
    closeEditMode();
    await loadProfileData();
}
function closeProfileSheet(){document.getElementById('profileOverlay').classList.remove('show');document.getElementById('profileSheet').classList.remove('show');}

async function loadProfileData() {
    if(!currentUser) return;
    const qn=currentUser.displayName||currentUser.email?.split('@')[0]||'User';
    document.getElementById('profileDisplayName').textContent=qn;
    document.getElementById('profileDisplayEmail').textContent=currentUser.email||'';
    try{
        const snap=await get(ref(db,`users/${currentUser.uid}/profile`));
        const d=snap.exists()?snap.val():{};
        const name=d.name||qn;
        document.getElementById('profileDisplayName').textContent=name;
        document.getElementById('profilePhone').textContent=d.phone||'—';
        document.getElementById('profileGender').textContent=d.gender||'—';
        document.getElementById('profileAddress').textContent=d.address||'—';
        const color=d.avatarColor||AVATAR_COLORS[0];
        const init=name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        const av=document.getElementById('profileAvatarLarge');
        av.style.background=color; document.getElementById('profileInitials').textContent=init;
        av.dataset.colorIdx=AVATAR_COLORS.indexOf(color)>=0?AVATAR_COLORS.indexOf(color):0;
    }catch(e){console.error(e);}
}

function openEditMode(){
    document.getElementById('profileViewMode').classList.add('view-hidden');
    document.getElementById('profileEditMode').classList.remove('view-hidden');
    document.getElementById('editName').value=document.getElementById('profileDisplayName').textContent!=='—'?document.getElementById('profileDisplayName').textContent:'';
    document.getElementById('editPhone').value=document.getElementById('profilePhone').textContent!=='—'?document.getElementById('profilePhone').textContent:'';
    document.getElementById('editAddress').value=document.getElementById('profileAddress').textContent!=='—'?document.getElementById('profileAddress').textContent:'';
    const g=document.getElementById('profileGender').textContent;
    document.querySelectorAll('input[name="gender"]').forEach(r=>r.checked=r.value===g);
}
function closeEditMode(){document.getElementById('profileViewMode').classList.remove('view-hidden');document.getElementById('profileEditMode').classList.add('view-hidden');}

async function saveProfile(){
    const btn=document.getElementById('saveProfileBtn');
    const name=document.getElementById('editName').value.trim();
    const phone=document.getElementById('editPhone').value.trim();
    const addr=document.getElementById('editAddress').value.trim();
    const gender=document.querySelector('input[name="gender"]:checked')?.value||'';
    const color=AVATAR_COLORS[parseInt(document.getElementById('profileAvatarLarge').dataset.colorIdx||0)];
    if(!name){showToast('Name cannot be empty');return;}
    btn.innerHTML='<span class="btn-spinner"></span> Saving…'; btn.style.opacity='0.75';
    try{
        await set(ref(db,`users/${currentUser.uid}/profile`),{name,email:currentUser.email,phone,address:addr,gender,avatarColor:color,updatedAt:Date.now()});
        await updateProfile(currentUser,{displayName:name});
        showToast('Profile updated! ✨'); closeEditMode(); await loadProfileData(); updateNavAvatar();
    }catch{showToast('Save failed.');}
    finally{btn.textContent='Save Changes';btn.style.opacity='1';}
}

function cycleAvatarColor(){
    const av=document.getElementById('profileAvatarLarge');
    const idx=((parseInt(av.dataset.colorIdx||0))+1)%AVATAR_COLORS.length;
    av.dataset.colorIdx=idx;
    av.style.background=AVATAR_COLORS[idx];
    // Immediately update nav avatar color (without saving — preview only)
    const navAv=document.getElementById('navAvatar');
    if(navAv) navAv.style.background=AVATAR_COLORS[idx];
}

async function updateNavAvatar(){
    if(!currentUser) return;
    try{
        const snap=await get(ref(db,`users/${currentUser.uid}/profile`));
        const d=snap.exists()?snap.val():{};
        // Fix: use name from DB, then displayName, then email (not 'U' fallback)
        const name=d.name||currentUser.displayName||currentUser.email?.split('@')[0]||'V';
        const init=name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        const color=d.avatarColor||AVATAR_COLORS[0];
        const av=document.getElementById('navAvatar');
        if(av){
            av.innerHTML=`<span>${init}</span>`;
            av.style.cssText=`background:${color};color:#fff;font-size:11px;font-weight:800;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border-radius:50%;`;
        }
    }catch(e){console.error('updateNavAvatar',e);}
}

async function handleSignOut(){
    try{cart={};closeProfileSheet();await signOut(auth);showToast('Signed out!');}
    catch{showAlert('Error','Could not sign out.');}
}

// ── PDP ───────────────────────────────────────────────────────────────────────
function openPDP(pid) {
    const p=allProducts.find(x=>x.id===pid); if(!p) return;
    pdpProduct=p; pdpQty=1;
    document.getElementById('pdpTitle').textContent=p.name;
    document.getElementById('pdpPrice').textContent=`₹${Math.round(p.price).toLocaleString("en-IN")}`;
    document.getElementById('pdpBadge').textContent=p.category||'';
    document.getElementById('pdpQtyNum').textContent='1';
    document.getElementById('pdpDesc').textContent=p.desc||'Premium quality product.';
    const origEl=document.getElementById('pdpOrigPrice'),tagEl=document.getElementById('pdpDiscountTag');
    if(p.originalPrice&&p.originalPrice>p.price){const pct=Math.round((1-p.price/p.originalPrice)*100);origEl.textContent=`₹${Math.round(p.originalPrice).toLocaleString("en-IN")}`;origEl.style.display='';tagEl.textContent=`${pct}% OFF`;tagEl.style.display='';}
    else{origEl.style.display='none';tagEl.style.display='none';}
    const r=p.rating||4.5;document.getElementById('pdpStars').textContent='★'.repeat(Math.floor(r))+(r%1>=0.5?'½':'')+'☆'.repeat(5-Math.floor(r)-(r%1>=0.5?1:0));
    document.getElementById('pdpReviewCount').textContent=p.reviews?`(${p.reviews.toLocaleString()} reviews)`:'';
    const hl=document.getElementById('pdpHighlights');hl.innerHTML='';
    if(p.highlights?.length){const ul=document.createElement('ul');ul.className='pdp-highlights-list';p.highlights.forEach(h=>{const li=document.createElement('li');li.textContent=h;ul.appendChild(li);});hl.appendChild(ul);}
    const imgs=p.images?.length?p.images:[p.img];
    const mainImg=document.getElementById('pdpMainImg');mainImg.src=imgs[0];mainImg.alt=p.name;mainImg.onerror=function(){this.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f5ede0%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22220%22%20font-size%3D%22150%22%20text-anchor%3D%22middle%22%3E%F0%9F%8C%BF%3C%2Ftext%3E%3C%2Fsvg%3E';};
    const thumbsEl=document.getElementById('pdpThumbnails');thumbsEl.innerHTML='';
    if(imgs.length>1){imgs.forEach((src,i)=>{const t=document.createElement('button');t.className=`pdp-thumb ios-tap${i===0?' active':''}`;t.innerHTML=`<img src="${src}" alt="${p.name} ${i+1}">`;t.addEventListener('click',()=>{mainImg.src=src;thumbsEl.querySelectorAll('.pdp-thumb').forEach(x=>x.classList.remove('active'));t.classList.add('active');});thumbsEl.appendChild(t);});}
    updatePDPCartBtn();
    document.getElementById('pdpOverlay').classList.add('show');
    document.getElementById('pdpSheet').classList.add('show');
    document.body.style.overflow='hidden';
}
function updatePDPCartBtn(){
    if(!pdpProduct) return;
    const btn=document.getElementById('pdpAddBtn'),ci=cart[pdpProduct.id];
    if(ci){btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg> Add More (${ci.qty} in cart)`;btn.style.background='#10b981';}
    else{btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M5 3h1.81l2.4 10.8c.16.71.8 1.2 1.53 1.2h8.52c.73 0 1.37-.49 1.53-1.2L23 5H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="2" fill="currentColor"/><circle cx="18" cy="20" r="2" fill="currentColor"/></svg> Add to Cart`;btn.style.background='';}
}
function closePDP(){document.getElementById('pdpOverlay').classList.remove('show');document.getElementById('pdpSheet').classList.remove('show');document.body.style.overflow='';pdpProduct=null;}

// ── PAGE LOADER ────────────────────────────────────────────────────────────────
function hidePageLoader(){const l=document.getElementById('pageLoader');if(!l)return;l.classList.add('fade-out');setTimeout(()=>l.classList.remove('show','fade-out'),500);}

// ── TOAST & ALERT ─────────────────────────────────────────────────────────────
function showToast(msg='Done!'){const t=document.getElementById('iosToast');t.querySelector('span').textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);}
function showAlert(title,msg){document.getElementById('iosAlertTitle').textContent=title;document.getElementById('iosAlertMessage').innerHTML=msg;document.getElementById('iosAlertBox').classList.add('show');}

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────
function setErr(id,msg){const el=document.getElementById(id);if(el)el.textContent=msg;}
function clearAuthErrors(){['loginEmailErr','loginPassErr','regNameErr','regEmailErr','regPassErr'].forEach(id=>setErr(id,''));}
function setBtnLoading(btn,loading,label){if(loading){btn.innerHTML=`<span class="btn-spinner"></span>`;btn.disabled=true;}else{btn.innerHTML=`<span>${label}</span>`;btn.disabled=false;}}
function friendlyError(code){const m={'auth/user-not-found':'No account with this email.','auth/wrong-password':'Incorrect password.','auth/invalid-credential':'Incorrect email or password.','auth/invalid-login-credentials':'Incorrect email or password.','auth/email-already-in-use':'Email already registered.','auth/invalid-email':'Invalid email address.','auth/weak-password':'Password must be 6+ characters.','auth/too-many-requests':'Too many attempts. Try later.','auth/network-request-failed':'Network error. Check connection.'};return m[code]||`Error: ${code}`;}
function checkPasswordStrength(val){const fill=document.getElementById('strengthFill'),label=document.getElementById('strengthLabel');if(!fill||!val){if(fill)fill.style.width='0%';if(label)label.textContent='';return;}let s=0;if(val.length>=6)s++;if(val.length>=10)s++;if(/[A-Z]/.test(val))s++;if(/[0-9]/.test(val))s++;if(/[^A-Za-z0-9]/.test(val))s++;const levels=[{w:'20%',c:'#f42c37',t:'Weak'},{w:'40%',c:'#f97316',t:'Fair'},{w:'60%',c:'#fdc62e',t:'Good'},{w:'80%',c:'#10b981',t:'Strong'},{w:'100%',c:'#059669',t:'Excellent'}];const l=levels[Math.min(s,4)];fill.style.width=l.w;fill.style.background=l.c;label.textContent=l.t;label.style.color=l.c;}
