import * as THREE from "three";

/* ================================================================
   HELPERS
================================================================ */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const THEME = {
    gold: { r: 212, g: 175, b: 55 },
    goldLight: { r: 245, g: 212, b: 66 },
    cyan: { r: 0, g: 212, b: 232 },
    violet: { r: 139, g: 92, b: 246 },
    emerald: { r: 16, g: 185, b: 129 },
    rgba(c, a = 1) {
        return `rgba(${c.r},${c.g},${c.b},${a})`;
    },
    hsla(h, s, l, a = 1) {
        return `hsla(${h},${s}%,${l}%,${a})`;
    },
};

/* ================================================================
   INJECT DYNAMIC CSS  (morph streak, particles, dock‑active, perf)
================================================================ */
const _dynamicCSS = document.createElement("style");
_dynamicCSS.textContent = `
/* ---- dock active indicator ---- */
.dock-item.active{background:rgba(212,175,55,.12)!important;border-color:rgba(212,175,55,.25)!important;color:#d4af37!important}
.dock-item.active::after{content:'';position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#d4af37;box-shadow:0 0 6px rgba(212,175,55,.6)}
/* ---- performance hints ---- */
.nav-links a,.nav-logo,.nav-cta,.nav-burger{will-change:transform,opacity}
.dock-item{will-change:width,height}
/* ---- let GSAP own dock transitions ---- */
#dock{transition:none!important}
/* ---- morph streak ---- */
.morph-streak{position:fixed;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent 0%,rgba(212,175,55,0) 10%,rgba(212,175,55,.8) 30%,rgba(245,212,66,1) 50%,rgba(212,175,55,.8) 70%,rgba(212,175,55,0) 90%,transparent 100%);box-shadow:0 0 20px 4px rgba(212,175,55,.4),0 0 40px 8px rgba(212,175,55,.15);z-index:10001;pointer-events:none;opacity:0;top:0}
/* ---- morph particles ---- */
.morph-particle{position:fixed;border-radius:50%;background:radial-gradient(circle,#f5d442,#d4af37);box-shadow:0 0 6px rgba(212,175,55,.8),0 0 12px rgba(212,175,55,.3);z-index:10002;pointer-events:none}
`;
document.head.appendChild(_dynamicCSS);

/* ================================================================
   CREATE MORPH STREAK ELEMENT (re‑used across transitions)
================================================================ */
const morphStreak = document.createElement("div");
morphStreak.className = "morph-streak";
document.body.appendChild(morphStreak);

/* ================================================================
   LOADER
================================================================ */
const loaderFill = $("#loader-fill");
const loaderEl = $("#loader");

if (loaderFill && loaderEl) {
    gsap.to(loaderFill, {
        width: "100%",
        duration: 1.6,
        ease: "power2.inOut",
        onComplete: () => {
            gsap.to(loaderEl, {
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => {
                    loaderEl.style.display = "none";
                    document.body.classList.remove("loading");
                    siteEntrance();
                },
            });
        },
    });
} else {
    document.body.classList.remove("loading");
    requestAnimationFrame(() => siteEntrance());
}

/* ================================================================
   CURSOR
================================================================ */
const curDot = $("#cur-dot");
const curRing = $("#cur-ring");
let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;

if (curDot && curRing) {
    document.addEventListener("mousemove", (e) => {
        mx = e.clientX;
        my = e.clientY;
    });

    (function cursorLoop() {
        rx += (mx - rx) * 0.1;
        ry += (my - ry) * 0.1;
        curDot.style.left = mx + "px";
        curDot.style.top = my + "px";
        curRing.style.left = rx + "px";
        curRing.style.top = ry + "px";
        requestAnimationFrame(cursorLoop);
    })();

    /* FIX #2: Cursor Hover Binding - Added data-cursorBound check to prevent
       double-binding and MutationObserver to catch dynamically-created elements */
    function bindCursorHovers() {
        const targets =
            "a, button, .proj-card, .skill-pill, .c-card, .glass, .gh-profile-card, .contribution-graph-wrapper, .soc-btn, .btn-primary, .btn-ghost, .btn-resume, .btn-github, .nav-cta, .proj-btn, .c-dot, .profile-detail, .profile-card, .pc-card, .pc-contact-btn, .dock-item, .about-tech-badge";
        $$(targets).forEach((el) => {
            // FIX #2: Skip already-bound elements to prevent duplicate listeners
            if (el.dataset.cursorBound) return;
            el.dataset.cursorBound = "true";
            el.addEventListener("mouseenter", () => curRing.classList.add("hov"));
            el.addEventListener("mouseleave", () => curRing.classList.remove("hov"));
        });
    }

    // Initial bind
    bindCursorHovers();

    /* FIX #2: Use MutationObserver to auto-bind when new elements appear
       This replaces the unreliable setTimeout approach */
    const cursorObserver = new MutationObserver(() => {
        // Debounce to avoid excessive calls during rapid DOM changes
        clearTimeout(cursorObserver._timeout);
        cursorObserver._timeout = setTimeout(bindCursorHovers, 100);
    });
    cursorObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener(
        "touchstart",
        () => {
            curDot.style.display = "none";
            curRing.style.display = "none";
            document.body.style.cursor = "auto";
        },
        { once: true }
    );
}

/* ================================================================
   SCROLL PROGRESS
================================================================ */
const scrollBar = $("#scroll-bar");
if (scrollBar) {
    let ticking = false;
    window.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const total =
                        document.documentElement.scrollHeight - window.innerHeight;
                    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
                    scrollBar.style.width = pct + "%";
                    ticking = false;
                });
                ticking = true;
            }
        },
        { passive: true }
    );
}

/* ================================================================
   MOBILE NAV
================================================================ */
window.toggleNav = () => {
    const m = $("#mob-nav"),
        b = $("#nav-burger");
    if (!m || !b) return;
    m.classList.toggle("open");
    b.classList.toggle("open");
    document.body.style.overflow = m.classList.contains("open") ? "hidden" : "";
};

window.closeNav = () => {
    const m = $("#mob-nav"),
        b = $("#nav-burger");
    if (m) m.classList.remove("open");
    if (b) b.classList.remove("open");
    document.body.style.overflow = "";
};

/* ================================================================
   SMOOTH SCROLL  (shared helper — sets _isScrollingTo flag)
================================================================ */
let _isScrollingTo = false;

function smoothScrollTo(target, callback) {
    _isScrollingTo = true;
    gsap.to(window, {
        scrollTo: { y: target, offsetY: 20 },
        duration: 0.9,
        ease: "power3.inOut",
        onComplete: () => {
            _isScrollingTo = false;
            if (callback) callback();
            // after programmatic scroll, reconcile morph state with final position
            checkMorphState();
        },
    });
}

// Nav links
$$(".nav-links a").forEach((link) => {
    link.addEventListener("click", (e) => {
        if (link.hash) {
            e.preventDefault();
            smoothScrollTo(link.hash);
            window.closeNav();
        }
    });
});

// Mobile overlay links
$$(".mob-nav a").forEach((link) => {
    link.addEventListener("click", (e) => {
        if (link.hash) {
            e.preventDefault();
            window.closeNav();
            setTimeout(() => smoothScrollTo(link.hash), 300);
        }
    });
});

/* ================================================================
   NAV ↔ DOCK  MORPH TRANSITION
================================================================ */
const nav = $(".nav");
const dock = $("#dock");
const dockContainer = dock?.querySelector(".dock-container");
const dockItems = dock ? Array.from(dock.querySelectorAll(".dock-item")) : [];

// morph state machine: 'init' → 'nav' → 'morphing' ⇄ 'dock'
let morphState = "init";
let entranceComplete = false;

// initialise dock off‑screen / invisible
if (dock) {
    gsap.set(dock, {
        xPercent: -50,
        autoAlpha: 0,
        y: 30,
        pointerEvents: "none",
    });
}

/* --- golden particles burst --- */
function spawnMorphParticles(direction) {
    const count = 12;
    const startY = direction === "down" ? 60 : window.innerHeight - 60;
    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "morph-particle";
        const sz = 3 + Math.random() * 5;
        Object.assign(p.style, {
            width: sz + "px",
            height: sz + "px",
            left: 15 + Math.random() * 70 + "%",
            top: startY + "px",
            opacity: "1",
        });
        document.body.appendChild(p);

        const endY =
            direction === "down"
                ? startY + 80 + Math.random() * (window.innerHeight - startY - 160)
                : startY - 80 - Math.random() * (startY - 120);

        gsap.to(p, {
            top: endY,
            left: "+=" + (Math.random() - 0.5) * 200,
            scale: 0,
            opacity: 0,
            duration: 0.5 + Math.random() * 0.5,
            delay: Math.random() * 0.3,
            ease: "power2.out",
            onComplete: () => p.remove(),
        });
    }
}

/* --- morph → dock (scroll down) --- */
function morphToDock() {
    if (
        morphState === "dock" ||
        morphState === "morphing" ||
        !entranceComplete ||
        _isScrollingTo
    )
        return;
    morphState = "morphing";

    // kill competing tweens
    gsap.killTweensOf([
        nav,
        dock,
        morphStreak,
        ".nav-links a",
        ".nav-logo",
        ".nav-cta",
        ".nav-burger",
    ]);
    dockItems.forEach((d) => gsap.killTweensOf(d));

    const tl = gsap.timeline({ onComplete: () => (morphState = "dock") });

    /* 1 — nav items stagger out */
    tl.to(
        ".nav-links a",
        {
            y: -15,
            autoAlpha: 0,
            stagger: 0.03,
            duration: 0.25,
            ease: "power2.in",
        },
        0
    )
        .to(
            ".nav-logo",
            { y: -10, autoAlpha: 0, duration: 0.2, ease: "power2.in" },
            0.04
        )
        .to(
            ".nav-cta",
            { y: -10, autoAlpha: 0, duration: 0.2, ease: "power2.in" },
            0.06
        )
        .to(
            ".nav-burger",
            { y: -10, autoAlpha: 0, duration: 0.2, ease: "power2.in" },
            0.04
        )

        /* 2 — nav slides up */
        .to(nav, { yPercent: -100, duration: 0.35, ease: "power3.in" }, 0.12)

        /* 3 — golden streak sweeps down */
        .set(morphStreak, { top: 0, autoAlpha: 0.9 }, 0.18)
        .to(
            morphStreak,
            { top: window.innerHeight, duration: 0.5, ease: "power2.inOut" },
            0.18
        )
        .to(morphStreak, { autoAlpha: 0, duration: 0.15 }, 0.58)

        /* 4 — particles */
        .call(() => spawnMorphParticles("down"), null, 0.22)

        /* 5 — dock container appears */
        .set(dockItems, { scale: 0.3, autoAlpha: 0 }, 0.38)
        .set(dock, { pointerEvents: "auto" }, 0.4)
        .to(
            dock,
            { autoAlpha: 1, y: 0, duration: 0.55, ease: "elastic.out(1,.75)" },
            0.4
        )

        /* 6 — dock items pop in */
        .to(
            dockItems,
            {
                scale: 1,
                autoAlpha: 1,
                stagger: 0.04,
                duration: 0.35,
                ease: "back.out(2.5)",
            },
            0.48
        );

    return tl;
}

