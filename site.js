// =============================================
// MULTI BUILDING — společný skript pro obě stránky
// =============================================
(function () {
    'use strict';

    const header = document.getElementById('header');
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Mobilní menu ----------
    function setMenu(open) {
        menuBtn.classList.toggle('active', open);
        nav.classList.toggle('active', open);
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
    }

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('active')));
        nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('active')) setMenu(false);
        });
    }

    // ---------- Hlavička + tlačítko nahoru ----------
    const scrollTopBtn = document.getElementById('scroll-top');
    const headerAlwaysSolid = header && header.hasAttribute('data-solid');

    function onScroll() {
        const y = window.scrollY;
        if (header && !headerAlwaysSolid) header.classList.toggle('scrolled', y > 60);
        if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', y > 600);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        });
    }

    // ---------- Nájezdy při scrollování ----------
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-stagger');

    if ('IntersectionObserver' in window && !reducedMotion) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add('revealed');
                // po dojetí zrušíme zpoždění, aby hover reagoval hned
                if (el.classList.contains('reveal-stagger')) {
                    setTimeout(() => el.classList.add('settled'), 1300);
                }
                revealObserver.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('revealed', 'settled'));
    }

    // ---------- Počítadla ----------
    function animateCounter(el) {
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        if (reducedMotion) {
            el.textContent = target + suffix;
            return;
        }
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            el.textContent = Math.floor(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target + suffix;
        }
        requestAnimationFrame(update);
    }

    const counterElements = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            });
        }, { threshold: 0.5 });
        counterElements.forEach(el => counterObserver.observe(el));
    }

    // ---------- Lightbox ----------
    const lightbox = document.getElementById('lightbox');

    if (lightbox) {
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const lightboxCounter = document.getElementById('lightbox-counter');
        const lightboxClose = document.getElementById('lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');

        let images = [];
        let index = 0;
        let opener = null;

        function show() {
            const item = images[index];
            if (!item) return;
            lightboxImg.src = item.src;
            lightboxImg.alt = item.alt;
            lightboxCaption.textContent = item.alt;
            if (lightboxCounter) lightboxCounter.textContent = (index + 1) + ' / ' + images.length;
        }

        function step(delta) {
            if (!images.length) return;
            index = (index + delta + images.length) % images.length;
            show();
        }

        function open(element) {
            images = [];
            index = 0;
            opener = element;
            document.querySelectorAll('.gallery-item:not(.hide)').forEach(item => {
                const img = item.querySelector('img');
                if (!img) return;
                if (item === element) index = images.length;
                images.push({ src: item.getAttribute('data-url') || img.src, alt: img.alt });
            });
            show();
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            lightboxClose.focus();
        }

        function close() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            lightboxImg.removeAttribute('src');
            if (opener) opener.focus();
        }

        // otevření klikem i klávesnicí (položky jsou <button>)
        document.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) open(item);
        });

        lightboxClose.addEventListener('click', close);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) close();
        });
        lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
        lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); step(1); });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') step(-1);
            if (e.key === 'ArrowRight') step(1);
        });

        // přejetí prstem na mobilu
        let touchX = null;
        lightbox.addEventListener('touchstart', (e) => {
            touchX = e.changedTouches[0].clientX;
        }, { passive: true });
        lightbox.addEventListener('touchend', (e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            touchX = null;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        }, { passive: true });
    }
})();
