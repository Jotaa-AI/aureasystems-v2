/* ============================================
   AUREA SYSTEMS — Patient Flow Interactions
   Premium Apple-style Motion System
   ============================================ */

(function () {
  'use strict';

  // --- PAGE LOADER ---
  function initPageLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;

    let hidden = false;

    function hideLoader() {
      if (hidden) return;
      hidden = true;
      document.body.classList.remove('is-loading');
      loader.classList.add('is-hidden');

      window.setTimeout(() => {
        loader.remove();
      }, 650);
    }

    window.addEventListener('load', hideLoader, { once: true });
    window.setTimeout(hideLoader, 2200);
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
        from: 'patient',
        label: 'Posible paciente',
        text: 'Hola, vi vuestro anuncio para armonización facial. ¿Tenéis primera valoración?',
      },
      {
        from: 'agent',
        label: 'Agente IA',
        text: 'Hola, claro. Soy el agente de Patient Flow de la clínica. ¿Qué tratamiento te interesa ahora mismo?',
      },
      {
        from: 'patient',
        label: 'Posible paciente',
        text: 'Me interesa sobre todo labios y un resultado natural.',
      },
      {
        from: 'agent',
        label: 'Agente IA',
        text: 'Perfecto. Para orientarte mejor, ¿es tu primera vez o ya te lo has realizado antes?',
      },
      {
        from: 'patient',
        label: 'Posible paciente',
        text: 'Ya me lo hice una vez, pero quiero algo más sutil.',
      },
      {
        from: 'agent',
        label: 'Agente IA',
        text: 'Entendido. Tenemos huecos esta semana. ¿Prefieres mañana por la tarde o el viernes por la mañana?',
      },
      {
        from: 'patient',
        label: 'Posible paciente',
        text: 'El viernes por la mañana me va bien.',
      },
      {
        from: 'agent',
        label: 'Agente IA',
        text: 'Perfecto. Te dejo propuesta de primera valoración el viernes a las 11:30 y, si quieres, aviso también al equipo para continuar contigo.',
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

    function playConversation() {
      if (hasStarted) return;
      hasStarted = true;

      conversationFlow.forEach((message, index) => {
        window.setTimeout(() => {
          typingIndicator.hidden = false;
          scrollMessagesToBottom();

          window.setTimeout(() => {
            typingIndicator.hidden = true;
            appendMessage(message);
          }, 520);
        }, index * 1300);
      });
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