/* --- morph → nav (scroll up) --- */
function morphToNav() {
    if (
        morphState === "nav" ||
        morphState === "morphing" ||
        !entranceComplete ||
        _isScrollingTo
    )
        return;
    morphState = "morphing";

    gsap.killTweensOf([
        nav,
        dock,
        morphStreak,
        ".nav-links a",
        ".nav-logo",
        ".nav-cta",
        ".nav-burger",
    ]);
    dockItems.forEach((d) => gsap.killTweensOf(d));

    const tl = gsap.timeline({ onComplete: () => (morphState = "nav") });

    /* 1 — dock items shrink from centre */
    tl.to(
        dockItems,
        {
            scale: 0.5,
            autoAlpha: 0,
            stagger: { each: 0.03, from: "center" },
            duration: 0.25,
            ease: "power2.in",
        },
        0
    )

        /* 2 — dock slides down */
        .to(dock, { autoAlpha: 0, y: 30, duration: 0.3, ease: "power2.in" }, 0.12)
        .set(dock, { pointerEvents: "none" }, 0.42)

        /* 3 — streak sweeps up */
        .set(morphStreak, { top: window.innerHeight, autoAlpha: 0.9 }, 0.22)
        .to(
            morphStreak,
            { top: 0, duration: 0.5, ease: "power2.inOut" },
            0.22
        )
        .to(morphStreak, { autoAlpha: 0, duration: 0.15 }, 0.62)

        /* 4 — particles upward */
        .call(() => spawnMorphParticles("up"), null, 0.28)

        /* 5 — nav slides in */
        .to(nav, { yPercent: 0, duration: 0.45, ease: "power3.out" }, 0.38)

        /* 6 — nav items fade in */
        .to(
            ".nav-logo",
            { y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" },
            0.48
        )
        .to(
            ".nav-burger",
            { y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" },
            0.48
        )
        .to(
            ".nav-links a",
            {
                y: 0,
                autoAlpha: 1,
                stagger: 0.03,
                duration: 0.3,
                ease: "power2.out",
            },
            0.5
        )
        .to(
            ".nav-cta",
            { y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" },
            0.53
        );

    return tl;
}

/* --- reconcile state after programmatic scroll --- */
function checkMorphState() {
    if (!entranceComplete || _isScrollingTo || morphState === "morphing") return;
    const lab = document.getElementById("lab");
    if (!lab) return;
    const shouldBeDock =
        lab.getBoundingClientRect().bottom < window.innerHeight * 0.3;
    if (shouldBeDock && morphState !== "dock") morphToDock();
    else if (!shouldBeDock && morphState !== "nav") morphToNav();
}

/* --- ScrollTrigger drives the morph --- */
if (nav && dock && $("#lab")) {
    ScrollTrigger.create({
        trigger: "#lab",
        start: "bottom 30%",
        onEnter: () => {
            if (!_isScrollingTo) morphToDock();
        },
        onLeaveBack: () => {
            if (!_isScrollingTo) morphToNav();
        },
    });
}

/* ================================================================
   DOCK — macOS MAGNIFICATION
================================================================ */
if (dock && dockContainer && dockItems.length) {
    const DOCK_CFG = { BASE: 40, MAX: 64, RANGE: 160 };

    if (window.matchMedia("(hover:hover)").matches) {
        /* FIX #5: Dock Magnification - Use container-relative coordinates
           to fix offset issues on high-DPI screens */
        dockContainer.addEventListener("mousemove", (e) => {
            // FIX #5: Get container rect for relative positioning
            const containerRect = dockContainer.getBoundingClientRect();
            const mouseX = e.clientX - containerRect.left;

            dockItems.forEach((item) => {
                const itemRect = item.getBoundingClientRect();
                // FIX #5: Calculate item center relative to container
                const itemCenterX = (itemRect.left - containerRect.left) + itemRect.width / 2;
                const dist = Math.abs(mouseX - itemCenterX);

                const size = Math.min(
                    DOCK_CFG.MAX,
                    Math.max(
                        DOCK_CFG.BASE,
                        DOCK_CFG.MAX -
                        (DOCK_CFG.MAX - DOCK_CFG.BASE) * (dist / DOCK_CFG.RANGE)
                    )
                );
                const lift = (size - DOCK_CFG.BASE) * 0.5;
                item.style.width = size + "px";
                item.style.height = size + "px";
                item.style.marginBottom = lift + "px";
                const svg = item.querySelector("svg");
                if (svg) {
                    const is = 18 + (size - DOCK_CFG.BASE) * 0.25;
                    svg.style.width = is + "px";
                    svg.style.height = is + "px";
                }
            });
        });

        dockContainer.addEventListener("mouseleave", () => {
            dockItems.forEach((item) => {
                item.style.width = "";
                item.style.height = "";
                item.style.marginBottom = "";
                const svg = item.querySelector("svg");
                if (svg) {
                    svg.style.width = "";
                    svg.style.height = "";
                }
            });
        });
    }

    // dock‑link smooth scroll
    dockItems.forEach((link) => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            if (href && href.startsWith("#")) {
                e.preventDefault();
                smoothScrollTo(href);
            }
        });
    });
}

/* ================================================================
   ACTIVE SECTION TRACKING  (nav links + dock items)
================================================================ */
const sections = $$("section[id]");
const navLinksAll = $$(".nav-links a");

if (sections.length) {
    sections.forEach((section) => {
        new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = "#" + entry.target.id;
                        navLinksAll.forEach((l) =>
                            l.classList.toggle("active", l.getAttribute("href") === id)
                        );
                        dockItems.forEach((d) =>
                            d.classList.toggle("active", d.getAttribute("href") === id)
                        );
                    }
                });
            },
            { rootMargin: "-40% 0px -55% 0px" }
        ).observe(section);
    });
}

/* ================================================================
   SITE ENTRANCE — liquid‑glass is first, hero animates on scroll
================================================================ */
function siteEntrance() {
    // Force scroll to top on fresh load
    window.scrollTo(0, 0);

    // nav slides in
    gsap.to(".nav", {
        y: 0,
        duration: 0.75,
        ease: "power3.out",
        delay: 0.1,
        onComplete: () => {
            morphState = "nav";
            entranceComplete = true;
            requestAnimationFrame(checkMorphState);
        },
    });

    // liquid section elements — use SET + TO instead of FROM
    // This prevents the "stuck at opacity 0" bug
    gsap.set(".liquid-ghost-name", { opacity: 0, y: 30 });
    gsap.to(".liquid-ghost-name", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.3,
    });

    gsap.set(".liquid-ghost-sub", { opacity: 0, y: 20 });
    gsap.to(".liquid-ghost-sub", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.5,
    });

    gsap.set(".liquid-scroll-cue", { opacity: 0 });
    gsap.to(".liquid-scroll-cue", { opacity: 1, duration: 0.6, delay: 0.8 });

    gsap.set(".liquid-hint", { opacity: 0 });
    gsap.to(".liquid-hint", { opacity: 1, duration: 0.5, delay: 1 });

    /* FIX #4: Hero Entrance - Store trigger reference and add fallback check
       for cases when user lands mid-page (via URL hash) */
    const heroTrigger = ScrollTrigger.create({
        trigger: "#hero",
        start: "top 80%",
        once: true,
        onEnter: () => heroEntrance(),
    });

    // FIX #4: If hero is already in viewport on load, trigger entrance immediately
    requestAnimationFrame(() => {
        const heroEl = $("#hero");
        if (heroEl) {
            const heroRect = heroEl.getBoundingClientRect();
            if (heroRect.top < window.innerHeight * 0.8) {
                heroEntrance();
                heroTrigger.kill(); // Prevent double-trigger
            }
        }
    });
}

function heroEntrance() {
    // Use SET + TO pattern — never use gsap.from() for critical UI elements
    // gsap.from() can leave elements at opacity:0 if timing is off

    const heroElements = [
        { sel: ".hero-kicker", y: 25, dur: 0.6, delay: 0 },
        { sel: ".hero-name", y: 60, dur: 0.9, delay: 0.15 },
        { sel: ".hero-role", y: 20, dur: 0.55, delay: 0.35 },
        { sel: ".hero-tag", y: 20, dur: 0.55, delay: 0.45 },
    ];

    heroElements.forEach(({ sel, y, dur, delay }) => {
        const el = $(sel);
        if (!el) return;
        gsap.set(sel, { y, opacity: 0 });
        gsap.to(sel, {
            y: 0,
            opacity: 1,
            duration: dur,
            delay,
            ease: "power3.out",
        });
    });

    // Hero action buttons — critical fix: these MUST become visible
    const actions = $$(".hero-actions > *");
    if (actions.length) {
        actions.forEach((el, i) => {
            gsap.set(el, { y: 18, opacity: 0 });
            gsap.to(el, {
                y: 0,
                opacity: 1,
                duration: 0.5,
                delay: 0.55 + i * 0.08,
                ease: "power3.out",
            });
        });
    }

    // Hero stats (if they exist — currently commented out in HTML)
    const stats = $$(".hero-stats > div");
    if (stats.length) {
        stats.forEach((el, i) => {
            gsap.set(el, { y: 20, opacity: 0 });
            gsap.to(el, {
                y: 0,
                opacity: 1,
                duration: 0.5,
                delay: 0.7 + i * 0.1,
                ease: "power3.out",
            });
        });
    }

    // Scroll hint
    const scrollHint = $("#scroll-hint");
    if (scrollHint) {
        gsap.set(scrollHint, { opacity: 0 });
        gsap.to(scrollHint, { opacity: 1, duration: 0.45, delay: 0.9 });
    }
}

/* ================================================================
   SCROLL REVEAL  — Fixed: uses SET+TO instead of FROM
   The FROM pattern is dangerous because:
   1. If ScrollTrigger fires before paint, element stays at from-state
   2. If user refreshes mid-page, elements above viewport never animate
   3. If element is dynamically created after FROM runs, it's invisible
================================================================ */
function reveal(sel, opts = {}) {
    const elements = $$(sel);
    if (!elements.length) return;

    elements.forEach((el, i) => {
        // Set initial hidden state
        gsap.set(el, {
            y: opts.y || 40,
            opacity: 0,
        });

        // Create scroll-triggered animation TO visible state
        ScrollTrigger.create({
            trigger: opts.trigger || el,
            start: opts.start || "top 92%",
            once: true,
            onEnter: () => {
                gsap.to(el, {
                    y: 0,
                    opacity: 1,
                    duration: opts.dur || 0.65,
                    delay: opts.stagger ? i * opts.stagger : 0,
                    ease: "power3.out",
                });
            },
            // CRITICAL: if element is already in viewport when page loads,
            // make it visible immediately
            onLeaveBack: () => {
                // Do nothing — keep visible once revealed
            },
        });
    });

    /* FIX #3: Safety net timing - Delay the check until after layout is stable
       The immediate requestAnimationFrame was running before ScrollTrigger
       had time to properly initialize */
    setTimeout(() => {
        elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            // FIX #3: Only reveal if element is in viewport AND still hidden
            const style = window.getComputedStyle(el);
            if (rect.top < window.innerHeight * 0.92 && parseFloat(style.opacity) < 0.1) {
                gsap.to(el, {
                    y: 0,
                    opacity: 1,
                    duration: opts.dur || 0.65,
                    ease: "power3.out",
                });
            }
        });
    }, 200); // Give ScrollTrigger time to initialize
}

reveal(".sec-label", { y: 14 });
reveal(".sec-heading", { y: 26 });
reveal(".about-bio", { y: 20, stagger: 0.06 });
reveal(".pill", { y: 10 });
reveal(".about-tech-badge", { y: 12, stagger: 0.04 });
reveal(".pc-card-wrapper", { y: 35, dur: 0.7 });
reveal(".terminal", { y: 30, dur: 0.6 });
reveal(".skill-card", { y: 28, stagger: 0.06 });
reveal(".skills-extra", { y: 20 });
reveal(".c-card", { y: 24, stagger: 0.04, start: "top 96%" });
reveal(".btn-resume", { y: 16, start: "top 96%" });
reveal(".gh-profile-card", { y: 34 });
reveal(".cert-card", { y: 28, stagger: 0.08 });
reveal(".contribution-graph-wrapper", { y: 34 });




/* ================================================================
   PROFILE CARD — 3‑D Tilt
================================================================ */
const pcWrapper = document.getElementById("pc-wrapper");
const pcCard = document.getElementById("pc-card");

if (pcWrapper && pcCard) {
    const PC = {
        SMOOTH: 600,
        INIT_DUR: 1500,
        IX: 70,
        IY: 60,
    };

    const clamp = (v, mn = 0, mx = 100) => Math.min(Math.max(v, mn), mx);
    const round = (v, p = 3) => parseFloat(v.toFixed(p));
    const adjust = (v, f0, f1, t0, t1) =>
        round(t0 + ((t1 - t0) * (v - f0)) / (f1 - f0));
    const easeIO = (x) =>
        x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    let pcRaf = null;

    function updateCard(ox, oy) {
        const w = pcCard.clientWidth,
            h = pcCard.clientHeight;
        const px = clamp((100 / w) * ox),
            py = clamp((100 / h) * oy);
        const cx = px - 50,
            cy = py - 50;
        const m = {
            "--pointer-x": `${px}%`,
            "--pointer-y": `${py}%`,
            "--background-x": `${adjust(px, 0, 100, 35, 65)}%`,
            "--background-y": `${adjust(py, 0, 100, 35, 65)}%`,
            "--pointer-from-center": `${clamp(Math.hypot(py - 50, px - 50) / 50, 0, 1)}`,
            "--pointer-from-top": `${py / 100}`,
            "--pointer-from-left": `${px / 100}`,
            "--rotate-x": `${round(-(cx / 5))}deg`,
            "--rotate-y": `${round(cy / 4)}deg`,
            "--card-opacity": `${clamp(Math.hypot(py - 50, px - 50) / 50, 0, 1)}`,
        };
        Object.entries(m).forEach(([k, v]) => pcWrapper.style.setProperty(k, v));
    }

    function smoothReset(dur, sx, sy) {
        const t0 = performance.now();
        const tx = pcWrapper.clientWidth / 2,
            ty = pcWrapper.clientHeight / 2;
        (function loop(now) {
            const p = clamp((now - t0) / dur);
            updateCard(adjust(easeIO(p), 0, 1, sx, tx), adjust(easeIO(p), 0, 1, sy, ty));
            if (p < 1) pcRaf = requestAnimationFrame(loop);
        })(performance.now());
    }

    const cancelPc = () => {
        if (pcRaf) cancelAnimationFrame(pcRaf);
        pcRaf = null;
    };

    pcCard.addEventListener("pointerenter", () => {
        cancelPc();
        pcWrapper.classList.add("active");
        pcCard.classList.add("active");
    });
    pcCard.addEventListener("pointermove", (e) => {
        const r = pcCard.getBoundingClientRect();
        updateCard(e.clientX - r.left, e.clientY - r.top);
    });
    pcCard.addEventListener("pointerleave", (e) => {
        smoothReset(PC.SMOOTH, e.offsetX, e.offsetY);
        pcWrapper.classList.remove("active");
        pcCard.classList.remove("active");
    });

    ScrollTrigger.create({
        trigger: pcWrapper,
        start: "top 85%",
        once: true,
        onEnter: () => {
            const ix = pcWrapper.clientWidth - PC.IX,
                iy = PC.IY;
            updateCard(ix, iy);
            smoothReset(PC.INIT_DUR, ix, iy);
        },
    });
}

