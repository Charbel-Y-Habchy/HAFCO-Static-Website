/* ============================================================
   WAVEFORM CANVAS — ambient oscilloscope across hero
============================================================ */
(function () {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const layers = [
        { freq: 0.012, amp: 0.10, speed: 0.009, noise: 0, phase: 2, color: 'rgba(255,59,48,', alpha: 0.35, width: 1.5 },
        { freq: 0.012, amp: 0.08, speed: 0.018, noise: 0, phase: 0, color: 'rgba(255,180,160,', alpha: 0.22, width: 1.2 },
        { freq: 0.024, amp: 0.04, speed: 0.010, noise: 0.02, phase: 1.2, color: 'rgba(255,59,48,', alpha: 0.10, width: 0.8 },
    ];

    let t = 0;

    function noise(x, seed) {
        return (Math.sin(x * 37.1 + seed) * 0.5 + Math.sin(x * 91.7 + seed * 2) * 0.3 + Math.sin(x * 13.3 + seed * 0.5) * 0.2);
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        layers.forEach((l, li) => {
            ctx.beginPath();
            ctx.lineWidth = l.width;
            const yCentre = H * (0.35 + li * 0.15);

            for (let x = 0; x <= W; x += 2) {
                const base = Math.sin(x * l.freq + t * l.speed + l.phase) * (H * l.amp);
                const n = l.noise > 0 ? noise(x * 0.04, t * 0.3 + li * 10) * (H * l.noise) : 0;
                const y = yCentre + base + n;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }

            const grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0, l.color + '0)');
            grad.addColorStop(0.15, l.color + l.alpha + ')');
            grad.addColorStop(0.85, l.color + l.alpha + ')');
            grad.addColorStop(1, l.color + '0)');
            ctx.strokeStyle = grad;
            ctx.stroke();
        });

        t += 1;
        requestAnimationFrame(draw);
    }

    draw();
})();

/* ============================================================
   SCROLL REVEAL
============================================================ */
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

/* ============================================================
   MOBILE MENU
============================================================ */
(function () {
    const hamburger = document.getElementById('hamburger-btn');
    const menu = document.getElementById('mobile-menu');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    const closeBtn = document.getElementById('mobile-menu-close');
    if (!hamburger || !menu) return;

    function openMenu() {
        menu.classList.add('open');
        backdrop.classList.add('open');
        hamburger.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        menu.classList.remove('open');
        backdrop.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', openMenu);
    closeBtn && closeBtn.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);

    // Close on mobile nav link click
    document.getElementById('mobile-menu-nav')?.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') closeMenu();
    });
    document.getElementById('mobile-contact-link')?.addEventListener('click', closeMenu);
})();

/* ============================================================
   WHY-HAFCO CAROUSEL — arrow scrolling
============================================================ */
(function () {
    const track = document.getElementById('why-track');
    const prevBtn = document.getElementById('why-prev');
    const nextBtn = document.getElementById('why-next');
    if (!track) return;

    const SCROLL_AMT = 320;

    prevBtn?.addEventListener('click', () => {
        track.scrollBy({ left: -SCROLL_AMT, behavior: 'smooth' });
    });
    nextBtn?.addEventListener('click', () => {
        track.scrollBy({ left: SCROLL_AMT, behavior: 'smooth' });
    });
})();

/* ============================================================
   PRODUCT SHELF ARROWS — scroll navigation
============================================================ */
(function () {
    const prevBtn = document.getElementById('shelf-prev');
    const nextBtn = document.getElementById('shelf-next');
    if (!prevBtn || !nextBtn) return;

    function getTrack() {
        return document.getElementById('catalog-container');
    }

    function updateArrows() {
        const track = getTrack();
        if (!track) return;
        const atStart = track.scrollLeft <= 10;
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
        prevBtn.classList.toggle('hidden', atStart);
        nextBtn.classList.toggle('hidden', atEnd);
    }

    prevBtn.addEventListener('click', () => {
        const track = getTrack();
        if (!track) return;
        const cardWidth = (track.firstChild?.offsetWidth || 400) + 24;
        track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        const track = getTrack();
        if (!track) return;
        const cardWidth = (track.firstChild?.offsetWidth || 400) + 24;
        track.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });

    // Update arrows on scroll and after cards are rendered
    window.addEventListener('shelf-ready', () => {
        const track = getTrack();
        if (track) {
            track.addEventListener('scroll', updateArrows, { passive: true });
            updateArrows();
        }
    });
})();

/* ============================================================
   ROUTING & CORE CATALOG ENGINE
============================================================ */
let catalogData = [];

// Unified JSON loading
fetch('products.json')
    .then((res) => {
        if (!res.ok) throw new Error('Failed to load product database.');
        return res.json();
    })
    .then((data) => {
        catalogData = data.categories;

        // Inject category links into header nav (desktop)
        injectNavLinks(catalogData);

        // Page routing
        if (document.getElementById('catalog-container')) {
            renderMainGrid(catalogData);
        } else if (document.getElementById('dynamic-products-container')) {
            initializeCategoryPage(catalogData);
        }
    })
    .catch((err) => {
        console.error('Catalog load error:', err);
    });

