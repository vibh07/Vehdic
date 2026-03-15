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