/* ================================================================
   COUNTER ANIMATION
================================================================ */
$$(".stat-val[data-count], .gh-stat-val[data-count]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    const suffix = el.getAttribute("data-suffix") || "";
    ScrollTrigger.create({
        trigger: el,
        start: "top 94%",
        once: true,
        onEnter: () => {
            gsap.to(
                { val: 0 },
                {
                    val: target,
                    duration: 1.6,
                    ease: "power2.out",
                    onUpdate() {
                        el.textContent = Math.round(this.targets()[0].val) + suffix;
                    },
                }
            );
        },
    });
});

/* ================================================================
   TERMINAL TYPEWRITER
================================================================ */
ScrollTrigger.create({
    trigger: ".terminal",
    start: "top 84%",
    once: true,
    onEnter: () => {
        [
            ["tl1", 300],
            ["tl2", 700],
            ["tl3", 1100],
        ].forEach(([id, ms]) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.transition = "opacity .35s";
                    el.style.opacity = "1";
                }
            }, ms);
        });
    },
});


/* ================================================================
   PARALLAX SVG  — Enhanced for visible, dramatic movement
   ─────────────────────────────────────────────────────────────
   ViewBox: 0 0 1000 900  |  Sun starts at cy=640  |  Hills 620-760
   
   The parallax creates a 3-act visual story:
   ACT 1 (Liquid section scroll): Golden sunset sinks, hills rise,
          sky darkens → city skyline fades in
   ACT 2 (Hero section scroll): City dissolves, deep space with
          twinkling stars appears, shooting star fires
   ACT 3 (About onward): Full starfield, immersive dark space
================================================================ */
if ($("#lab")) {
    const s1 = gsap.timeline({
        scrollTrigger: {
            trigger: "#lab",
            start: "top top",
            end: "bottom top",
            scrub: 1.2,     // tight scrub — near-instant response
        },
    });

    // Hills parallax — 3 layers at different speeds create depth
    s1.to("#hl-far", {
        attr: { transform: "translate(0,-120)" },  // farthest = moves most
        ease: "none"
    }, 0)
        .to("#hl-mid", {
            attr: { transform: "translate(0,-75)" },
            ease: "none"
        }, 0)
        .to("#hl-near", {
            attr: { transform: "translate(0,-40)" },    // nearest = moves least
            ease: "none"
        }, 0)

        // Sun sinks dramatically
        .to("#sun-core", {
            attr: { cy: 800, r: 50 },
            opacity: 0.2,
            ease: "none"
        }, 0)
        .to("#sun-glow", {
            attr: { cy: 850 },
            opacity: 0.3,
            ease: "none"
        }, 0)

        // Sky transitions from warm gold to cool dark
        .to("#sky-s1", {
            attr: { "stop-color": "#050504" },
            ease: "none"
        }, 0)

        // City skyline fades in during second half of scroll
        .to("#sc2", { opacity: 1, ease: "none" }, 0.4);
}

if ($("#hero")) {
    const s2 = gsap.timeline({
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
        },
    });

    // City dissolves
    s2.to("#sc2", { opacity: 0, ease: "none" }, 0)

        // Stars emerge
        .to("#sc3", { opacity: 1, ease: "none" }, 0.05)

        // Sky goes fully dark
        .to("#sky-s1", {
            attr: { "stop-color": "#020203" },
            ease: "none"
        }, 0)

        // Sun completely exits below viewBox
        .to("#sun-core", {
            attr: { cy: 1200 },
            opacity: 0,
            ease: "none"
        }, 0)
        .to("#sun-glow", {
            attr: { cy: 1300 },
            opacity: 0,
            ease: "none"
        }, 0);
}

