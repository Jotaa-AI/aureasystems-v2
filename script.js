/* ============================================
   AUREA SYSTEMS — Patient Flow Interactions
   Premium Apple-style Motion System
   ============================================ */

(function () {
  'use strict';

  // --- PAGE LOADER ---
  function initPageLoader() {
    const loader = document.getElementById('page-loader');
    const fill = document.getElementById('page-loader-fill');
    const status = document.getElementById('page-loader-status');
    const value = document.getElementById('page-loader-value');
    if (!loader) return;

    let hidden = false;
    const totalDuration = 2600;
    const start = performance.now();
    let frame = 0;

    function animateProgress(now) {
      if (!fill || !status || !value || hidden) return;

      const progress = Math.min((now - start) / totalDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 2.4);
      const percentage = progress >= 1 ? 100 : Math.min(97, Math.round(eased * 100));

      fill.style.width = `${percentage}%`;
      value.textContent = `${percentage}%`;

      if (percentage < 35) {
        status.textContent = 'Cargando Aurea Systems';
      } else if (percentage < 75) {
        status.textContent = 'Preparando Patient Flow';
      } else if (percentage < 100) {
        status.textContent = 'Abriendo la experiencia';
      } else {
        status.textContent = 'Listo';
      }

      if (progress < 1) {
        frame = window.requestAnimationFrame(animateProgress);
      }
    }

    function hideLoader() {
      if (hidden) return;
      hidden = true;
      window.cancelAnimationFrame(frame);

      if (fill) fill.style.width = '100%';
      if (value) value.textContent = '100%';
      if (status) status.textContent = 'Listo';

      document.body.classList.remove('is-loading');
      loader.classList.add('is-hidden');

      window.setTimeout(() => {
        loader.remove();
      }, 650);
    }

    frame = window.requestAnimationFrame(animateProgress);
    window.addEventListener('load', hideLoader, { once: true });
    window.setTimeout(hideLoader, 2600);
  }

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
        if (anchor.hasAttribute('data-booking-trigger')) return;
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

  // --- BOOKING MODAL ---
  function initBookingModal() {
    const modal = document.getElementById('booking-modal');
    const placeholder = document.getElementById('booking-modal-placeholder');
    const bookingFrame = document.getElementById('Pmlo90k5oI5mm21x9Vqb_1775980045908');
    const triggers = document.querySelectorAll('[data-booking-trigger]');
    const closeTargets = document.querySelectorAll('[data-booking-close]');

    if (!modal || !bookingFrame || !triggers.length) return;

    let frameLoaded = false;

    function hidePlaceholder() {
      if (frameLoaded) return;
      frameLoaded = true;
      if (placeholder) {
        placeholder.classList.add('is-hidden');
        window.setTimeout(() => {
          placeholder.remove();
        }, 240);
      }
    }

    function openModal() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openModal();
      });
    });

    closeTargets.forEach((target) => {
      target.addEventListener('click', closeModal);
    });

    bookingFrame.addEventListener('load', hidePlaceholder, { once: true });
    window.setTimeout(hidePlaceholder, 1600);

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  // --- PHASES ACCORDION ---
  function initPhasesAccordion() {
    const items = Array.from(document.querySelectorAll('.phase-accordion-item'));
    if (!items.length) return;

    items.forEach((item) => {
      const trigger = item.querySelector('.phase-accordion-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        items.forEach((otherItem) => {
          otherItem.classList.remove('is-open');
          const otherTrigger = otherItem.querySelector('.phase-accordion-trigger');
          if (otherTrigger) {
            otherTrigger.setAttribute('aria-expanded', 'false');
          }
        });

        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
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

  // --- HERO SIMULATOR ---
  function initHeroSimulator() {
    const root = document.getElementById('hero-sim');
    if (!root) return;

    const MIN_MONTHLY_INVESTMENT = 800;
    const MAX_MONTHLY_INVESTMENT = 5000;
    const MIN_CLOSE_RATE = 5;
    const MAX_CLOSE_RATE = 100;
    const MIN_AVERAGE_TICKET = 80;
    const MAX_AVERAGE_TICKET = 15000;

    const webhookUrl =
      window.AUREA_SIMULATION_WEBHOOK ||
      'https://personal-n8n.brtnrr.easypanel.host/webhook/aureasystems-roi-calculator';

    const gatePanel = document.getElementById('hero-sim-gate');
    const calculatorPanel = document.getElementById('hero-sim-calculator');
    const unlockForm = document.getElementById('hero-sim-unlock-form');
    const emailInput = document.getElementById('hero-sim-email');
    const gateFeedback = document.getElementById('hero-sim-gate-feedback');
    const detailFeedback = document.getElementById('hero-sim-detail-feedback');
    const detailButton = document.getElementById('hero-sim-detail-btn');
    const emailBadge = document.getElementById('hero-sim-email-badge');

    const scenarioButtons = Array.from(document.querySelectorAll('.hero-sim__scenario'));
    const investmentInput = document.getElementById('hero-sim-investment');
    const closeRateInput = document.getElementById('hero-sim-close-rate');
    const ticketInput = document.getElementById('hero-sim-ticket');

    const investmentValue = document.getElementById('hero-sim-investment-value');
    const closeRateValue = document.getElementById('hero-sim-close-rate-value');
    const ticketValue = document.getElementById('hero-sim-ticket-value');

    const summaryLabel = document.getElementById('hero-sim-summary-label');
    const summaryValue = document.getElementById('hero-sim-summary-value');
    const summaryCopy = document.getElementById('hero-sim-summary-copy');

    const resultContacts = document.getElementById('hero-sim-result-contacts');
    const resultQualified = document.getElementById('hero-sim-result-qualified');
    const resultRevenue = document.getElementById('hero-sim-result-revenue');
    const resultRecovery = document.getElementById('hero-sim-result-recovery');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const currencyFormatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });

    const countFormatter = new Intl.NumberFormat('es-ES');

    const scenarios = {
      conservative: {
        key: 'conservative',
        label: 'Conservador',
        shortLabel: 'Prudente',
        eyebrow: 'Más prudente',
        description: 'Lectura prudente con más margen.',
        cpl: 30,
        qualificationRate: 0.5,
        averageRecoveryWindowDays: 45,
      },
      expected: {
        key: 'expected',
        label: 'Esperado',
        shortLabel: 'Referencia',
        eyebrow: 'Escenario base',
        description: 'La referencia más realista.',
        cpl: 22,
        qualificationRate: 0.6,
        averageRecoveryWindowDays: 30,
      },
      optimistic: {
        key: 'optimistic',
        label: 'Optimista',
        shortLabel: 'Acelerado',
        eyebrow: 'Mayor eficiencia',
        description: 'Escenario ágil con mejor eficiencia.',
        cpl: 15,
        qualificationRate: 0.7,
        averageRecoveryWindowDays: 21,
      },
    };

    const scenarioOrder = ['conservative', 'expected', 'optimistic'];

    const state = {
      email: '',
      selectedScenario: 'expected',
      inputs: {
        monthlyInvestment: 2500,
        closeRate: 25,
        averageTicket: 320,
      },
    };

    function clampNumber(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function formatCurrency(value) {
      return currencyFormatter.format(value);
    }

    function formatRecoveryWindow(value) {
      if (!value) return 'A definir';
      if (value >= 365) return 'Más de 12 meses';
      if (value >= 90) return `≈ ${Math.round(value / 30)} meses`;
      return `${value} días`;
    }

    function calculateScenarioMetrics(rawInputs, scenario) {
      const inputs = {
        monthlyInvestment: clampNumber(rawInputs.monthlyInvestment, MIN_MONTHLY_INVESTMENT, MAX_MONTHLY_INVESTMENT),
        closeRate: clampNumber(rawInputs.closeRate, MIN_CLOSE_RATE, MAX_CLOSE_RATE),
        averageTicket: clampNumber(rawInputs.averageTicket, MIN_AVERAGE_TICKET, MAX_AVERAGE_TICKET),
      };

      const closeRateFactor = inputs.closeRate / 100;
      const rawNewContacts = inputs.monthlyInvestment / scenario.cpl;
      const rawQualifiedPatients = rawNewContacts * scenario.qualificationRate;
      const rawClosedPatients = rawQualifiedPatients * closeRateFactor;
      const rawEstimatedRevenue = rawClosedPatients * inputs.averageTicket;
      const rawRecoveryDays =
        rawEstimatedRevenue > 0
          ? inputs.monthlyInvestment / (rawEstimatedRevenue / scenario.averageRecoveryWindowDays)
          : null;

      return {
        ...scenario,
        rawNewContacts,
        rawQualifiedPatients,
        rawClosedPatients,
        rawEstimatedRevenue,
        rawRecoveryDays,
        newContacts: Math.max(0, Math.round(rawNewContacts)),
        qualifiedPatients: Math.max(0, Math.round(rawQualifiedPatients)),
        closedPatients: Math.max(0, Math.round(rawClosedPatients)),
        estimatedRevenue: Math.max(0, Math.round(rawEstimatedRevenue / 10) * 10),
        recoveryDays:
          rawRecoveryDays && Number.isFinite(rawRecoveryDays) ? Math.max(1, Math.ceil(rawRecoveryDays)) : null,
      };
    }

    function calculateScenarioResults(inputs) {
      return scenarioOrder.reduce((acc, key) => {
        acc[key] = calculateScenarioMetrics(inputs, scenarios[key]);
        return acc;
      }, {});
    }

    function serializeScenario(scenario) {
      return {
        key: scenario.key,
        label: scenario.label,
        shortLabel: scenario.shortLabel,
        eyebrow: scenario.eyebrow,
        description: scenario.description,
        assumptions: {
          cpl: scenario.cpl,
          qualificationRate: scenario.qualificationRate,
          averageRecoveryWindowDays: scenario.averageRecoveryWindowDays,
        },
        visibleMetrics: {
          newContacts: scenario.newContacts,
          qualifiedPatients: scenario.qualifiedPatients,
          closedPatients: scenario.closedPatients,
          estimatedRevenue: scenario.estimatedRevenue,
          recoveryDays: scenario.recoveryDays,
        },
        rawMetrics: {
          newContacts: scenario.rawNewContacts,
          qualifiedPatients: scenario.rawQualifiedPatients,
          closedPatients: scenario.rawClosedPatients,
          estimatedRevenue: scenario.rawEstimatedRevenue,
          recoveryDays: scenario.rawRecoveryDays,
        },
      };
    }

    function buildPayload(eventType) {
      const scenariosResult = calculateScenarioResults(state.inputs);
      const selectedScenario = scenariosResult[state.selectedScenario];
      const meta = {
        submittedAt: new Date().toISOString(),
        pageUrl: window.location.href,
        source: 'aurea-systems-patient-flow-simulator',
        eventType,
      };

      const requestBody = {
        eventType,
        email: state.email,
        source: meta.source,
        submittedAt: meta.submittedAt,
        pageUrl: meta.pageUrl,
        lead: {
          email: state.email,
          monthlyInvestment: state.inputs.monthlyInvestment,
          closeRate: state.inputs.closeRate,
          averageTicket: state.inputs.averageTicket,
          selectedScenario: state.selectedScenario,
          selectedScenarioLabel: selectedScenario.label,
        },
        inputs: { ...state.inputs },
        selectedScenario: serializeScenario(selectedScenario),
        summary: {
          newContacts: selectedScenario.newContacts,
          qualifiedPatients: selectedScenario.qualifiedPatients,
          closedPatients: selectedScenario.closedPatients,
          estimatedRevenue: selectedScenario.estimatedRevenue,
          recoveryDays: selectedScenario.recoveryDays,
        },
        scenarios: {
          conservative: serializeScenario(scenariosResult.conservative),
          expected: serializeScenario(scenariosResult.expected),
          optimistic: serializeScenario(scenariosResult.optimistic),
        },
        meta,
      };

      requestBody.originalPayload = {
        email: requestBody.email,
        selectedScenario: state.selectedScenario,
        inputs: { ...state.inputs },
        scenarios: requestBody.scenarios,
        meta,
      };

      return requestBody;
    }

    async function postPayload(eventType) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(eventType)),
      });

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error((data && data.message) || 'No hemos podido procesar tu solicitud.');
      }

      return data;
    }

    function setFeedback(target, message, isError) {
      if (!target) return;
      target.textContent = message || '';
      target.classList.toggle('is-error', Boolean(isError));
    }

    function renderScenarioButtons() {
      scenarioButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.scenario === state.selectedScenario);
      });
    }

    function renderCalculator() {
      const results = calculateScenarioResults(state.inputs);
      const activeScenario = results[state.selectedScenario];

      if (investmentValue) investmentValue.textContent = formatCurrency(state.inputs.monthlyInvestment);
      if (closeRateValue) closeRateValue.textContent = `${state.inputs.closeRate}%`;
      if (ticketValue) ticketValue.textContent = formatCurrency(state.inputs.averageTicket);

      if (summaryLabel) summaryLabel.textContent = `${activeScenario.label} · ${activeScenario.eyebrow}`;
      if (summaryValue) summaryValue.textContent = formatCurrency(activeScenario.estimatedRevenue);
      if (summaryCopy) {
        summaryCopy.textContent = `${activeScenario.qualifiedPatients} pacientes cualificados estimados y ${formatRecoveryWindow(activeScenario.recoveryDays)} para recuperar la inversión.`;
      }

      if (resultContacts) resultContacts.textContent = countFormatter.format(activeScenario.newContacts);
      if (resultQualified) resultQualified.textContent = countFormatter.format(activeScenario.qualifiedPatients);
      if (resultRevenue) resultRevenue.textContent = formatCurrency(activeScenario.estimatedRevenue);
      if (resultRecovery) resultRecovery.textContent = formatRecoveryWindow(activeScenario.recoveryDays);

      renderScenarioButtons();
    }

    function unlockCalculator() {
      root.dataset.state = 'unlocked';
      if (gatePanel) gatePanel.hidden = true;
      if (calculatorPanel) calculatorPanel.hidden = false;
      if (emailBadge) emailBadge.textContent = state.email;
      renderCalculator();
    }

    unlockForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim().toLowerCase();
      if (!emailPattern.test(email)) {
        setFeedback(gateFeedback, 'Introduce un correo válido para desbloquear la simulación.', true);
        return;
      }

      setFeedback(gateFeedback, 'Desbloqueando simulación...', false);
      state.email = email;

      const button = unlockForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;

      try {
        await postPayload('hero_calculator_unlock');
        setFeedback(gateFeedback, '', false);
        unlockCalculator();
      } catch (error) {
        setFeedback(
          gateFeedback,
          error instanceof Error ? error.message : 'No hemos podido desbloquear la simulación.',
          true
        );
      } finally {
        if (button) button.disabled = false;
      }
    });

    scenarioButtons.forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedScenario = button.dataset.scenario || 'expected';
        renderCalculator();
      });
    });

    investmentInput.addEventListener('input', () => {
      state.inputs.monthlyInvestment = clampNumber(
        Number(investmentInput.value),
        MIN_MONTHLY_INVESTMENT,
        MAX_MONTHLY_INVESTMENT
      );
      renderCalculator();
    });

    closeRateInput.addEventListener('input', () => {
      state.inputs.closeRate = clampNumber(Number(closeRateInput.value), MIN_CLOSE_RATE, MAX_CLOSE_RATE);
      renderCalculator();
    });

    ticketInput.addEventListener('input', () => {
      if (!ticketInput.value.trim()) {
        return;
      }

      const nextValue = Number(ticketInput.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }

      state.inputs.averageTicket = clampNumber(nextValue, MIN_AVERAGE_TICKET, MAX_AVERAGE_TICKET);
      renderCalculator();
    });

    ticketInput.addEventListener('blur', () => {
      if (!ticketInput.value.trim()) {
        ticketInput.value = state.inputs.averageTicket;
        return;
      }

      const nextValue = Number(ticketInput.value);
      state.inputs.averageTicket = clampNumber(
        Number.isFinite(nextValue) ? nextValue : state.inputs.averageTicket,
        MIN_AVERAGE_TICKET,
        MAX_AVERAGE_TICKET
      );
      ticketInput.value = state.inputs.averageTicket;
      renderCalculator();
    });

    detailButton.addEventListener('click', async () => {
      setFeedback(detailFeedback, 'Enviando análisis detallado...', false);
      detailButton.disabled = true;

      try {
        await postPayload('hero_calculator_detail');
        setFeedback(detailFeedback, 'Te enviaremos una lectura más detallada con tu simulación actual.', false);
      } catch (error) {
        setFeedback(
          detailFeedback,
          error instanceof Error ? error.message : 'No hemos podido enviar el análisis detallado.',
          true
        );
      } finally {
        detailButton.disabled = false;
      }
    });

    renderCalculator();
  }

  // --- AI CONVERSATION ---
  function initAIConversation() {
    const chat = document.getElementById('ai-chat');
    const messagesContainer = document.getElementById('ai-chat-messages');
    const typingIndicator = document.getElementById('ai-chat-typing');

    if (!chat || !messagesContainer || !typingIndicator) return;

    const conversationFlow = [
      {
        from: 'agent',
        label: 'Ana · IA',
        text: 'Hola Marta👋\nSoy Ana de Aurea Clínics en Barcelona',
      },
      {
        from: 'agent',
        label: 'Ana · IA',
        text: 'He visto que te has interesado por nuestros tratamientos.\n¿Es para algo concreto que te gustaría mejorar o todavía estás explorando opciones? 😊',
      },
      {
        from: 'patient',
        label: 'Marta',
        text: 'Hola Ana',
      },
      {
        from: 'patient',
        label: 'Marta',
        text: 'Si, justo estoy mirando porque me preocupa bastante la flacidez que me noto en la zona de la papada y pomulos per no tengo claro qué me iría bien',
      },
      {
        from: 'agent',
        label: 'Ana · IA',
        text: 'Te entiendo. Gracias por explicármelo así.\nPor lo que me cuentas, lo mejor es que el doctor te vea porque esa zona suele valorarse en conjunto para mantener un resultado natural.\n¿Tu idea sería mejorar sin que se note algo exagerado?',
      },
      {
        from: 'patient',
        label: 'Marta',
        text: 'Sí, justo eso. Quiero verme mejor pero que se vea natural.',
      },
      {
        from: 'agent',
        label: 'Ana · IA',
        text: 'Perfecto. ¿Te has hecho antes algún tratamiento en papada, pómulos o tercio inferior del rostro, o sería tu primera valoración de este tipo?',
      },
      {
        from: 'patient',
        label: 'Marta',
        text: 'No, sería la primera vez.',
      },
      {
        from: 'agent',
        label: 'Ana · IA',
        text: 'Genial, así el doctor puede valorar bien desde cero y explicarte qué opción encaja contigo.\n¿Te viene mejor venir entre semana por la tarde o prefieres mediodía?',
      },
      {
        from: 'patient',
        label: 'Marta',
        text: 'Por la tarde mejor. A partir de las 17:30 suelo poder.',
      },
      {
        from: 'agent',
        label: 'Ana · IA',
        text: 'Perfecto. Te puedo ofrecer una primera valoración este jueves a las 18:00 o el lunes a las 17:45 en Aurea Clínics Barcelona.\n¿Cuál te encaja mejor?',
      },
      {
        from: 'patient',
        label: 'Marta',
        text: 'El jueves a las 18:00 me va perfecto.',
      },
      {
        from: 'agent',
        label: 'Ana · IA',
        text: 'Listo Marta 😊\nTe he dejado reservada la primera valoración para este jueves a las 18:00 en Aurea Clínics Barcelona.',
      },
      {
        from: 'agent',
        label: 'Ana · IA',
        text: 'Ahora mismo te envío por aquí la ubicación, la confirmación y un recordatorio antes de venir.\nSi te surge cualquier duda antes de la cita, me escribes y te ayudo.',
      },
    ];

    let hasStarted = false;

    function scrollMessagesToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function appendMessage(message) {
      const row = document.createElement('div');
      row.className = `ai-chat__message ai-chat__message--${message.from}`;

      const bubble = document.createElement('div');
      bubble.className = 'ai-chat__bubble';

      const meta = document.createElement('span');
      meta.className = 'ai-chat__meta';
      meta.textContent = message.label;

      const text = document.createElement('p');
      text.textContent = message.text;

      bubble.appendChild(meta);
      bubble.appendChild(text);
      row.appendChild(bubble);
      messagesContainer.appendChild(row);
      scrollMessagesToBottom();
    }

    function playConversation(index = 0) {
      if (hasStarted) return;
      hasStarted = true;
      runMessage(index);
    }

    function runMessage(index) {
      const message = conversationFlow[index];
      if (!message) return;

      const isAgent = message.from === 'agent';
      const typingDuration = isAgent
        ? Math.min(1500, Math.max(720, Math.round(message.text.length * 18)))
        : Math.min(900, Math.max(260, Math.round(message.text.length * 8)));

      if (isAgent) {
        typingIndicator.hidden = false;
        scrollMessagesToBottom();
      }

      window.setTimeout(() => {
        typingIndicator.hidden = true;
        appendMessage(message);

        if (index + 1 < conversationFlow.length) {
          const pauseAfter = isAgent ? 540 : 360;
          window.setTimeout(() => runMessage(index + 1), pauseAfter);
        }
      }, typingDuration);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playConversation();
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(chat);
  }

  // --- INIT EVERYTHING ---
  function init() {
    initPageLoader();
    initScrollReveal();
    initParallax();
    initCounters();
    initTestimonialsScroll();
    initSmoothAnchors();
    initBookingModal();
    initPhasesAccordion();
    initMagneticButtons();
    initHeroSimulator();
    initAIConversation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
