document.addEventListener('DOMContentLoaded', () => {

    // 1. Bottom Nav Active State logic
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); 
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 2. iOS Notification Pill (Replaces browser alert)
    const iosToast = document.getElementById('iosToast');
    const buttons = document.querySelectorAll('.hover-btn');
    
    function showIOSNotification() {
        iosToast.classList.add('show');
        setTimeout(() => {
            iosToast.classList.remove('show');
        }, 2500);
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            showIOSNotification();
        });
    });

    // 3. High-End Scroll Reveal Animation
    const reveals = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.10, rootMargin: "0px 0px -50px 0px" };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        });
    }, revealOptions);

    reveals.forEach(reveal => revealOnScroll.observe(reveal));

    // 4. iOS Context Menu (3 Dots Dropdown)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDropdown = document.getElementById('mobileDropdown');

    if (mobileMenuBtn && mobileDropdown) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            mobileDropdown.classList.toggle('show');
        });
        document.addEventListener('click', function(e) {
            if (mobileDropdown.classList.contains('show') && !e.target.closest('.mobile-nav-icons')) {
                mobileDropdown.classList.remove('show');
            }
        });
    }

    // 5. iOS System Alert for App Download
    const installAppBtn = document.getElementById('installAppBtn');
    const iosAlertBox = document.getElementById('iosAlertBox');
    const iosAlertClose = document.getElementById('iosAlertClose');
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    if (installAppBtn) {
        installAppBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Android
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
            } else {
                // iOS Alert Box
                iosAlertBox.classList.add('show');
            }
        });
    }

    if(iosAlertClose) {
        iosAlertClose.addEventListener('click', () => {
            iosAlertBox.classList.remove('show');
        });
    }
});