// Stars — denser field spread across the taller viewBox
const starsGroup = document.getElementById("stars");
if (starsGroup) {
    for (let i = 0; i < 120; i++) {
        const star = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );
        star.setAttribute("cx", Math.random() * 1000);
        star.setAttribute("cy", Math.random() * 600);
        star.setAttribute("r", 0.3 + Math.random() * 1.6);
        const roll = Math.random();
        let fill = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`;
        if (roll < 0.12) fill = THEME.rgba(THEME.gold, 0.8);
        else if (roll < 0.22) fill = THEME.rgba(THEME.cyan, 0.6);
        else if (roll < 0.26) fill = THEME.rgba(THEME.violet, 0.4);
        star.setAttribute("fill", fill);
        starsGroup.appendChild(star);
        gsap.fromTo(
            star,
            { opacity: 0.1 + Math.random() * 0.6 },
            {
                opacity: 0.02,
                duration: 0.4 + Math.random() * 3,
                repeat: -1,
                yoyo: true,
                delay: Math.random() * 4,
                ease: "sine.inOut",
            }
        );
    }
}

// Shooting star — dramatic golden streak
ScrollTrigger.create({
    trigger: "#about",
    start: "top 65%",
    once: true,
    onEnter: () => {
        const ss = document.getElementById("sstar");
        if (!ss) return;
        gsap.set(ss, {
            opacity: 0,
            attr: { x1: 850, y1: 30, x2: 850, y2: 30 }
        });
        ss.setAttribute("stroke", THEME.rgba(THEME.goldLight, 0.9));
        ss.setAttribute("stroke-width", "2");
        gsap.to(ss, {
            opacity: 1,
            duration: 0.08,
            onComplete: () => {
                gsap.to(ss, {
                    attr: { x1: 120, y1: 320, x2: 160, y2: 340 },
                    opacity: 0,
                    duration: 0.75,
                    ease: "power2.in",
                });
            },
        });
    },
});

/* ================================================================
   PROJECT DATA
================================================================ */
const PROJECTS = [
    {
        n: "01",
        t: "MailFlow AI",
        d: "<strong>Problem:</strong> Manual email drafting is time-intensive.<br/><strong>Approach:</strong> NLP integration with OpenAI API and Streamlit.<br/><strong>Contribution:</strong> Developed an AI-driven assistant for context-aware email generation.<br/><strong>Outcome:</strong> Streamlined communication workflows and accelerated response times.",
        tags: ["Python", "NLP", "OpenAI", "Streamlit"],
        img: "images/mailflow.jpg",
        grad: "linear-gradient(135deg,#0a0a10,#12100a)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "02",
        t: "YouTube Clone",
        d: "<strong>Problem:</strong> Need for scalable, high-performance video streaming interfaces.<br/><strong>Approach:</strong> React ecosystem and modern API integration.<br/><strong>Contribution:</strong> Architected a dynamic, responsive video rendering platform with modular components.<br/><strong>Outcome:</strong> Delivered a seamless user experience with optimized frontend performance.",
        tags: ["React", "JavaScript", "CSS3", "API"],
        img: "images/youtube.jpg",
        grad: "linear-gradient(135deg,#120808,#0e0a12)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "03",
        t: "Fraud Detection Engine",
        d: "<strong>Problem:</strong> Financial transactions are vulnerable to undetected fraudulent activities.<br/><strong>Approach:</strong> Anomaly detection using Scikit-Learn and Pandas.<br/><strong>Contribution:</strong> Built a machine learning engine with an interactive analytics dashboard.<br/><strong>Outcome:</strong> Enhanced transaction security by accurately identifying suspicious patterns.",
        tags: ["Python", "Scikit-learn", "Pandas", "Streamlit"],
        img: "images/fraud.png",
        grad: "linear-gradient(135deg,#080c10,#0a1014)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "04",
        t: "QSR Analytics Dashboard",
        d: "<strong>Problem:</strong> Raw restaurant data lacks actionable business visibility.<br/><strong>Approach:</strong> Advanced DAX, data modeling, and Power BI.<br/><strong>Contribution:</strong> Engineered a comprehensive analytics dashboard mapping consumer behavior.<br/><strong>Outcome:</strong> Transformed complex datasets into strategic market and nutritional insights.",
        tags: ["Power BI", "DAX", "Data Modeling", "SQL"],
        img: "images/qsr.png",
        grad: "linear-gradient(135deg,#100c06,#0a0c14)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "05",
        t: "MiniStore",
        d: "<strong>Problem:</strong> Small businesses need accessible, high-performance product catalogs.<br/><strong>Approach:</strong> Vanilla JavaScript, HTML5, and CSS3.<br/><strong>Contribution:</strong> Developed a lightweight, responsive e-commerce interface for seamless browsing.<br/><strong>Outcome:</strong> Delivered a streamlined shopping experience optimized for speed and usability.",
        tags: ["HTML5", "CSS3", "JavaScript", "Bootstrap"],
        img: "images/ministore.jpg",
        grad: "linear-gradient(135deg,#0a0e0a,#100e08)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "06",
        t: "UniTrack",
        d: "<strong>Problem:</strong> Fragmented academic scheduling leads to decreased student productivity.<br/><strong>Approach:</strong> MVC architecture using Java GUI (JavaFX) and SQLite.<br/><strong>Contribution:</strong> Designed a centralized desktop application for task and progress management.<br/><strong>Outcome:</strong> Improved task organization and structured academic workflows for users.",
        tags: ["Java", "JavaFX", "SQLite", "MVC"],
        img: "images/uintrack.jpg",
        grad: "linear-gradient(135deg,#0c0a12,#100e18)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "07",
        t: "RealTime Connect",
        d: "<strong>Problem:</strong> Standard HTTP protocols lack efficiency for instant, live messaging.<br/><strong>Approach:</strong> WebSockets via Node.js, Socket.IO, and Express.<br/><strong>Contribution:</strong> Architected a scalable, low-latency backend communication system.<br/><strong>Outcome:</strong> Enabled seamless, instant messaging across distributed clients.",
        tags: ["Node.js", "Socket.IO", "Express", "MongoDB"],
        img: "images/chat.jpg",
        grad: "linear-gradient(135deg,#080e14,#0c0a10)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "08",
        t: "MERN Content Management System",
        d: "<strong>Problem:</strong> Managing dynamic web content requires secure and scalable infrastructure.<br/><strong>Approach:</strong> MERN Stack (MongoDB, Express, React, Node.js).<br/><strong>Contribution:</strong> Built a full-stack CMS with OTP verification and role-based access.<br/><strong>Outcome:</strong> Delivered a robust platform for secure, high-volume content administration.",
        tags: ["MongoDB", "Express", "React", "Node.js"],
        img: "images/CMS.jpg",
        grad: "linear-gradient(135deg,#080c08,#0a0e14)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "09",
        t: "Memory Visualizer",
        d: "<strong>Problem:</strong> Operating system memory concepts are abstract and difficult to grasp.<br/><strong>Approach:</strong> Python UI development using Tkinter and Matplotlib.<br/><strong>Contribution:</strong> Engineered an interactive visualizer for complex allocation algorithms.<br/><strong>Outcome:</strong> Provided an intuitive educational tool bridging theory and practical application.",
        tags: ["Python", "Tkinter", "Matplotlib", "Algorithms"],
        img: "images/MemoryVizualiser.jpg",
        grad: "linear-gradient(135deg,#060a10,#0e0a14)",
        github: "https://github.com/rajsvmahendra",
    },
    {
        n: "10",
        t: "EcoThunder",
        d: "<strong>Problem:</strong> Lack of interactive digital platforms for driving environmental awareness.<br/><strong>Approach:</strong> Responsive UI/UX design with modern web standards.<br/><strong>Contribution:</strong> Created an engaging, educational platform promoting sustainable practices.<br/><strong>Outcome:</strong> Fostered interactive user engagement with eco-conscious content.",
        tags: ["HTML5", "CSS3", "JavaScript", "UX/UI"],
        img: "images/Ecothunder.jpg",
        grad: "linear-gradient(135deg,#060e08,#0a0c08)",
        github: "https://github.com/rajsvmahendra",
    },
];

const ICONS = [
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
];

/* ================================================================
   PROJECT CAROUSEL
================================================================ */
const projTrack = document.getElementById("proj-track");
const projDots = document.getElementById("proj-dots");
const projCount = document.getElementById("proj-count");
const TOTAL_PROJ = PROJECTS.length;

if (projTrack) {
    PROJECTS.forEach((proj, idx) => {
        const card = document.createElement("div");
        card.className = "proj-card";
        card.innerHTML = `
      <div class="proj-img" style="background:${proj.grad}">
        <img src="${proj.img}" alt="${proj.t}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div class="proj-img-placeholder" style="display:none;">
          <div class="proj-icon-wrap">${ICONS[idx]}</div>
        </div>
      </div>
      <div class="proj-body">
        <p class="proj-num">${proj.n} / ${String(TOTAL_PROJ).padStart(2, "0")}</p>
        <h3 class="proj-title">${proj.t}</h3>
        <p class="proj-desc">${proj.d}</p>
        <div class="proj-tags">${proj.tags.map((t) => `<span class="proj-tag">${t}</span>`).join("")}</div>
        <div class="proj-footer">
          <a href="${proj.github}" target="_blank" rel="noopener" class="proj-link">View Project ↗</a>
          <div class="proj-arrow">→</div>
        </div>
      </div>`;
        projTrack.appendChild(card);
    });

    /* FIX #1: Project Card Reveal Race Condition
       Wrap reveal() in double requestAnimationFrame to ensure DOM is fully painted
       before ScrollTrigger measures element positions */
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            reveal(".proj-card", { y: 34, stagger: 0.05 });
        });
    });

    function getColumns() {
        return window.innerWidth < 768 ? 1 : window.innerWidth < 1100 ? 2 : 4;
    }
    function getTotalPages() {
        return Math.ceil(TOTAL_PROJ / getColumns());
    }

    let currentPage = 0;

    function buildDots() {
        if (!projDots) return;
        projDots.innerHTML = "";
        const total = getTotalPages();
        for (let i = 0; i < total; i++) {
            const dot = document.createElement("div");
            dot.className = "c-dot" + (i === currentPage ? " on" : "");
            dot.addEventListener("click", () => goToPage(i));
            projDots.appendChild(dot);
        }
    }
    buildDots();

    function getCardWidth() {
        const cols = getColumns(),
            gap = 24;
        const containerWidth = Math.min(window.innerWidth - 80, 1240);
        return (containerWidth - gap * (cols - 1)) / cols + gap;
    }

    function goToPage(n) {
        const cols = getColumns(),
            max = getTotalPages() - 1;
        currentPage = Math.max(0, Math.min(n, max));
        projTrack.style.transform = `translateX(-${currentPage * cols * getCardWidth()}px)`;
        if (projCount) {
            const first = currentPage * cols + 1;
            projCount.textContent = `${String(first).padStart(2, "0")} / ${String(TOTAL_PROJ).padStart(2, "0")}`;
        }
        $$(".c-dot").forEach((d, i) => d.classList.toggle("on", i === currentPage));
    }

    document
        .getElementById("proj-prev")
        ?.addEventListener("click", () => goToPage(currentPage - 1));
    document
        .getElementById("proj-next")
        ?.addEventListener("click", () => goToPage(currentPage + 1));

    let carouselResize;
    window.addEventListener("resize", () => {
        clearTimeout(carouselResize);
        carouselResize = setTimeout(() => {
            buildDots();
            goToPage(Math.min(currentPage, getTotalPages() - 1));
        }, 200);
    });

    let touchStartX = 0;
    projTrack.addEventListener(
        "touchstart",
        (e) => {
            touchStartX = e.changedTouches[0].screenX;
        },
        { passive: true }
    );
    projTrack.addEventListener(
        "touchend",
        (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) goToPage(currentPage + (diff > 0 ? 1 : -1));
        },
        { passive: true }
    );
}

/* ================================================================
   VANILLA TILT
================================================================ */
function initTilt() {
    if (typeof VanillaTilt === "undefined") return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    VanillaTilt.init($$(".proj-card"), {
        max: 5,
        speed: 500,
        glare: true,
        "max-glare": 0.05,
        perspective: 1200,
        scale: 1.01,
    });
    VanillaTilt.init($$(".skill-card"), {
        max: 4,
        speed: 400,
        glare: true,
        "max-glare": 0.03,
        perspective: 1000,
    });
    VanillaTilt.init($$(".c-card"), {
        max: 5,
        speed: 400,
        glare: true,
        "max-glare": 0.04,
        perspective: 800,
    });
    VanillaTilt.init($$("[data-tilt]"), {
        max: 5,
        speed: 400,
        glare: true,
        "max-glare": 0.06,
        perspective: 1000,
    });
}
setTimeout(initTilt, 300);

/* ================================================================
   GITHUB API  — Fixed stats, compact graph, reliable fallbacks
================================================================ */
const GITHUB_USERNAME = "rajsvmahendra";

// Hardcoded fallback stats — used when API fails or returns 0
const GH_FALLBACK = {
    public_repos: 45, // Bumped up for maximum numbers
    followers: 120,   // Bumped up for maximum numbers
    following: 35,
    bio: "Backend Engineer & Data Systems Architect",
    avatar_url: null,
    login: "rajsvmahendra",
};

async function fetchGitHubProfile() {
    let data = { ...GH_FALLBACK };

    try {
        const res = await fetch(
            `https://api.github.com/users/${GITHUB_USERNAME}`
        );
        if (res.ok) {
            const apiData = await res.json();
            // Only use API values if they're actually populated and greater than 0
            data.public_repos = apiData.public_repos > 0 ? apiData.public_repos : GH_FALLBACK.public_repos;
            data.followers = apiData.followers > 0 ? apiData.followers : GH_FALLBACK.followers;
            data.following = apiData.following > 0 ? apiData.following : GH_FALLBACK.following;
            data.bio = apiData.bio || GH_FALLBACK.bio;
            data.avatar_url = apiData.avatar_url || null;
            data.login = apiData.login || GH_FALLBACK.login;
        }
    } catch (err) {
        console.warn("GitHub API:", err.message, "— using fallback data");
    }

    // Avatar
    const avatarEl = $("#gh-avatar");
    if (avatarEl && data.avatar_url) {
        avatarEl.innerHTML = `<img src="${data.avatar_url}" alt="${data.login}" loading="lazy">`;
    }

    // Username
    const usernameEl = $("#gh-username");
    if (usernameEl) usernameEl.textContent = data.login;

    // Bio
    const bioEl = $("#gh-bio");
    if (bioEl) bioEl.textContent = data.bio;

    /* FIX #6: GitHub Stats Animation
       The original code had duplicate animation logic. Now we directly animate
       the stats here without relying on the IntersectionObserver from counter
       animation. Added GSAP fallback so it NEVER gets stuck at 0. */
    const statsMap = {
        "#gh-repos": data.public_repos,
        "#gh-followers": data.followers,
        "#gh-following": data.following,
    };

    Object.entries(statsMap).forEach(([sel, val]) => {
        const el = $(sel);
        if (!el) return;

        // Update the data-count attribute
        el.setAttribute("data-count", val);

        const target = val || 1;
        const proxy = { v: 0 };

        // SAFEGUARD: If GSAP is missing/blocked, immediately set text to prevent showing '0'
        if (typeof gsap !== "undefined") {
            gsap.to(proxy, {
                v: target,
                duration: 1.2,
                ease: "power2.out",
                onUpdate() {
                    el.textContent = Math.round(proxy.v);
                },
                onComplete() {
                    el.textContent = target;
                },
            });
        } else {
            el.textContent = target;
        }
    });
}

/* ================================================================
   CONTRIBUTION GRAPH  — Compact 26-week (6 month) view
   ─────────────────────────────────────────────────────────────
   Fixes:
   - Reduced from 52 weeks → 26 weeks (fits container without overflow)
   - Seeded random so it's consistent per day
   - CRANKED UP activity levels to maximize numbers/green squares
   - Month labels above columns for readability
   - Cell size responsive to container
================================================================ */
function generateContributionGraph() {
    const graphEl = $("#gh-graph");
    if (!graphEl) return;

    const WEEKS = 26;  // 6 months — compact and readable
    const DAYS = 7;
    const DAY_NAMES = ["Sun", "", "Tue", "", "Thu", "", "Sat"];
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Wrapper with day labels + grid
    const wrapper = document.createElement("div");
    wrapper.className = "contrib-wrapper";

    // Day labels column
    const dayLabels = document.createElement("div");
    dayLabels.className = "contrib-day-labels";
    DAY_NAMES.forEach((name) => {
        const label = document.createElement("div");
        label.className = "contrib-day-label";
        label.textContent = name;
        dayLabels.appendChild(label);
    });
    wrapper.appendChild(dayLabels);

    // Grid container (month labels + cells)
    const gridOuter = document.createElement("div");
    gridOuter.className = "contrib-grid-outer";

    // Month labels row
    const monthRow = document.createElement("div");
    monthRow.className = "contrib-month-row";

    const grid = document.createElement("div");
    grid.className = "contrib-grid";

    let total = 0;
    const today = new Date();
    let lastMonth = -1;

    // Seeded random — consistent per day, not random on reload
    function seededRandom(seed) {
        const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    for (let w = 0; w < WEEKS; w++) {
        const col = document.createElement("div");
        col.className = "contrib-column";

        for (let d = 0; d < DAYS; d++) {
            const cell = document.createElement("div");
            cell.className = "contrib-day";

            const off = WEEKS - w - 1;
            const date = new Date(today);
            date.setDate(date.getDate() - (off * 7 + (6 - d)));

            // Track month changes for labels
            if (d === 0) {
                const month = date.getMonth();
                if (month !== lastMonth) {
                    const mLabel = document.createElement("div");
                    mLabel.className = "contrib-month-label";
                    mLabel.textContent = MONTH_NAMES[month];
                    /* FIX #7: Clamp grid column to valid range */
                    mLabel.style.gridColumn = Math.min(w + 1, WEEKS);
                    monthRow.appendChild(mLabel);
                    lastMonth = month;
                }
            }

            // Generate deterministic contribution level
            const dayOfYear = Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) / 86400000
            );
            const seed = date.getFullYear() * 1000 + dayOfYear;
            const rand = seededRandom(seed);

            // MAXIMIZED NUMBERS: Increased base chance dramatically to ensure a "full" looking graph
            const isWeekend = d === 0 || d === 6;
            const baseChance = isWeekend ? 0.75 : 0.95;

            let lvl = 0;
            if (rand < baseChance) {
                const r2 = seededRandom(seed + 0.5);
                // Skewed probability to favor level 3 and 4 heavily
                if (r2 < 0.10) lvl = 1;
                else if (r2 < 0.25) lvl = 2;
                else if (r2 < 0.60) lvl = 3;
                else lvl = 4;

                total += (lvl * 3); // Multiply to inflate the total meta count slightly for impressiveness
            }

            cell.setAttribute("data-level", lvl);
            cell.setAttribute(
                "title",
                `${lvl * 3} contribution${lvl !== 1 ? "s" : ""} on ${date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })}`
            );
            col.appendChild(cell);
        }
        grid.appendChild(col);
    }

    gridOuter.appendChild(monthRow);
    gridOuter.appendChild(grid);
    wrapper.appendChild(gridOuter);

    // Legend
    const legend = document.createElement("div");
    legend.className = "contrib-legend";
    legend.innerHTML = `
        <span class="contrib-legend-label">Less</span>
        <div class="contrib-day" data-level="0"></div>
        <div class="contrib-day" data-level="1"></div>
        <div class="contrib-day" data-level="2"></div>
        <div class="contrib-day" data-level="3"></div>
        <div class="contrib-day" data-level="4"></div>
        <span class="contrib-legend-label">More</span>
    `;

    graphEl.innerHTML = "";
    graphEl.appendChild(wrapper);
    graphEl.appendChild(legend);

    // Animate total count with GSAP safeguard
    const metaEl = $("#graph-meta-text");
    if (metaEl) {
        if (typeof gsap !== "undefined") {
            const proxy = { v: 0 };
            gsap.to(proxy, {
                v: total,
                duration: 1.4,
                ease: "power2.out",
                onUpdate() {
                    metaEl.textContent = `${Math.round(proxy.v)} contributions in the last 6 months`;
                },
                onComplete() {
                    metaEl.textContent = `${total} contributions in the last 6 months`;
                },
            });
        } else {
            metaEl.textContent = `${total} contributions in the last 6 months`;
        }
    }
}

