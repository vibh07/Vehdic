document.addEventListener('DOMContentLoaded', () => {

    // 1. Bottom Nav Active State logic (Mobile)
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked one
            this.classList.add('active');
        });
    });
    // --- 4. Mobile Top Nav: 3-Dot Menu Logic ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDropdown = document.getElementById('mobileDropdown');

    if (mobileMenuBtn && mobileDropdown) {
        // Toggle popup on click
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevents click from instantly closing it
            mobileDropdown.classList.toggle('show');
        });

        // Close popup when clicking anywhere else on the screen
        document.addEventListener('click', function(e) {
            if (mobileDropdown.classList.contains('show') && !e.target.closest('.mobile-nav-icons')) {
                mobileDropdown.classList.remove('show');
            }
        });
    }

    // --- 5. Mobile App Download Logic (PWA) ---
    let deferredPrompt;
    const installAppBtn = document.getElementById('installAppBtn');

    // Catches the prompt trigger in supported browsers (mainly Chrome/Android)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    if (installAppBtn) {
        installAppBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                // If Android/Supported browser: show the install popup
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            } else {
                // If iOS/Unsupported browser: Show instructions
                alert('📱 To install this app on iOS:\n\n1. Tap the "Share" icon at the bottom of Safari.\n2. Scroll down and tap "Add to Home Screen".');
            }
        });
    }

    // 2. Button Feedbacks
    const buttons = document.querySelectorAll('.hover-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            alert('🛒 Item added successfully!');
        });
    });

    // 3. High-End Scroll Reveal Animation
    const reveals = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.10, 
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        });
    }, revealOptions);

    reveals.forEach(reveal => {
        revealOnScroll.observe(reveal);
    });
});