/* ============================================================
   INJECT CATEGORY LINKS INTO HEADER + MOBILE MENU
============================================================ */
function injectNavLinks(categories) {
    const desktopNav = document.getElementById('header-nav');
    const mobileNav = document.getElementById('mobile-menu-nav');

    categories.forEach((cat) => {
        const href = `category.html?id=${cat.id}`;
        // navName for the bar, fall back to name if not defined
        const label = cat.navName || cat.name;

        // Desktop: insert before the divider
        if (desktopNav) {
            const a = document.createElement('a');
            a.href = href;
            a.className = 'header-link';
            a.textContent = label;
            const divider = desktopNav.querySelector('.header-nav-divider');
            desktopNav.insertBefore(a, divider);
        }

        // Mobile drawer — show navName as well, full name as subtitle
        if (mobileNav) {
            const a = document.createElement('a');
            a.href = href;
            a.innerHTML = `<span class="mob-nav-label">${label}</span><span class="mob-nav-sub">${cat.name !== label ? cat.name : ''}</span>`;
            mobileNav.appendChild(a);
        }
    });
}

/* ============================================================
   MAIN GRID — product shelf
============================================================ */
function renderMainGrid(categories) {
    const track = document.getElementById('catalog-container');
    const dotsContainer = document.getElementById('shelf-dots');
    if (!track) return;
    track.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    const categoryIcons = {
        'relay-avr': '⚡',
        'servo-avr': '⚡',
        'floating-charger': '🔋',
        'softstart-charger': '🔋',
        'ups': '🔌',
        'transformer': '🔌',
        'solar-inverter': '☀️'
    };

    const categoryTags = {
        'relay-avr': 'Voltage Regulation',
        'servo-avr': 'Voltage Regulation',
        'floating-charger': 'Battery Systems',
        'softstart-charger': 'Battery Systems',
        'ups': 'Power Backup',
        'transformer': 'Power Distribution',
        'solar-inverter': 'Renewable Energy'
    };

    // Build dots
    const dots = [];
    if (dotsContainer) {
        categories.forEach((cat, index) => {
            const dot = document.createElement('div');
            dot.className = 'shelf-dot' + (index === 0 ? ' active' : '');
            dot.addEventListener('click', () => {
                const cardWidth = (track.firstChild?.offsetWidth || 400) + 24;
                track.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
            });
            dotsContainer.appendChild(dot);
            dots.push(dot);
        });

        // Sync dots on scroll
        track.addEventListener('scroll', () => {
            const cardWidth = (track.firstChild?.offsetWidth || 400) + 24;
            const active = Math.round(track.scrollLeft / cardWidth);
            dots.forEach((d, i) => d.classList.toggle('active', i === active));
        }, { passive: true });
    }

    categories.forEach((cat) => {
        const card = document.createElement('div');
        card.className = 'category-card reveal';

        const icon = categoryIcons[cat.id] || '⚙️';
        const tag = categoryTags[cat.id] || 'Power Solutions';

        let imageHTML = cat.image
            ? `<img src="${cat.image}" alt="${cat.name}" class="category-card-image">`
            : `<div class="category-card-image-placeholder">${icon}</div>`;

        card.innerHTML = `
            ${imageHTML}
            <div class="category-card-body">
                <span class="category-card-tag">${tag}</span>
                <h3>${cat.name}</h3>
                <p>${cat.description || ''}</p>
                <a class="category-card-cta" href="category.html?id=${cat.id}">View Products <span>→</span></a>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `category.html?id=${cat.id}`;
        });

        track.appendChild(card);
        setTimeout(() => observer.observe(card), 50);
    });

    // Notify shelf arrows that cards are ready
    window.dispatchEvent(new Event('shelf-ready'));
}

/* ============================================================
   CATEGORY PAGE BUILD ENGINE
============================================================ */
function initializeCategoryPage(categories) {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id') || 'relay-avr';
    const category = categories.find(c => c.id === categoryId);

    if (!category) {
        document.getElementById('dynamic-category-title').innerText = "Category Not Found";
        return;
    }

    document.getElementById('dynamic-category-title').innerText = category.name;
    document.getElementById('dynamic-category-description').innerText = category.description;

    const productsContainer = document.getElementById('dynamic-products-container');

    const categoryIcons = {
        'relay-avr': '⚡',
        'servo-avr': '⚡',
        'floating-charger': '🔋',
        'softstart-charger': '🔋',
        'ups': '🔌',
        'transformer': '🔌',
        'solar-inverter': '☀️'
    };
    const iconPlaceholder = categoryIcons[categoryId] || '⚙️';

    (category.items || []).forEach(item => {
        let specsHTML = '';
        if (item.specs) {
            specsHTML = `<div class="dense-spec-grid">`;
            for (const [key, value] of Object.entries(item.specs)) {
                specsHTML += `
                    <div class="dense-spec-item">
                        <span class="dense-spec-item-lbl">${key}</span>
                        <span class="dense-spec-item-val">${value}</span>
                    </div>
                `;
            }
            specsHTML += `</div>`;
        }

        const card = document.createElement('div');
        card.className = 'glass-box wide-spec-card reveal';
        card.innerHTML = `
            <div class="wide-card-visual">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="wide-card-img">` : `<div class="wide-card-placeholder">${iconPlaceholder}</div>`}
            </div>
            <div class="wide-card-details">
                <div class="wide-card-info">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    ${specsHTML}
                </div>
            </div>
        `;
        productsContainer.appendChild(card);
        observer.observe(card);
    });
}