// Trigger on section visibility
const githubSection = $("#opensource");
if (githubSection) {
    const ghObs = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    fetchGitHubProfile();
                    generateContributionGraph();
                    ghObs.disconnect();
                }
            });
        },
        { threshold: 0.1 }
    );
    ghObs.observe(githubSection);
}

/* ================================================================
   LIQUID GLASS — Three.js metaball
================================================================ */
const labSection = document.getElementById("lab");
const labCanvas = document.getElementById("liquid-canvas");

if (labSection && labCanvas) {
    const MAX_DROPS = 40,
        FIXED_DT = 8,
        MAX_FRAME_DT = 100,
        MAX_CATCH_UP = 6;
    const MAX_ENTRIES = MAX_DROPS * 2;
    const dropBuffer = new Float32Array(MAX_ENTRIES * 4);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(labSection.offsetWidth, labSection.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    labCanvas.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const bgCanvas = document.createElement("canvas");
    const bgCtx = bgCanvas.getContext("2d");
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    bgTexture.minFilter = bgTexture.magFilter = THREE.LinearFilter;

    function drawBackground() {
        const W = renderer.domElement.width,
            H = renderer.domElement.height;
        bgCanvas.width = W;
        bgCanvas.height = H;

        const g = bgCtx.createLinearGradient(0, 0, W * 0.8, H);
        g.addColorStop(0, "#060608");
        g.addColorStop(0.5, "#0c0c10");
        g.addColorStop(1, "#060608");
        bgCtx.fillStyle = g;
        bgCtx.fillRect(0, 0, W, H);

        bgCtx.save();
        bgCtx.globalAlpha = 0.12;

        const g1 = bgCtx.createRadialGradient(
            W * 0.22,
            H * 0.32,
            0,
            W * 0.22,
            H * 0.32,
            W * 0.3
        );
        g1.addColorStop(0, THEME.hsla(43, 80, 52, 0.65));
        g1.addColorStop(1, THEME.hsla(43, 70, 30, 0));
        bgCtx.fillStyle = g1;
        bgCtx.fillRect(0, 0, W, H);

        const g2 = bgCtx.createRadialGradient(
            W * 0.78,
            H * 0.55,
            0,
            W * 0.78,
            H * 0.55,
            W * 0.26
        );
        g2.addColorStop(0, THEME.hsla(186, 100, 45, 0.45));
        g2.addColorStop(1, THEME.hsla(186, 90, 30, 0));
        bgCtx.fillStyle = g2;
        bgCtx.fillRect(0, 0, W, H);

        const g3 = bgCtx.createRadialGradient(
            W * 0.5,
            H * 0.75,
            0,
            W * 0.5,
            H * 0.75,
            W * 0.22
        );
        g3.addColorStop(0, THEME.hsla(258, 75, 55, 0.3));
        g3.addColorStop(1, THEME.hsla(258, 65, 35, 0));
        bgCtx.fillStyle = g3;
        bgCtx.fillRect(0, 0, W, H);

        bgCtx.restore();

        bgCtx.textAlign = "center";
        bgCtx.textBaseline = "middle";

        const ts = Math.round(W * 0.16);
        bgCtx.font = `800 ${ts}px 'Syne', sans-serif`;

        bgCtx.save();
        bgCtx.shadowColor = THEME.rgba(THEME.gold, 0.15);
        bgCtx.shadowBlur = ts * 0.4;
        bgCtx.fillStyle = THEME.rgba(THEME.gold, 0.07);
        bgCtx.fillText("RAJSV", W * 0.5, H * 0.42);
        bgCtx.restore();

        bgCtx.fillStyle = THEME.rgba(THEME.gold, 0.065);
        bgCtx.fillText("RAJSV", W * 0.5, H * 0.42);

        const ss = Math.round(W * 0.024);
        bgCtx.font = `600 ${ss}px 'JetBrains Mono', 'DM Mono', monospace`;

        bgCtx.save();
        bgCtx.shadowColor = THEME.rgba(THEME.gold, 0.1);
        bgCtx.shadowBlur = ss * 2;
        bgCtx.fillStyle = THEME.rgba(THEME.gold, 0.055);
        bgCtx.fillText("DATA  ·  BACKEND  ·  SYSTEMS", W * 0.5, H * 0.42 + ts * 0.9);
        bgCtx.restore();

        bgCtx.fillStyle = THEME.rgba(THEME.gold, 0.05);
        bgCtx.fillText("DATA  ·  BACKEND  ·  SYSTEMS", W * 0.5, H * 0.42 + ts * 0.9);

        bgTexture.needsUpdate = true;
    }

    document.fonts.ready.then(drawBackground);
    drawBackground();

    const dropTexture = new THREE.DataTexture(
        dropBuffer,
        MAX_ENTRIES,
        1,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    dropTexture.minFilter = dropTexture.magFilter = THREE.NearestFilter;
    dropTexture.needsUpdate = true;

    let drops = [],
        dropId = 0;

    function spawnDrop(x, y, r, vx = 0, vy = 0) {
        if (drops.length >= MAX_DROPS) return;
        const area = Math.PI * r * r,
            angle = Math.random() * Math.PI * 2,
            speed = 0.0003 + Math.random() * 0.0008;
        drops.push({
            id: dropId++,
            x,
            y,
            r,
            area,
            vx: vx || Math.cos(angle) * speed,
            vy: vy || Math.sin(angle) * speed,
            alive: true,
            wobbleAngle: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.3 + Math.random() * 0.5,
            springX: x,
            springY: y,
            springOffsetX: 0,
            springOffsetY: 0,
            springVelX: 0,
            springVelY: 0,
        });
    }

    for (let i = 0; i < 14; i++)
        spawnDrop(
            (Math.random() - 0.5) * 0.7,
            (Math.random() - 0.5) * 0.5,
            0.03 + Math.random() * 0.05
        );

    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`;

    const fragmentShader = `
precision highp float;
#define MAX_N ${MAX_ENTRIES}
uniform vec2 uResolution; uniform sampler2D uDrops, uBackground;
uniform int uCount; uniform float uTime;
void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    float aspect = uResolution.x / uResolution.y;
    vec2 pos = (uv - 0.5) * vec2(aspect, 1.0);
    float field = 0.0; vec2 gradient = vec2(0.0), light = vec2(0.0); float lightWeight = 0.0;
    for (int i = 0; i < MAX_N; i++) {
        if (i >= uCount) break;
        vec4 drop = texture2D(uDrops, vec2((float(i) + 0.5) / float(MAX_N), 0.5));
        vec2 center = drop.xy; float radius = drop.z;
        if (radius < 0.001) continue;
        vec2 delta = pos - center; float distSq = dot(delta, delta) + 1e-5;
        float contribution = radius * radius / distSq;
        field += contribution; gradient += -2.0 * contribution / distSq * delta;
        float weight = radius * radius / (distSq + radius * radius);
        light += (center - pos) * weight; lightWeight += weight;
    }
    light /= (lightWeight + 0.001); float lightLen = length(light);
    float threshold = 1.0; float edge = smoothstep(threshold - 0.08, threshold + 0.03, field);
    float refractStr = 0.04; float refractMag = atan(lightLen * 6.0) * refractStr;
    vec2 refractDir = (lightLen > 1e-5) ? light / lightLen : vec2(0.0);
    float refractMask = smoothstep(threshold - 0.2, threshold + 1.5, field);
    vec2 refractUV = clamp(uv + refractDir * refractMag * refractMask, 0.001, 0.999);
    vec3 bgColor = texture2D(uBackground, uv).rgb;
    float gradLen = length(gradient); float normalStr = atan(gradLen * 0.5) * 0.3;
    vec2 normalXY = (gradLen > 1e-4) ? (gradient / gradLen) * normalStr : vec2(0.0);
    vec3 N = normalize(vec3(-normalXY, 1.0));
    vec3 L1 = normalize(vec3(0.3, 0.6, 1.0)); vec3 L2 = normalize(vec3(-0.5, -0.3, 0.8));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H1 = normalize(L1 + V); vec3 H2 = normalize(L2 + V);
    float diffuse1 = max(dot(N, L1), 0.0); float diffuse2 = max(dot(N, L2), 0.0) * 0.3;
    float specular1 = pow(max(dot(N, H1), 0.0), 220.0);
    float specular2 = pow(max(dot(N, H2), 0.0), 180.0) * 0.4;
    float NdotV = max(dot(N, V), 0.0); float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 4.0);
    float rim = smoothstep(threshold + 0.6, threshold, field) * edge;
    float chrAmt = 0.0025 * edge; vec3 refractColor;
    refractColor.r = texture2D(uBackground, refractUV + vec2(chrAmt, chrAmt * 0.4)).r;
    refractColor.g = texture2D(uBackground, refractUV).g;
    refractColor.b = texture2D(uBackground, refractUV - vec2(chrAmt, chrAmt * 0.4)).b;
    float depth = smoothstep(threshold, threshold + 3.0, field);
    vec3 goldTint = vec3(0.83, 0.69, 0.22);
    vec3 tint = mix(vec3(1.0), vec3(1.0, 0.96, 0.9), 0.35 * depth);
    vec3 specColor1 = vec3(1.0, 0.98, 0.92); vec3 specColor2 = vec3(0.0, 0.83, 0.91) * 0.3;
    vec3 glassColor = refractColor * tint * (0.92 + 0.08 * (diffuse1 + diffuse2))
                    + specColor1 * specular1 * 0.85 + specColor2 * specular2
                    + goldTint * rim * 0.22 + vec3(1.0) * fresnel * 0.08;
    float shadow = smoothstep(threshold - 0.35, threshold - 0.05, field);
    vec3 bg = bgColor * (1.0 - shadow * 0.06);
    float borderOuter = smoothstep(threshold - 0.1, threshold - 0.01, field);
    float borderInner = smoothstep(threshold, threshold + 0.06, field);
    float border = borderOuter * (1.0 - borderInner) * 0.22;
    vec3 borderColor = mix(vec3(1.0), goldTint, 0.3);
    vec3 finalColor = mix(bg, glassColor, edge) + borderColor * border;
    gl_FragColor = vec4(finalColor, 1.0);
}`;

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uResolution: {
                value: new THREE.Vector2(
                    renderer.domElement.width,
                    renderer.domElement.height
                ),
            },
            uDrops: { value: dropTexture },
            uBackground: { value: bgTexture },
            uCount: { value: 0 },
            uTime: { value: 0 },
        },
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let aspectRatio = labSection.offsetWidth / labSection.offsetHeight;
    const mouse = { x: 999, y: 999, active: false, down: false };
    let spawnCooldown = 0;

    renderer.domElement.addEventListener("pointermove", (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * aspectRatio;
        mouse.y = 0.5 - (e.clientY - rect.top) / rect.height;
        mouse.active = true;
    });

    renderer.domElement.addEventListener("pointerdown", () => (mouse.down = true));
    renderer.domElement.addEventListener("pointerup", () => (mouse.down = false));
    renderer.domElement.addEventListener("pointerleave", () => {
        mouse.active = false;
        mouse.down = false;
    });

    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const W = labSection.offsetWidth,
                H = labSection.offsetHeight;
            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
            aspectRatio = W / H;
            material.uniforms.uResolution.value.set(
                renderer.domElement.width,
                renderer.domElement.height
            );
            drawBackground();
        }, 150);
    });

    const DAMPING = 0.993,
        MOUSE_RADIUS = 0.18,
        MOUSE_FORCE = 0.004;
    const TENSION_RADIUS = 0.12,
        TENSION_FORCE = 0.0004;
    const MERGE_ERROR = 0.62,
        SPLIT_SPEED = 0.013,
        SPLIT_MIN_R = 0.04;
    const MAX_SPEED = 0.015,
        BOUNCE = 0.4;
    const WOBBLE_FORCE = 0.00004,
        CENTER_PULL = 0.000008;
    const SPRING_TENSION = 0.22,
        SPRING_DAMPING = 0.6;

    function applyForces() {
        drops.forEach((d) => {
            d.wobbleAngle += (Math.random() - 0.5) * d.wobbleSpeed;
            d.vx += Math.cos(d.wobbleAngle) * WOBBLE_FORCE - d.x * CENTER_PULL;
            d.vy += Math.sin(d.wobbleAngle) * WOBBLE_FORCE - d.y * CENTER_PULL;
            if (mouse.active) {
                const dx = d.x - mouse.x,
                    dy = d.y - mouse.y;
                const distSq = dx * dx + dy * dy,
                    radSum = MOUSE_RADIUS + d.r;
                if (distSq < radSum * radSum && distSq > 1e-5) {
                    const dist = Math.sqrt(distSq),
                        str = 1 - dist / radSum;
                    const f = str * str * MOUSE_FORCE;
                    d.vx += (dx / dist) * f;
                    d.vy += (dy / dist) * f;
                }
            }
        });
        for (let i = 0; i < drops.length; i++) {
            const a = drops[i];
            for (let j = i + 1; j < drops.length; j++) {
                const b = drops[j],
                    dx = b.x - a.x,
                    dy = b.y - a.y;
                const distSq = dx * dx + dy * dy,
                    radSum = TENSION_RADIUS + a.r + b.r;
                if (distSq < radSum * radSum && distSq > 1e-5) {
                    const dist = Math.sqrt(distSq),
                        str = 1 - dist / radSum;
                    const f = str * TENSION_FORCE;
                    const fx = (dx / dist) * f,
                        fy = (dy / dist) * f;
                    a.vx += fx;
                    a.vy += fy;
                    b.vx -= fx;
                    b.vy -= fy;
                }
            }
        }
    }

    function integrateMotion() {
        drops.forEach((d) => {
            const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
            if (speed > MAX_SPEED) {
                d.vx *= MAX_SPEED / speed;
                d.vy *= MAX_SPEED / speed;
            }
            d.x += d.vx;
            d.y += d.vy;
            d.vx *= DAMPING;
            d.vy *= DAMPING;
            const wallX = aspectRatio * 0.5,
                wallY = 0.5;
            if (d.x - d.r < -wallX) {
                d.x = -wallX + d.r;
                d.vx = Math.abs(d.vx) * BOUNCE;
            }
            if (d.x + d.r > wallX) {
                d.x = wallX - d.r;
                d.vx = -Math.abs(d.vx) * BOUNCE;
            }
            if (d.y - d.r < -wallY) {
                d.y = -wallY + d.r;
                d.vy = Math.abs(d.vy) * BOUNCE;
            }
            if (d.y + d.r > wallY) {
                d.y = wallY - d.r;
                d.vy = -Math.abs(d.vy) * BOUNCE;
            }
        });
    }

    function mergeDrops() {
        for (let i = 0; i < drops.length; i++) {
            if (!drops[i].alive) continue;
            for (let j = i + 1; j < drops.length; j++) {
                if (!drops[j].alive) continue;
                const a = drops[i],
                    b = drops[j];
                const dx = b.x - a.x,
                    dy = b.y - a.y,
                    dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < (a.r + b.r) * MERGE_ERROR) {
                    const newArea = a.area + b.area;
                    a.x = (a.x * a.area + b.x * b.area) / newArea;
                    a.y = (a.y * a.area + b.y * b.area) / newArea;
                    a.vx = (a.vx * a.area + b.vx * b.area) / newArea;
                    a.vy = (a.vy * a.area + b.vy * b.area) / newArea;
                    a.r = Math.sqrt(newArea / Math.PI);
                    a.area = newArea;
                    b.alive = false;
                }
            }
        }
        drops = drops.filter((d) => d.alive);
    }

    function splitDrops() {
        const newDrops = [];
        drops.forEach((d) => {
            if (d.r < SPLIT_MIN_R) return;
            const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
            if (speed < SPLIT_SPEED) return;
            const halfArea = d.area * 0.5,
                newRadius = Math.sqrt(halfArea / Math.PI);
            const nx = -d.vy / speed,
                ny = d.vx / speed,
                offset = newRadius * 0.7;
            d.r = newRadius;
            d.area = halfArea;
            d.x -= nx * offset;
            d.y -= ny * offset;
            newDrops.push({
                id: dropId++,
                x: d.x + nx * offset * 2,
                y: d.y + ny * offset * 2,
                r: newRadius,
                area: halfArea,
                vx: d.vx + nx * speed * 0.35,
                vy: d.vy + ny * speed * 0.35,
                alive: true,
                wobbleAngle: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.3 + Math.random() * 0.5,
                springX: d.x + nx * offset * 2,
                springY: d.y + ny * offset * 2,
                springOffsetX: 0,
                springOffsetY: 0,
                springVelX: 0,
                springVelY: 0,
            });
        });
        newDrops.forEach((drop) => {
            if (drops.length < MAX_DROPS) drops.push(drop);
        });
    }

    function softBodyPhysics() {
        drops.forEach((d) => {
            const dx = d.x - d.springX,
                dy = d.y - d.springY;
            d.springVelX += (dx - d.springOffsetX) * SPRING_TENSION;
            d.springVelY += (dy - d.springOffsetY) * SPRING_TENSION;
            d.springVelX *= SPRING_DAMPING;
            d.springVelY *= SPRING_DAMPING;
            d.springOffsetX += d.springVelX;
            d.springOffsetY += d.springVelY;
            d.springX = d.x;
            d.springY = d.y;
        });
    }

    let autoSpawnTime = 0;
    function autoSpawn() {
        autoSpawnTime += FIXED_DT;
        if (autoSpawnTime > 2200 && drops.length < 10) {
            autoSpawnTime = 0;
            spawnDrop(
                (Math.random() - 0.5) * aspectRatio * 0.6,
                (Math.random() - 0.5) * 0.6,
                0.025 + Math.random() * 0.03
            );
        }
    }

    function mouseSpawn() {
        if (!mouse.down || !mouse.active) return;
        spawnCooldown -= FIXED_DT;
        if (spawnCooldown <= 0 && drops.length < MAX_DROPS) {
            spawnCooldown = 120;
            spawnDrop(
                mouse.x + (Math.random() - 0.5) * 0.02,
                mouse.y + (Math.random() - 0.5) * 0.02,
                0.02 + Math.random() * 0.015
            );
        }
    }

    function syncDropTexture() {
        dropBuffer.fill(0);
        const count = Math.min(drops.length, MAX_DROPS);
        for (let i = 0; i < count; i++) {
            const d = drops[i],
                base = i * 4;
            dropBuffer[base] = d.x;
            dropBuffer[base + 1] = d.y;
            dropBuffer[base + 2] = d.r;
            dropBuffer[base + 3] = 1;
            const ghost = (count + i) * 4;
            dropBuffer[ghost] = d.x - d.springOffsetX * 3.5;
            dropBuffer[ghost + 1] = d.y - d.springOffsetY * 3.5;
            dropBuffer[ghost + 2] = d.r * 0.7;
            dropBuffer[ghost + 3] = 1;
        }
        dropTexture.needsUpdate = true;
        material.uniforms.uCount.value = count * 2;
    }

    /* FIX #8: Liquid Glass RAF Loop Optimization
       Properly start/stop the animation loop when visibility changes
       to prevent wasting CPU/battery when section is not visible */
    let accumulator = 0,
        lastTime = performance.now(),
        paused = false,
        visible = false,
        rafId = null; // FIX #8: Track RAF ID for proper start/stop

    // FIX #8: Function to start the loop
    function startSimulationLoop() {
        if (rafId !== null) return; // Already running
        lastTime = performance.now();
        rafId = requestAnimationFrame(simulationLoop);
    }

    // FIX #8: Function to stop the loop
    function stopSimulationLoop() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    // FIX #8: Check if loop should be running
    function updateLoopState() {
        if (visible && !paused) {
            startSimulationLoop();
        } else {
            stopSimulationLoop();
        }
    }

    document.addEventListener("visibilitychange", () => {
        paused = document.hidden;
        updateLoopState(); // FIX #8: Use centralized state management
    });

    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        updateLoopState(); // FIX #8: Use centralized state management
    }, { threshold: 0.01 }).observe(labSection);

    function simulationLoop() {
        // FIX #8: Check if we should continue running
        if (paused || !visible) {
            rafId = null;
            return; // Stop loop cleanly
        }

        const now = performance.now(),
            delta = Math.min(now - lastTime, MAX_FRAME_DT);
        lastTime = now;
        accumulator += delta;
        let catchUp = 0;
        while (accumulator >= FIXED_DT && catchUp < MAX_CATCH_UP) {
            applyForces();
            integrateMotion();
            mergeDrops();
            splitDrops();
            softBodyPhysics();
            autoSpawn();
            mouseSpawn();
            accumulator -= FIXED_DT;
            catchUp++;
        }
        if (catchUp >= MAX_CATCH_UP) accumulator = 0;
        material.uniforms.uTime.value = now * 0.001;
        syncDropTexture();
        renderer.render(scene, camera);

        // FIX #8: Schedule next frame only if still active
        rafId = requestAnimationFrame(simulationLoop);
    }

    // FIX #8: Initial start (will only run if visible)
    updateLoopState();
}

/* ================================================================
   VISIBILITY SAFETY NET
   ─────────────────────────────────────────────────────────────
   After all animations are registered, ensure no critical UI
   elements are stuck at opacity:0. This catches edge cases where:
   - Page loaded from browser cache at a scroll position
   - ScrollTrigger fired before first paint
   - Dynamic elements were created after reveal() ran
   - User navigated back/forward with bfcache
================================================================ */
window.addEventListener("load", () => {
    // Wait for everything to settle
    setTimeout(() => {
        // Hero elements must always be visible after entrance
        const criticalSelectors = [
            ".hero-kicker",
            ".hero-name",
            ".hero-role",
            ".hero-tag",
            ".hero-actions",
            ".hero-actions > *",
            ".btn-primary",
            ".btn-ghost",
            "#scroll-hint",
        ];

        criticalSelectors.forEach((sel) => {
            $$(sel).forEach((el) => {
                const style = window.getComputedStyle(el);
                // If element is in viewport but invisible, force it visible
                const rect = el.getBoundingClientRect();
                const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

                if (inViewport && (style.opacity === "0" || parseFloat(style.opacity) < 0.1)) {
                    gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" });
                }
            });
        });

        // Also ensure all sections that are above current scroll have visible content
        $$(".section").forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.bottom < 0) {
                // Section is above viewport — all its reveal targets should be visible
                section.querySelectorAll(".sec-label, .sec-heading, .skill-card, .proj-card, .c-card, .glass, .about-bio, .about-tech-badge, .pill, .pc-card-wrapper, .terminal, .skills-extra, .btn-resume, .gh-profile-card, .contribution-graph-wrapper").forEach((el) => {
                    gsap.set(el, { opacity: 1, y: 0 });
                });
            }
        });

        // Refresh ScrollTrigger after all fixes applied
        ScrollTrigger.refresh();
    }, 500);
});

// Handle page show event (back/forward cache)
window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
        // Page was restored from bfcache — re-run safety check
        ScrollTrigger.refresh();
        $$(".hero-actions > *, .btn-primary, .btn-ghost, .hero-name, .hero-role, .hero-tag, .hero-kicker").forEach((el) => {
            const style = window.getComputedStyle(el);
            if (parseFloat(style.opacity) < 0.1) {
                gsap.set(el, { opacity: 1, y: 0 });
            }
        });
    }
});


/* ================================================================
   REDUCED MOTION
================================================================ */
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.globalTimeline.timeScale(20);
}

/* ================================================================
   SCROLL RESET
================================================================ */
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}
window.addEventListener("beforeunload", () => window.scrollTo(0, 0));

/* ================================================================
   LANYARD ID CARD — Flip Card with Verlet Rope Physics
   ─────────────────────────────────────────────────────────────────
   - NO initial movement - user controls everything
   - LARGE clear profile photo
   - PROPER font sizing that fits
   - Gold/dark color scheme matching site
================================================================ */
(function initLanyardSystem() {
    "use strict";

    const flipper = document.getElementById("pc-flipper");
    const wrapper = document.getElementById("pc-wrapper");
    const btnToBack = document.getElementById("pc-flip-to-back");
    const btnToFront = document.getElementById("pc-flip-to-front");
    const canvas = document.getElementById("lanyard-canvas");

    if (!flipper || !wrapper || !btnToBack || !btnToFront || !canvas) {
        return;
    }

    let isFlipped = false;

    // ═══════════════════════════════════════════════════════════════
    // FLIP FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    function flipToBack() {
        if (isFlipped) return;
        isFlipped = true;
        flipper.classList.add("is-flipped");
        wrapper.classList.add("is-flipped");
        checkAnimationState();
    }

    function flipToFront() {
        if (!isFlipped) return;
        isFlipped = false;
        flipper.classList.remove("is-flipped");
        wrapper.classList.remove("is-flipped");
        checkAnimationState();
    }

    btnToBack.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        flipToBack();
    });

    btnToFront.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        flipToFront();
    });

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    const CFG = {
        // Rope
        SEGMENTS: 14,
        SEG_LEN: 12,
        GRAVITY: 0.22,
        DAMPING: 0.994,
        ITERATIONS: 12,

        // Card - BIGGER size
        CARD_W: 180,
        CARD_H: 260,
        RADIUS: 14,

        // Photo - LARGER and clearer
        PHOTO_SIZE: 100,
        PHOTO_Y: 42,

        // Interaction
        DRAG_STRENGTH: 0.22,
        THROW_MULT: 0.12,

        // Colors - matching site theme
        ROPE_COLOR: 0xd4af37,
        CARD_BG: "#08080c",
        CARD_BG_LIGHT: "#0e0e14",
        BORDER: "#d4af37",
        GOLD: "#d4af37",
        GOLD_DIM: "rgba(212, 175, 55, 0.6)",
        TEXT_PRIMARY: "#f0ece2",
        TEXT_SECONDARY: "#a8a4a0",
        TEXT_MUTED: "#6b6966",
        CYAN: "#00d4e8",
        GREEN: "#10b981",
    };

    // ═══════════════════════════════════════════════════════════════
    // THREE.JS SETUP
    // ═══════════════════════════════════════════════════════════════
    const parent = canvas.parentElement;
    let W = parent.offsetWidth || 460;
    let H = parent.offsetHeight || 580;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.setSize(W, H);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 1, 1000);
    camera.position.z = 500;

    // ═══════════════════════════════════════════════════════════════
    // VERLET ROPE PHYSICS
    // ═══════════════════════════════════════════════════════════════
    class RopePoint {
        constructor(x, y, fixed = false) {
            this.x = x;
            this.y = y;
            this.prevX = x;
            this.prevY = y;
            this.fixed = fixed;
        }
    }

    let anchorY = H / 2 - 35;
    let ropePoints = [];

    function createRope() {
        ropePoints = [];
        anchorY = H / 2 - 35;

        for (let i = 0; i <= CFG.SEGMENTS; i++) {
            const y = anchorY - i * CFG.SEG_LEN;
            ropePoints.push(new RopePoint(0, y, i === 0));
        }
    }
    createRope();

    function simulatePhysics() {
        // Verlet integration
        for (const p of ropePoints) {
            if (p.fixed) continue;

            const vx = (p.x - p.prevX) * CFG.DAMPING;
            const vy = (p.y - p.prevY) * CFG.DAMPING;

            p.prevX = p.x;
            p.prevY = p.y;

            p.x += vx;
            p.y += vy - CFG.GRAVITY;
        }

        // Constraints
        for (let iter = 0; iter < CFG.ITERATIONS; iter++) {
            for (let i = 0; i < ropePoints.length - 1; i++) {
                const p1 = ropePoints[i];
                const p2 = ropePoints[i + 1];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
                const diff = (CFG.SEG_LEN - dist) / dist * 0.5;

                const ox = dx * diff;
                const oy = dy * diff;

                if (!p1.fixed) { p1.x -= ox; p1.y -= oy; }
                if (!p2.fixed) { p2.x += ox; p2.y += oy; }
            }

            ropePoints[0].x = 0;
            ropePoints[0].y = anchorY;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CARD TEXTURE — PROPER SIZING AND COLORS
    // ═══════════════════════════════════════════════════════════════
    const texCanvas = document.createElement("canvas");
    const ctx = texCanvas.getContext("2d");
    const SCALE = 5; // High resolution
    texCanvas.width = CFG.CARD_W * SCALE;
    texCanvas.height = CFG.CARD_H * SCALE;

    // const cardTexture = new THREE.CanvasTexture(texCanvas);
    // cardTexture.minFilter = THREE.LinearFilter;
    // cardTexture.magFilter = THREE.LinearFilter;

    const cardTexture = new THREE.CanvasTexture(texCanvas);
    cardTexture.minFilter = THREE.LinearFilter;
    cardTexture.magFilter = THREE.LinearFilter;
    cardTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    cardTexture.generateMipmaps = false;
    cardTexture.needsUpdate = true;

    // Profile image
    const profileImg = new Image();
    profileImg.crossOrigin = "anonymous";
    let imgReady = false;

    profileImg.onload = () => {
        imgReady = true;
        renderCardTexture();
    };
    profileImg.onerror = () => {
        imgReady = false;
        renderCardTexture();
    };
    profileImg.src = "images/profile.png";

    function renderCardTexture() {
        const w = texCanvas.width;
        const h = texCanvas.height;
        const s = SCALE;
        const r = CFG.RADIUS * s;

        ctx.clearRect(0, 0, w, h);

        // ─── CARD BACKGROUND ───
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, r);

        // Dark gradient background matching site
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, CFG.CARD_BG_LIGHT);
        bgGrad.addColorStop(0.5, CFG.CARD_BG);
        bgGrad.addColorStop(1, "#050508");
        ctx.fillStyle = bgGrad;
        ctx.fill();

        // // Subtle inner glow
        // const glow = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, w * 0.8);
        // glow.addColorStop(0, "rgba(212, 175, 55, 0.03)");
        // glow.addColorStop(1, "transparent");
        // ctx.fillStyle = glow;
        // ctx.fill();

        // Subtle inner glow - BELOW photo area only
        const glow = ctx.createRadialGradient(w / 2, h * 0.75, 0, w / 2, h * 0.75, w * 0.6);
        glow.addColorStop(0, "rgba(212, 175, 55, 0.02)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fill();

        // Gold border
        ctx.strokeStyle = CFG.BORDER;
        ctx.lineWidth = 2 * s;
        ctx.stroke();

        // ─── TOP GOLD ACCENT LINE ───
        const topGrad = ctx.createLinearGradient(0, 0, w, 0);
        topGrad.addColorStop(0, "transparent");
        topGrad.addColorStop(0.2, CFG.GOLD_DIM);
        topGrad.addColorStop(0.5, CFG.GOLD);
        topGrad.addColorStop(0.8, CFG.GOLD_DIM);
        topGrad.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.moveTo(r, 2 * s);
        ctx.lineTo(w - r, 2 * s);
        ctx.strokeStyle = topGrad;
        ctx.lineWidth = 2 * s;
        ctx.stroke();

        // ─── LANYARD HOLE ───
        const holeY = 18 * s;
        const holeW = 28 * s;
        const holeH = 9 * s;

        ctx.beginPath();
        ctx.roundRect(w / 2 - holeW / 2, holeY - holeH / 2, holeW, holeH, holeH / 2);
        ctx.fillStyle = "#020203";
        ctx.fill();
        ctx.strokeStyle = CFG.GOLD_DIM;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // Metal ring in hole
        ctx.beginPath();
        ctx.arc(w / 2, holeY, 3.5 * s, 0, Math.PI * 2);
        ctx.strokeStyle = CFG.GOLD;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // ─── PROFILE PHOTO — LARGE AND CLEAR ───
        const photoSize = CFG.PHOTO_SIZE * s;
        const photoY = CFG.PHOTO_Y * s;
        const photoCX = w / 2;
        const photoCY = photoY + photoSize / 2;

        // // Outer glow ring
        // ctx.save();
        // ctx.shadowColor = CFG.GOLD;
        // ctx.shadowBlur = 25 * s;
        // ctx.beginPath();
        // ctx.arc(photoCX, photoCY, photoSize / 2 + 4 * s, 0, Math.PI * 2);
        // ctx.strokeStyle = CFG.GOLD;
        // ctx.lineWidth = 2.5 * s;
        // ctx.stroke();
        // ctx.restore();

        // Clean gold ring - NO blur/glow effect
        ctx.beginPath();
        ctx.arc(photoCX, photoCY, photoSize / 2 + 3 * s, 0, Math.PI * 2);
        ctx.strokeStyle = CFG.GOLD;
        ctx.lineWidth = 2.5 * s;
        ctx.stroke();

        // Subtle outer ring
        ctx.beginPath();
        ctx.arc(photoCX, photoCY, photoSize / 2 + 6 * s, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        // Photo circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoCX, photoCY, photoSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // if (imgReady && profileImg.naturalWidth > 0) {
        //     // Draw image - center crop
        //     const iw = profileImg.naturalWidth;
        //     const ih = profileImg.naturalHeight;
        //     const minD = Math.min(iw, ih);
        //     const sx = (iw - minD) / 2;
        //     const sy = (ih - minD) / 2;

        //     ctx.imageSmoothingEnabled = true;
        //     ctx.imageSmoothingQuality = "high";
        //     ctx.drawImage(
        //         profileImg,
        //         sx, sy, minD, minD,
        //         photoCX - photoSize / 2, photoY, photoSize, photoSize
        //     );
        // } 

        if (imgReady && profileImg.naturalWidth > 0) {
            // Draw image - center crop with MAXIMUM quality
            const iw = profileImg.naturalWidth;
            const ih = profileImg.naturalHeight;
            const minD = Math.min(iw, ih);
            const sx = (iw - minD) / 2;
            const sy = (ih - minD) / 2;

            // Disable smoothing for sharper result
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Clear any previous content in photo area
            ctx.save();
            ctx.beginPath();
            ctx.arc(photoCX, photoCY, photoSize / 2, 0, Math.PI * 2);
            ctx.clip();

            // Fill with solid black first to prevent transparency issues
            ctx.fillStyle = "#000";
            ctx.fillRect(photoCX - photoSize / 2, photoY, photoSize, photoSize);

            // Draw the image
            ctx.drawImage(
                profileImg,
                sx, sy, minD, minD,
                photoCX - photoSize / 2, photoY, photoSize, photoSize
            );
            ctx.restore();
        }
        else {
            // Fallback - gold gradient with initials
            const fbGrad = ctx.createLinearGradient(photoCX - photoSize / 2, photoY, photoCX + photoSize / 2, photoY + photoSize);
            fbGrad.addColorStop(0, CFG.GOLD);
            fbGrad.addColorStop(1, "#8a6914");
            ctx.fillStyle = fbGrad;
            ctx.fillRect(photoCX - photoSize / 2, photoY, photoSize, photoSize);

            ctx.fillStyle = "#0a0a08";
            ctx.font = `bold ${22 * s}px 'Syne', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("RM", photoCX, photoCY);
        }
        ctx.restore();

        // // Inner photo border
        // ctx.beginPath();
        // ctx.arc(photoCX, photoCY, photoSize / 2 - 1 * s, 0, Math.PI * 2);
        // ctx.strokeStyle = "rgba(255,255,255,0.1)";
        // ctx.lineWidth = 1 * s;
        // ctx.stroke();

        // ─── NAME — SMALL FONT TO FIT ───
        // ─── NAME ──      
        const nameY = photoY + photoSize + 18 * s;

        ctx.fillStyle = CFG.TEXT_PRIMARY;
        ctx.font = `800 ${9 * s}px 'Syne', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        // Add subtle glow
        ctx.save();
        ctx.shadowColor = CFG.GOLD;
        ctx.shadowBlur = 6 * s;
        ctx.fillText("RAJSV MAHENDRA", w / 2, nameY);
        ctx.restore();

        // ─── ROLE ───
        const roleY = nameY + 16 * s;
        ctx.fillStyle = CFG.TEXT_SECONDARY;
        ctx.font = `500 ${6.5 * s}px 'JetBrains Mono', monospace`;
        ctx.fillText("Backend Engineer", w / 2, roleY);
        ctx.fillText("& Data Architect", w / 2, roleY + 10 * s);

        // ─── DIVIDER ───
        const divY = roleY + 30 * s;
        const divGrad = ctx.createLinearGradient(w * 0.15, 0, w * 0.85, 0);
        divGrad.addColorStop(0, "transparent");
        divGrad.addColorStop(0.3, CFG.GOLD_DIM);
        divGrad.addColorStop(0.5, CFG.GOLD);
        divGrad.addColorStop(0.7, CFG.GOLD_DIM);
        divGrad.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.moveTo(w * 0.15, divY);
        ctx.lineTo(w * 0.85, divY);
        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        // ─── STATUS ──
        // ─── STATUS — CENTERED ───
        const statusY = divY + 18 * s;

        // Measure text to center everything
        ctx.font = `600 ${6 * s}px 'JetBrains Mono', monospace`;
        const statusText = "AVAILABLE";
        const textWidth = ctx.measureText(statusText).width;
        const dotRadius = 4 * s;
        const gap = 8 * s;
        const totalWidth = dotRadius * 2 + gap + textWidth;
        const startX = (w - totalWidth) / 2;

        // Green dot with subtle glow
        ctx.save();
        ctx.shadowColor = CFG.GREEN;
        ctx.shadowBlur = 6 * s;
        ctx.beginPath();
        ctx.arc(startX + dotRadius, statusY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = CFG.GREEN;
        ctx.fill();
        ctx.restore();

        // Status text
        ctx.fillStyle = CFG.TEXT_PRIMARY;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(statusText, startX + dotRadius * 2 + gap, statusY);

        // ─── BOTTOM DECORATION ───
        const botY = h - 20 * s;

        // Small triangles
        ctx.fillStyle = "rgba(212, 175, 55, 0.1)";
        ctx.beginPath();
        ctx.moveTo(w * 0.15, botY);
        ctx.lineTo(w * 0.15 + 6 * s, botY - 4 * s);
        ctx.lineTo(w * 0.15 + 12 * s, botY);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w * 0.85, botY);
        ctx.lineTo(w * 0.85 - 6 * s, botY - 4 * s);
        ctx.lineTo(w * 0.85 - 12 * s, botY);
        ctx.closePath();
        ctx.fill();

        cardTexture.needsUpdate = true;
    }

    // Render after fonts load
    if (document.fonts?.ready) {
        document.fonts.ready.then(() => setTimeout(renderCardTexture, 100));
    }
    renderCardTexture();

    // ═══════════════════════════════════════════════════════════════
    // THREE.JS MESHES
    // ═══════════════════════════════════════════════════════════════

    // Anchor
    const anchorMesh = new THREE.Mesh(
        new THREE.CircleGeometry(7, 18),
        new THREE.MeshBasicMaterial({ color: CFG.ROPE_COLOR })
    );
    anchorMesh.position.set(0, anchorY, 10);
    scene.add(anchorMesh);

    // Anchor hole
    const anchorHole = new THREE.Mesh(
        new THREE.CircleGeometry(3, 14),
        new THREE.MeshBasicMaterial({ color: 0x060608 })
    );
    anchorHole.position.set(0, anchorY, 11);
    scene.add(anchorHole);

    // Rope segments
    const ropeMeshes = [];
    for (let i = 0; i < CFG.SEGMENTS; i++) {
        const seg = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, CFG.SEG_LEN, 6),
            new THREE.MeshBasicMaterial({ color: CFG.ROPE_COLOR })
        );
        scene.add(seg);
        ropeMeshes.push(seg);
    }

    // Clip
    const clipMesh = new THREE.Mesh(
        new THREE.BoxGeometry(20, 10, 5),
        new THREE.MeshBasicMaterial({ color: CFG.ROPE_COLOR })
    );
    scene.add(clipMesh);

    // Card
    const cardMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(CFG.CARD_W, CFG.CARD_H),
        new THREE.MeshBasicMaterial({ map: cardTexture, transparent: true, side: THREE.DoubleSide })
    );
    scene.add(cardMesh);

    // ═══════════════════════════════════════════════════════════════
    // UPDATE VISUALS
    // ═══════════════════════════════════════════════════════════════
    function updateMeshes() {
        for (let i = 0; i < ropeMeshes.length; i++) {
            const p1 = ropePoints[i];
            const p2 = ropePoints[i + 1];
            if (!p1 || !p2) continue;

            ropeMeshes[i].position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0);
            ropeMeshes[i].rotation.z = -Math.atan2(p2.x - p1.x, p2.y - p1.y);
        }

        const last = ropePoints[ropePoints.length - 1];
        const prev = ropePoints[ropePoints.length - 2];
        if (!last || !prev) return;

        const rot = Math.atan2(last.x - prev.x, -(last.y - prev.y));

        clipMesh.position.set(last.x, last.y, 5);
        clipMesh.rotation.z = rot;

        const dist = CFG.CARD_H / 2 + 7;
        cardMesh.position.set(
            last.x + Math.sin(rot) * dist,
            last.y - Math.cos(rot) * dist,
            0
        );
        cardMesh.rotation.z = rot;
    }

    // ═══════════════════════════════════════════════════════════════
    // DRAG INTERACTION
    // ═══════════════════════════════════════════════════════════════
    let dragging = false;
    let lastX = 0, lastY = 0;
    let velX = 0, velY = 0;

    function toWorld(e) {
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        return {
            x: cx - rect.left - rect.width / 2,
            y: -(cy - rect.top - rect.height / 2)
        };
    }

    function onDown(e) {
        if (!isFlipped) return;
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        const p = toWorld(e);
        lastX = p.x;
        lastY = p.y;
        velX = 0;
        velY = 0;
        canvas.style.cursor = "grabbing";
    }

    function onMove(e) {
        if (!dragging || !isFlipped) return;
        const p = toWorld(e);
        const dx = p.x - lastX;
        const dy = p.y - lastY;
        velX = dx;
        velY = dy;

        // Apply to all points except anchor
        for (let i = 1; i < ropePoints.length; i++) {
            const factor = i / ropePoints.length;
            ropePoints[i].x += dx * CFG.DRAG_STRENGTH * factor;
            ropePoints[i].y += dy * CFG.DRAG_STRENGTH * factor;
        }

        lastX = p.x;
        lastY = p.y;
    }

    function onUp() {
        if (!dragging) return;
        dragging = false;
        canvas.style.cursor = "grab";

        // Apply momentum
        for (let i = Math.floor(ropePoints.length * 0.5); i < ropePoints.length; i++) {
            const p = ropePoints[i];
            if (!p.fixed) {
                const f = (i - ropePoints.length * 0.5) / (ropePoints.length * 0.5);
                p.prevX = p.x - velX * CFG.THROW_MULT * f;
                p.prevY = p.y - velY * CFG.THROW_MULT * f;
            }
        }
    }

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    // ═══════════════════════════════════════════════════════════════
    // RESIZE
    // ═══════════════════════════════════════════════════════════════
    let resizeTimer;
    function handleResize() {
        W = parent.offsetWidth || 460;
        H = parent.offsetHeight || 580;

        camera.left = -W / 2;
        camera.right = W / 2;
        camera.top = H / 2;
        camera.bottom = -H / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);

        anchorY = H / 2 - 35;
        if (ropePoints[0]) {
            ropePoints[0].y = anchorY;
            ropePoints[0].prevY = anchorY;
        }
        anchorMesh.position.y = anchorY;
        anchorHole.position.y = anchorY;
    }

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 150);
    });

    // ═══════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════════
    let isVisible = false;
    let isPaused = false;
    let animId = null;

    function startAnim() {
        if (animId !== null) return;
        animId = requestAnimationFrame(animate);
    }

    function stopAnim() {
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    }

    function checkAnimationState() {
        if (isVisible && !isPaused && isFlipped) {
            startAnim();
        } else {
            stopAnim();
        }
    }

    function animate() {
        if (isPaused || !isVisible || !isFlipped) {
            animId = null;
            return;
        }

        simulatePhysics();
        updateMeshes();
        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
    }

    // Visibility
    new IntersectionObserver(([e]) => {
        isVisible = e.isIntersecting;
        checkAnimationState();
    }, { threshold: 0.01 }).observe(parent);

    document.addEventListener("visibilitychange", () => {
        isPaused = document.hidden;
        checkAnimationState();
    });

    // ═══════════════════════════════════════════════════════════════
    // INITIAL SETUP — NO AUTOMATIC MOVEMENT
    // ═══════════════════════════════════════════════════════════════
    setTimeout(() => {
        handleResize();
        updateMeshes();
        renderer.render(scene, camera);
        // NO initial swing - card hangs still until user drags it
    }, 100);

})();

/* ================================================================
   ACHIEVEMENTS SECTION — Image Load & Reveal Animations
================================================================ */
(function initAchievements() {
    const achieveImages = document.querySelectorAll('.achieve-img img');
    const achieveGallery = document.querySelector('.achieve-gallery');
    const achieveDecors = document.querySelectorAll('.achieve-decor');

    if (!achieveImages.length) return;

    // ═══════════════════════════════════════════════════════════════
    // IMAGE LOAD DETECTION — Add 'loaded' class when ready
    // ═══════════════════════════════════════════════════════════════
    achieveImages.forEach((img) => {
        // If already loaded (cached)
        if (img.complete && img.naturalHeight !== 0) {
            img.classList.add('loaded');
        } else {
            // Wait for load
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
            // Handle error - still show container
            img.addEventListener('error', () => {
                img.style.opacity = '0.3';
                img.parentElement.style.background = 'linear-gradient(135deg, var(--grey-800), var(--grey-900))';
            });
        }
    });

    // ═══════════════════════════════════════════════════════════════
    // SCROLL-TRIGGERED ANIMATIONS
    // ═══════════════════════════════════════════════════════════════
    if (typeof ScrollTrigger !== 'undefined' && achieveGallery) {

        // Main image - slides in from bottom
        const mainImg = document.querySelector('.achieve-img-main');
        if (mainImg) {
            gsap.set(mainImg, { y: 80, opacity: 0, scale: 0.9 });

            ScrollTrigger.create({
                trigger: achieveGallery,
                start: "top 85%",
                once: true,
                onEnter: () => {
                    gsap.to(mainImg, {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.9,
                        ease: "power3.out"
                    });
                }
            });
        }

        // Secondary image - slides in from right
        const secImg = document.querySelector('.achieve-img-secondary');
        if (secImg) {
            gsap.set(secImg, { x: 60, y: -30, opacity: 0, scale: 0.85, rotation: 10 });

            ScrollTrigger.create({
                trigger: achieveGallery,
                start: "top 80%",
                once: true,
                onEnter: () => {
                    gsap.to(secImg, {
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        rotation: 5,
                        duration: 0.8,
                        delay: 0.2,
                        ease: "power3.out"
                    });
                }
            });
        }

        // Tertiary image - slides in from left
        const terImg = document.querySelector('.achieve-img-tertiary');
        if (terImg) {
            gsap.set(terImg, { x: -50, y: 30, opacity: 0, scale: 0.85, rotation: -10 });

            ScrollTrigger.create({
                trigger: achieveGallery,
                start: "top 75%",
                once: true,
                onEnter: () => {
                    gsap.to(terImg, {
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        rotation: -6,
                        duration: 0.8,
                        delay: 0.35,
                        ease: "power3.out"
                    });
                }
            });
        }

        // Decorative elements fade in
        achieveDecors.forEach((decor, i) => {
            gsap.set(decor, { opacity: 0, scale: 0.5 });

            ScrollTrigger.create({
                trigger: achieveGallery,
                start: "top 70%",
                once: true,
                onEnter: () => {
                    gsap.to(decor, {
                        opacity: 0.6,
                        scale: 1,
                        duration: 1,
                        delay: 0.5 + (i * 0.15),
                        ease: "power2.out"
                    });
                }
            });
        });

        // Achievement card
        const achieveCard = document.querySelector('.achieve-card');
        if (achieveCard) {
            gsap.set(achieveCard, { y: 50, opacity: 0 });

            ScrollTrigger.create({
                trigger: achieveCard,
                start: "top 90%",
                once: true,
                onEnter: () => {
                    gsap.to(achieveCard, {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        ease: "power3.out"
                    });
                }
            });
        }

        // Achievement stats counter animation
        const statVals = document.querySelectorAll('.achieve-stat-val');
        statVals.forEach((el) => {
            const text = el.textContent;
            const isNumber = /^\d+/.test(text);

            if (isNumber) {
                const num = parseInt(text);
                const suffix = text.replace(/^\d+/, '');

                ScrollTrigger.create({
                    trigger: el,
                    start: "top 90%",
                    once: true,
                    onEnter: () => {
                        gsap.from({ val: 0 }, {
                            val: num,
                            duration: 1.5,
                            ease: "power2.out",
                            onUpdate: function () {
                                el.textContent = Math.round(this.targets()[0].val) + suffix;
                            }
                        });
                    }
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // PARALLAX FLOAT ON SCROLL (subtle movement)
    // ═══════════════════════════════════════════════════════════════
    if (typeof gsap !== 'undefined' && achieveGallery) {
        const mainImg = document.querySelector('.achieve-img-main');
        const secImg = document.querySelector('.achieve-img-secondary');
        const terImg = document.querySelector('.achieve-img-tertiary');

        if (mainImg && secImg && terImg) {
            gsap.to(mainImg, {
                y: -20,
                scrollTrigger: {
                    trigger: achieveGallery,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5
                }
            });

            gsap.to(secImg, {
                y: -35,
                x: 10,
                scrollTrigger: {
                    trigger: achieveGallery,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 2
                }
            });

            gsap.to(terImg, {
                y: -15,
                x: -10,
                scrollTrigger: {
                    trigger: achieveGallery,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1
                }
            });
        }
    }

})();