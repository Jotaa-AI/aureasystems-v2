/* ============================================
   AUREA SYSTEMS — Patient Flow Interactions
   Premium Apple-style Motion System
   ============================================ */

(function () {
  'use strict';

  // --- NAVBAR SCROLL BEHAVIOR ---
  const navbar = document.querySelector('.navbar');
  let lastScroll = 0;

  function handleNavbarScroll() {
    const currentScroll = window.scrollY;
    if (currentScroll > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  // --- SCROLL REVEAL with Intersection Observer ---
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    const staggerElements = document.querySelectorAll('.reveal-stagger');
    const heroElements = document.querySelectorAll('.hero-reveal');

    const revealObserverOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, revealObserverOptions);

    revealElements.forEach((el) => revealObserver.observe(el));
    staggerElements.forEach((el) => revealObserver.observe(el));

    // Hero elements — trigger immediately after page load with stagger
    setTimeout(() => {
      heroElements.forEach((el) => {
        el.classList.add('visible');
      });
    }, 200);
  }

  // --- SMOOTH PARALLAX ---
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    if (!parallaxElements.length) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      parallaxElements.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const rect = el.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;
        const distance = elementCenter - viewportCenter;
        const offset = distance * speed * -1;

        el.style.transform = `translateY(${offset}px)`;
      });

      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  // --- COUNTER ANIMATION ---
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));

    function animateCounter(el) {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1500;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quart
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(eased * target);

        el.textContent = prefix + current + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = prefix + target + suffix;
        }
      }

      requestAnimationFrame(update);
    }
  }

  // --- TESTIMONIALS MARQUEE (auto-scroll) ---
  function initTestimonialsScroll() {
    const track = document.querySelector('.testimonials__track');
    if (!track) return;

    // Clone cards for infinite scroll
    const cards = track.querySelectorAll('.testimonial-card');
    cards.forEach((card) => {
      const clone = card.cloneNode(true);
      track.appendChild(clone);
    });

    let scrollAmount = 0;
    let isHovering = false;
    const speed = 0.5;

    function scroll() {
      if (!isHovering) {
        scrollAmount += speed;
        const halfWidth = track.scrollWidth / 2;
        if (scrollAmount >= halfWidth) {
          scrollAmount = 0;
        }
        track.style.transform = `translateX(-${scrollAmount}px)`;
      }
      requestAnimationFrame(scroll);
    }

    track.addEventListener('mouseenter', () => { isHovering = true; });
    track.addEventListener('mouseleave', () => { isHovering = false; });

    requestAnimationFrame(scroll);
  }

  // --- SMOOTH ANCHOR LINKS ---
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const offset = 80; // Navbar height
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      });
    });
  }

  // --- MAGNETIC BUTTON EFFECT --- (subtle, premium)
  function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn--primary, .btn--accent');

    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.03)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // --- INIT EVERYTHING ---
  function init() {
    initScrollReveal();
    initParallax();
    initCounters();
    initTestimonialsScroll();
    initSmoothAnchors();
    initMagneticButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
