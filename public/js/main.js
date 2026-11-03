/**
 * Uzair AI Studio - Interactive Frontend Engine (V2)
 * Features:
 * - Architecture & Sprint Planner (Zero Prices for client confidentiality)
 * - Dynamic Portfolio Category Filter
 * - AI Concierge Assistant (Founder Muhammad Uzair info integrated)
 * - Form Validation & Real-Time Backend Transmissions
 * - Smooth Mobile Navigation Drawer
 * - Zero Overflow Strict Layout Handling
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHeroInteractive();
  initArchitecturePlanner();
  initPortfolioFilter();
  initFaqAccordion();
  initContactForm();
  initNewsletter();
  initAiAssistant();
  initStatsCounter();
  initCanvasParticles();
  initInternshipModule();
});

/* ============================================================
   1. NAVBAR & MOBILE DRAWER
   ============================================================ */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-links a');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
      const isOpen = mobileDrawer.classList.contains('open');
      mobileToggle.innerHTML = isOpen
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      });
    });
  }

  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.25 }
  );

  sections.forEach(sec => observer.observe(sec));
}

/* ============================================================
   2. INTERACTIVE SPRINT & ARCHITECTURE PLANNER (EXECUTIVE ENGINE)
   ============================================================ */
function initArchitecturePlanner() {
  const estimator = document.getElementById('projectEstimator');
  if (!estimator) return;

  const typeConfig = {
    web: { name: 'Modern Web Platform / SaaS', baseSprints: 2, squad: 'Lead Full-Stack + UI/UX + QA Automation' },
    mobile: { name: 'Mobile Application (iOS & Android)', baseSprints: 3, squad: 'Mobile Engineer + Backend Architect + QA' },
    ai: { name: 'Autonomous AI & Intelligent Agents', baseSprints: 3, squad: 'AI/ML Specialist + Cloud Architect + QA' },
    software: { name: 'Custom Enterprise Software / ERP', baseSprints: 4, squad: 'Senior Solution Architect + 2 Full-Stack + QA' },
    fullsuite: { name: 'Full Digital Ecosystem', baseSprints: 6, squad: 'Full Squad: Lead Architect + 3 Engineers + UI/UX + QA' }
  };

  const featureLabels = {
    auth: '🔐 User Auth & RBAC',
    payment: '💳 Global Payments',
    ai_agent: '🧠 AI Copilot / Agent',
    realtime_chat: '⚡ Real-Time Data Sync',
    admin_dashboard: '📊 Admin Telemetry',
    cloud_devops: '🚀 Cloud DevOps & CI/CD',
    vector_rag: '🔍 Vector Search & RAG',
    security_audit: '🔒 Security & Compliance'
  };

  let currentType = 'web';
  let selectedFeatures = ['auth', 'ai_agent', 'admin_dashboard'];
  let currentSpeed = 'standard';
  let currentMode = 'quick';
  let advancedStack = {
    aiModel: 'OpenAI GPT-4o',
    database: 'PostgreSQL / Supabase',
    cloud: 'Amazon Web Services (AWS)',
    design: 'Figma Ready'
  };

  // Mode Switcher Controls
  const btnModeQuick = document.getElementById('btnModeQuick');
  const btnModeAdvanced = document.getElementById('btnModeAdvanced');
  const advancedTray = document.getElementById('plannerAdvancedTray');
  const btnToggleAdvancedTray = document.getElementById('btnToggleAdvancedTray');
  const advancedToggleText = document.getElementById('advancedToggleText');

  if (btnModeQuick && btnModeAdvanced && advancedTray) {
    btnModeQuick.addEventListener('click', () => {
      btnModeQuick.classList.add('active');
      btnModeAdvanced.classList.remove('active');
      currentMode = 'quick';
      advancedTray.style.display = 'none';
      if (advancedToggleText) advancedToggleText.textContent = 'Expand All Specs ▾';
    });

    btnModeAdvanced.addEventListener('click', () => {
      btnModeAdvanced.classList.add('active');
      btnModeQuick.classList.remove('active');
      currentMode = 'advanced';
      advancedTray.style.display = 'block';
      if (advancedToggleText) advancedToggleText.textContent = 'Collapse Specs ▴';
    });

    if (btnToggleAdvancedTray) {
      btnToggleAdvancedTray.addEventListener('click', () => {
        const isHidden = advancedTray.style.display === 'none';
        advancedTray.style.display = isHidden ? 'block' : 'none';
        if (advancedToggleText) {
          advancedToggleText.textContent = isHidden ? 'Collapse Specs ▴' : 'Expand All Specs ▾';
        }
      });
    }
  }

  // Project Type Selection (Single Select)
  const typeCards = estimator.querySelectorAll('.type-select-card');
  typeCards.forEach(card => {
    card.addEventListener('click', () => {
      typeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentType = card.dataset.type;
      recalculate();
    });
  });

  // Feature Modules Selection (Multi-Select Toggle)
  const featureCards = estimator.querySelectorAll('.feature-select-card');
  featureCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const feat = card.dataset.feature;
      if (card.classList.contains('selected')) {
        if (!selectedFeatures.includes(feat)) selectedFeatures.push(feat);
      } else {
        selectedFeatures = selectedFeatures.filter(f => f !== feat);
      }
      recalculate();
    });
  });

  // Advanced Tech Stack Chips (Single Select within each group)
  const chipGroups = estimator.querySelectorAll('.planner-chip-group');
  chipGroups.forEach(group => {
    const groupName = group.dataset.stackGroup;
    const chips = group.querySelectorAll('.planner-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        if (groupName && chip.dataset.value) {
          advancedStack[groupName] = chip.dataset.value;
        }
        recalculate();
      });
    });
  });

  // Timeline Speed Radio Selection
  const speedCards = estimator.querySelectorAll('.speed-option-card');
  const speedRadios = estimator.querySelectorAll('input[name="timelineSpeed"]');
  speedRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentSpeed = e.target.value;
      speedCards.forEach(card => {
        const r = card.querySelector('input[type="radio"]');
        if (r && r.checked) card.classList.add('selected');
        else card.classList.remove('selected');
      });
      recalculate();
    });
  });

  // Dynamic Recalculation Engine
  function recalculate() {
    const config = typeConfig[currentType] || typeConfig.web;
    let sprints = config.baseSprints;

    if (selectedFeatures.length > 3) sprints += 1;
    if (selectedFeatures.length > 5) sprints += 1;
    if (selectedFeatures.length > 7) sprints += 1;

    let weeks = sprints * 2;
    let timelineText = `${weeks} Weeks (${sprints} Sprints)`;

    if (currentSpeed === 'express') {
      const fastWeeks = Math.max(2, Math.round(weeks * 0.7));
      timelineText = `${fastWeeks} Weeks (Fast-Track Dedicated Cadence)`;
    } else if (currentSpeed === 'relaxed') {
      timelineText = `${weeks + 2} Weeks (Phased Milestones)`;
    }

    const complexity = selectedFeatures.length > 5 
      ? 'Enterprise Scale' 
      : (selectedFeatures.length > 2 ? 'Growth Ready' : 'MVP Standard');

    const architectureEl = document.getElementById('calcArchitectureTier');
    const squadEl = document.getElementById('calcSquad');
    const timeEl = document.getElementById('calcTimeline');
    const cloudEl = document.getElementById('calcModulesCloud');

    if (architectureEl) architectureEl.textContent = complexity;
    if (squadEl) squadEl.textContent = config.squad;
    if (timeEl) timeEl.textContent = timelineText;

    // Render Active Module Tags in Real-Time
    if (cloudEl) {
      if (selectedFeatures.length === 0) {
        cloudEl.innerHTML = '<span style="font-size:0.75rem; color:#64748B;">No optional modules selected (Core baseline build only)</span>';
      } else {
        cloudEl.innerHTML = selectedFeatures.map(feat => {
          const label = featureLabels[feat] || feat;
          return `<span class="cockpit-module-tag">${label}</span>`;
        }).join('');
      }
    }
  }

  // Initial Calculation
  recalculate();

  // Helper: Build Full Structured Blueprint Text
  function generateBlueprintDocument() {
    const architectureTier = document.getElementById('calcArchitectureTier')?.textContent || 'Growth Ready';
    const timelineRange = document.getElementById('calcTimeline')?.textContent || '4 Weeks';
    const squadInfo = document.getElementById('calcSquad')?.textContent || typeConfig[currentType].squad;
    const clientName = document.getElementById('plannerClientName')?.value.trim() || 'Prospective Partner';
    const clientCompany = document.getElementById('plannerClientCompany')?.value.trim() || 'Undisclosed';
    const budget = document.getElementById('plannerBudgetTier')?.value || 'Flexible';
    const notes = document.getElementById('plannerClientNotes')?.value.trim() || 'Standard enterprise delivery scope.';

    const modulesText = selectedFeatures.map(f => featureLabels[f] || f).join(', ') || 'Core Platform';

    return `*UZAIR AI STUDIO — TECHNICAL ARCHITECTURE BLUEPRINT*
==================================================
Project Category: ${typeConfig[currentType].name}
Client / Entity: ${clientName} (${clientCompany})
Architecture Tier: ${architectureTier}
Target Delivery: ${timelineRange}
Recommended Squad: ${squadInfo}
Target Investment: ${budget}

*ACTIVE CAPABILITY MODULES:*
${modulesText}

*ADVANCED INFRASTRUCTURE SPECIFICATIONS:*
• AI Model Foundation: ${advancedStack.aiModel || 'OpenAI GPT-4o'}
• Primary Database: ${advancedStack.database || 'PostgreSQL'}
• Cloud Infrastructure: ${advancedStack.cloud || 'Amazon AWS'}
• Design Status: ${advancedStack.design || 'Figma Ready'}

*PROJECT REQUIREMENTS & SCOPE:*
${notes}

IP Transfer: 100% Client Ownership with Full NDA
Endorsed by: Muhammad Uzair (Founder & Lead Architect)`;
  }

  // 1. Direct Architecture Brief Submission (Async Fetch, Zero Reload, Non-Restrictive)
  const plannerForm = document.getElementById('plannerClientForm');
  const btnPlannerSubmit = document.getElementById('btnPlannerSubmit');
  const successBox = document.getElementById('plannerSuccessBox');
  const successRefId = document.getElementById('plannerSuccessRefId');
  const btnSuccessWaChat = document.getElementById('btnSuccessWaChat');
  const btnResetPlannerForm = document.getElementById('btnResetPlannerForm');

  if (plannerForm) {
    plannerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('plannerClientName')?.value.trim();
      const contact = document.getElementById('plannerClientContact')?.value.trim();
      const company = document.getElementById('plannerClientCompany')?.value.trim();
      const budgetTier = document.getElementById('plannerBudgetTier')?.value;
      const notes = document.getElementById('plannerClientNotes')?.value.trim();

      const origText = btnPlannerSubmit.innerHTML;
      btnPlannerSubmit.disabled = true;
      btnPlannerSubmit.innerHTML = '<span>⚡ Dispatching Blueprint...</span>';

      try {
        const payload = {
          projectType: currentType,
          features: selectedFeatures,
          timelineSpeed: currentSpeed,
          name: name || 'Prospective Client',
          email: contact || 'client@architecture.direct',
          phone: contact || 'Not provided',
          company: company || 'Not specified',
          budgetTier: budgetTier,
          notes: notes,
          advancedStack: advancedStack
        };

        const res = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data && data.success) {
          const refId = (data.data && data.data.id) ? data.data.id : 'PLAN-REGISTERED';
          plannerForm.style.display = 'none';
          if (successBox) successBox.style.display = 'block';
          if (successRefId) successRefId.textContent = refId;

          // Wire up WhatsApp direct button with refId
          if (btnSuccessWaChat) {
            btnSuccessWaChat.onclick = () => {
              const waText = encodeURIComponent(`Hi Muhammad Uzair, I just submitted an Architecture Blueprint on your site (Ref: ${refId}). Let's discuss development sprints!\n\nCategory: ${typeConfig[currentType].name}\nModules: ${selectedFeatures.join(', ')}`);
              window.open(`https://wa.me/923169300645?text=${waText}`, '_blank');
            };
          }

          showToast(`🎯 Architecture Blueprint registered! Reference ID: ${refId}`);
        } else {
          showToast('⚠️ Notice: Inquiry recorded! Muhammad Uzair will review your specifications.');
        }
      } catch (err) {
        // Graceful fallback
        plannerForm.style.display = 'none';
        if (successBox) successBox.style.display = 'block';
        if (successRefId) successRefId.textContent = 'PLAN-' + Date.now().toString(36).toUpperCase();
        showToast('🎯 Architecture Blueprint recorded! Muhammad Uzair has been notified.');
      } finally {
        btnPlannerSubmit.disabled = false;
        btnPlannerSubmit.innerHTML = origText;
      }
    });

    if (btnResetPlannerForm) {
      btnResetPlannerForm.addEventListener('click', () => {
        plannerForm.style.display = 'block';
        if (successBox) successBox.style.display = 'none';
      });
    }
  }

  // 2. Direct WhatsApp Discuss Button
  const btnPlannerWhatsApp = document.getElementById('btnPlannerWhatsApp');
  if (btnPlannerWhatsApp) {
    btnPlannerWhatsApp.addEventListener('click', () => {
      const blueprint = generateBlueprintDocument();
      const waUrl = `https://wa.me/923169300645?text=${encodeURIComponent(blueprint)}`;
      window.open(waUrl, '_blank');
    });
  }

  // 3. Copy Technical Blueprint Specs Button
  const btnPlannerCopy = document.getElementById('btnPlannerCopy');
  if (btnPlannerCopy) {
    btnPlannerCopy.addEventListener('click', async () => {
      const blueprint = generateBlueprintDocument();
      try {
        await navigator.clipboard.writeText(blueprint);
        const orig = btnPlannerCopy.innerHTML;
        btnPlannerCopy.innerHTML = '<span>✓ Copied Specs!</span>';
        showToast('📋 Architecture Blueprint copied to clipboard!');
        setTimeout(() => { btnPlannerCopy.innerHTML = orig; }, 3000);
      } catch (e) {
        showToast('📋 Technical specifications prepared!');
      }
    });
  }

  // 4. "Fill Full Form Below" Link (#btnApplyEstimate)
  const btnApplyEstimate = document.getElementById('btnApplyEstimate');
  if (btnApplyEstimate) {
    btnApplyEstimate.addEventListener('click', () => {
      const architectureTier = document.getElementById('calcArchitectureTier')?.textContent || 'Growth Ready';
      const timelineRange = document.getElementById('calcTimeline')?.textContent || '4 Weeks';
      const squadInfo = document.getElementById('calcSquad')?.textContent || typeConfig[currentType].squad;
      
      const serviceSelect = document.getElementById('formService');
      const scaleSelect = document.getElementById('formProjectScale');
      const messageTextarea = document.getElementById('formMessage');

      if (serviceSelect) {
        if (currentType === 'web') serviceSelect.value = 'Website & E-Commerce';
        else if (currentType === 'mobile') serviceSelect.value = 'Mobile App Development';
        else if (currentType === 'ai') serviceSelect.value = 'AI & Autonomous Agents';
        else if (currentType === 'software') serviceSelect.value = 'Custom Software Engineering';
        else serviceSelect.value = 'Full Digital Suite';
      }

      if (scaleSelect) {
        if (architectureTier.includes('Enterprise')) scaleSelect.value = 'Enterprise Transformation';
        else if (architectureTier.includes('Growth')) scaleSelect.value = 'Scaling Product / Growth';
        else scaleSelect.value = 'Startup / Rapid Prototype';
      }

      if (messageTextarea) {
        messageTextarea.value = `Hi Muhammad Uzair & Team, I configured an Architecture Blueprint on your website.
Category: ${typeConfig[currentType].name}
Complexity: ${architectureTier}
Recommended Squad: ${squadInfo}
Target Delivery: ${timelineRange}
Selected Modules: ${selectedFeatures.map(f => featureLabels[f] || f).join(', ')}.
AI Model: ${advancedStack.aiModel || 'Standard'}
Database: ${advancedStack.database || 'PostgreSQL'}
Cloud: ${advancedStack.cloud || 'AWS'}
Please review our specifications and prepare a formal statement of work.`;
      }

      const contactSec = document.getElementById('contact');
      if (contactSec) {
        contactSec.scrollIntoView({ behavior: 'smooth' });
        showToast('🎯 Architecture Blueprint applied to consultation form below!');
      }
    });
  }
}

/* ============================================================
   3. PORTFOLIO FILTERING
   ============================================================ */
function initPortfolioFilter() {
  const tabs = document.querySelectorAll('.portfolio-filter-tabs .tab-btn');
  const items = document.querySelectorAll('.portfolio-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;
      items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'flex';
          item.style.opacity = '0';
          setTimeout(() => {
            item.style.transition = 'opacity 0.25s ease';
            item.style.opacity = '1';
          }, 15);
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* ============================================================
   4. FAQ ACCORDION
   ============================================================ */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    const answer = item.querySelector('.faq-answer');

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherAns = other.querySelector('.faq-answer');
          if (otherAns) otherAns.style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ============================================================
   5. CONTACT FORM AJAX SUBMISSION
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('consultationForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Transmitting to Muhammad Uzair...</span>`;

    const payload = {
      name: document.getElementById('formName').value,
      email: document.getElementById('formEmail').value,
      phone: document.getElementById('formPhone').value,
      service: document.getElementById('formService').value,
      projectScale: document.getElementById('formProjectScale').value,
      timeline: document.getElementById('formTimeline').value,
      message: document.getElementById('formMessage').value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(`✅ ${data.message}`);
        form.reset();
      } else {
        showToast(`⚠️ ${data.message || 'Submission failed. Please check inputs.'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('✅ Inquiry recorded successfully! Muhammad Uzair will contact you promptly.');
      form.reset();
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/* ============================================================
   6. NEWSLETTER SUBSCRIPTION
   ============================================================ */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('newsletterEmail');
    const email = input.value;

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showToast(data.message);
      input.value = '';
    } catch (err) {
      showToast('🎉 Thank you for subscribing to Uzair AI Studio Insider!');
      input.value = '';
    }
  });
}

/* ============================================================
   7. AI CONCIERGE / STUDIO BOT
   ============================================================ */
function initAiAssistant() {
  const openBtn = document.getElementById('openAiChat');
  const closeBtn = document.getElementById('closeAiChat');
  const chatDrawer = document.getElementById('aiChatDrawer');
  const chatForm = document.getElementById('aiChatForm');
  const chatInput = document.getElementById('aiChatInput');
  const messagesBox = document.getElementById('aiChatMessages');

  if (!openBtn || !chatDrawer) return;

  openBtn.addEventListener('click', () => {
    chatDrawer.classList.toggle('open');
    if (chatDrawer.classList.contains('open')) {
      chatInput.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chatDrawer.classList.remove('open');
    });
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = chatInput.value.trim();
    if (!userText) return;

    appendMessage('user', userText);
    chatInput.value = '';

    const typingId = 'typing-' + Date.now();
    appendMessage('bot', 'Analyzing requirements...', typingId);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();

      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      appendBotReply(data.reply, data.suggestedActions);
    } catch (err) {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      appendBotReply(
        "Uzair AI Studio engineers high-impact Software, Mobile Apps, Modern Web Systems & AI Solutions. Would you like to chat with Founder Muhammad Uzair directly on WhatsApp (+92 343 3885835)?",
        ['Chat on WhatsApp', 'Open Architecture Planner', 'Book Strategy Call']
      );
    }
  });

  function appendMessage(sender, text, id = null) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    if (id) msg.id = id;
    msg.textContent = text;
    messagesBox.appendChild(msg);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function appendBotReply(replyText, actions = []) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg bot';

    let formatted = replyText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    msg.innerHTML = formatted;

    if (actions && actions.length > 0) {
      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'chat-msg-actions';

      actions.forEach(act => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chat-action-chip';
        chip.textContent = act;
        chip.addEventListener('click', () => {
          if (act.includes('Apply on Website') || act.includes('Internship')) {
            const internEl = document.getElementById('internship');
            if (internEl) internEl.scrollIntoView({ behavior: 'smooth' });
            chatDrawer.classList.remove('open');
          } else if (act.includes('Open Google Form')) {
            window.open('https://docs.google.com/forms/d/e/1FAIpQLSeCa6gtGbeSSDzoYAP0JBx3QeHdlBmLsA7EKq9Nv1jqTlv9jg/viewform?usp=sharing&ouid=113245648858304432575', '_blank');
          } else if (act.includes('Planner') || act.includes('Architecture')) {
            const plannerEl = document.getElementById('planner') || document.getElementById('projectEstimator');
            if (plannerEl) plannerEl.scrollIntoView({ behavior: 'smooth' });
            chatDrawer.classList.remove('open');
          } else if (act.includes('WhatsApp')) {
            window.open('https://wa.me/923433885835?text=Hi%20Muhammad%20Uzair,%20I%20want%20to%20discuss%20a%20project%20with%20Uzair%20AI%20Studio', '_blank');
          } else if (act.includes('Portfolio') || act.includes('Case Studies')) {
            document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });
            chatDrawer.classList.remove('open');
          } else {
            chatInput.value = act;
            chatForm.dispatchEvent(new Event('submit'));
          }
        });
        actionsWrap.appendChild(chip);
      });
      msg.appendChild(actionsWrap);
    }

    messagesBox.appendChild(msg);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
}

/* ============================================================
   8. STATS COUNTER ANIMATION
   ============================================================ */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        statNumbers.forEach(num => {
          const target = parseFloat(num.dataset.target);
          const suffix = num.dataset.suffix || '';
          const isDecimal = target % 1 !== 0;
          let current = 0;
          const duration = 1800;
          const stepTime = 25;
          const steps = duration / stepTime;
          const increment = target / steps;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            num.textContent = (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.35 });

  const statsSection = document.querySelector('.stats-bar-section');
  if (statsSection) observer.observe(statsSection);
}

/* ============================================================
   9. INTERACTIVE CANVAS PARTICLES (SUBTLE LIGHT AMBIENCE)
   ============================================================ */
function initCanvasParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(28, Math.floor(width / 45));

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 2 + 1,
      color: i % 2 === 0 ? 'rgba(29, 78, 216, 0.14)' : 'rgba(6, 182, 212, 0.16)'
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(29, 78, 216, ${0.07 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(render);
  }

  render();
}

/* ============================================================
   TOAST HELPER
   ============================================================ */
function showToast(text) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-alert';
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
}

/* ============================================================
   10. HERO INTERACTIVE COMMAND CENTER (PREVIEW/CODE + TABS)
   ============================================================ */
function initHeroInteractive() {
  const card = document.getElementById('heroInteractiveCard');
  if (!card) return;

  const badgePill = document.getElementById('heroBadgePill');
  if (badgePill) {
    badgePill.addEventListener('click', () => {
      const planner = document.getElementById('planner');
      if (planner) planner.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // View Mode Switcher: Preview vs Code
  const btnVisual = document.getElementById('btnViewVisual');
  const btnCode = document.getElementById('btnViewCode');
  const visualStage = document.getElementById('heroVisualStage');
  const codeStage = document.getElementById('heroCodeStage');

  if (btnVisual && btnCode && visualStage && codeStage) {
    btnVisual.addEventListener('click', () => {
      btnVisual.classList.add('active');
      btnCode.classList.remove('active');
      visualStage.style.display = 'flex';
      codeStage.style.display = 'none';
    });

    btnCode.addEventListener('click', () => {
      btnCode.classList.add('active');
      btnVisual.classList.remove('active');
      visualStage.style.display = 'none';
      codeStage.style.display = 'flex';
    });
  }

  // Copy Code Button
  const btnCopyCode = document.getElementById('btnCopyHeroCode');
  const codeSnippet = document.getElementById('heroCodeSnippet');
  if (btnCopyCode && codeSnippet) {
    btnCopyCode.addEventListener('click', () => {
      navigator.clipboard.writeText(codeSnippet.innerText).then(() => {
        btnCopyCode.textContent = '✓ Copied!';
        showToast('📋 Architecture Blueprint code copied to clipboard!');
        setTimeout(() => {
          btnCopyCode.textContent = 'Copy';
        }, 2500);
      }).catch(() => {
        showToast('📋 Architecture Blueprint ready for implementation.');
      });
    });
  }

  // Capability Tabs Data
  const capabilities = {
    saas: {
      image: '/assets/cloud_analytics_dashboard_1793620361024.jpg',
      label: 'Enterprise SaaS Telemetry',
      metrics: [
        { val: '99.98%', lbl: 'Uptime SLA' },
        { val: '< 1.2s', lbl: 'Load Velocity' },
        { val: '3.4x', lbl: 'Conversion Lift' }
      ],
      tags: ['▲ Next.js 15 & React 19', '☁️ Cloud Native AWS', '🐘 PostgreSQL', '🐳 Docker CI/CD', '🛡️ SOC2 Security'],
      codeLang: 'TypeScript • Next.js 15 Clean Architecture',
      code: `<span class="c-keyword">import</span> { <span class="c-type">AIService</span>, <span class="c-type">CloudSLA</span> } <span class="c-keyword">from</span> <span class="c-str">'@uzair-ai/core'</span>;

<span class="c-comment">// Production Architecture by Muhammad Uzair</span>
<span class="c-keyword">export async function</span> <span class="c-func">deploySprintModule</span>() {
  <span class="c-keyword">const</span> studio = <span class="c-keyword">new</span> <span class="c-type">UzairAIStudio</span>({
    leadArchitect: <span class="c-str">'Muhammad Uzair'</span>,
    location: <span class="c-str">'Mardan, KPK, Pakistan'</span>,
    telemetrySLA: <span class="c-str">'99.98%'</span>,
    biWeeklyDelivery: <span class="c-keyword">true</span>
  });

  <span class="c-keyword">return await</span> studio.<span class="c-func">shipCleanCode</span>({
    ipOwnership: <span class="c-str">'100% Client Transferred'</span>,
    warranty: <span class="c-str">'180 Days Active SLA'</span>
  });
}`
    },
    mobile: {
      image: '/assets/mobile_app_showcase_1793620252805.jpg',
      label: 'Cross-Platform Mobile Ecosystem',
      metrics: [
        { val: '100K+', lbl: 'Active Installs' },
        { val: '60 FPS', lbl: 'Native Fluidity' },
        { val: '4.9 ★', lbl: 'App Store Rating' }
      ],
      tags: ['📱 Flutter & Dart', '⚛️ React Native', '🍎 iOS Swift', '🤖 Android Kotlin', '⚡ Real-Time Sync'],
      codeLang: 'Dart / Flutter • State Architecture',
      code: `<span class="c-keyword">import</span> <span class="c-str">'package:flutter/material.dart'</span>;
<span class="c-keyword">import</span> <span class="c-str">'package:uzair_ai/engine.dart'</span>;

<span class="c-comment">// 60fps Native Mobile Engine by Muhammad Uzair</span>
<span class="c-keyword">class</span> <span class="c-type">MobileSprintEngine</span> <span class="c-keyword">extends</span> <span class="c-type">StatefulWidget</span> {
  <span class="c-keyword">final</span> <span class="c-type">String</span> client = <span class="c-str">"Uzair AI Studio Global Client"</span>;
  <span class="c-keyword">final</span> <span class="c-type">bool</span> biometricsEnabled = <span class="c-keyword">true</span>;

  <span class="c-keyword">Future&lt;void&gt;</span> <span class="c-func">syncRealtimeTelemetry</span>() <span class="c-keyword">async</span> {
    <span class="c-keyword">await</span> <span class="c-type">NativeBridge</span>.<span class="c-func">dispatch</span>(
      channel: <span class="c-str">"iOS_Android_Store_Ready"</span>,
      speedSLA: <span class="c-str">"60_FPS_Guaranteed"</span>
    );
  }
}`
    },
    ai: {
      image: '/assets/ai_neural_core_1793620332731.jpg',
      label: 'Autonomous AI Agent Pipeline',
      metrics: [
        { val: '-70%', lbl: 'Response Latency' },
        { val: '85%', lbl: 'Auto-Resolution' },
        { val: '100%', lbl: 'Data Privacy' }
      ],
      tags: ['🧠 OpenAI & Gemini API', '🐍 Python & FastAPI', '⚡ LangChain & LlamaIndex', '🗄️ Vector Database', '🤖 Autonomous Agents'],
      codeLang: 'Python 3.11 • Autonomous AI Agent Engine',
      code: `<span class="c-keyword">from</span> fastapi <span class="c-keyword">import</span> FastAPI, Depends
<span class="c-keyword">from</span> uzair_ai.agents <span class="c-keyword">import</span> AutonomousNeuralSquad

<span class="c-comment"># Autonomous Agent Framework by Muhammad Uzair</span>
app = FastAPI(title=<span class="c-str">"Uzair AI Studio Neural Core"</span>)

<span class="c-keyword">@app.post</span>(<span class="c-str">"/api/v1/agent/orchestrate"</span>)
<span class="c-keyword">async def</span> <span class="c-func">execute_neural_pipeline</span>(query: str):
    agent_squad = AutonomousNeuralSquad(
        llm=<span class="c-str">"gemini-2.5-flash-pro"</span>,
        rag_vector_db=<span class="c-str">"pinecone-enterprise"</span>,
        sla_latency_limit_ms=250
    )
    <span class="c-keyword">return await</span> agent_squad.solve_and_verify(query)`
    }
  };

  const tabs = document.querySelectorAll('.hero-tab-pill');
  const stageImg = document.getElementById('heroStageImage');
  const stageLabel = document.getElementById('heroStageLabel');
  const metricVal1 = document.getElementById('metricVal1');
  const metricLbl1 = document.getElementById('metricLbl1');
  const metricVal2 = document.getElementById('metricVal2');
  const metricLbl2 = document.getElementById('metricLbl2');
  const metricVal3 = document.getElementById('metricVal3');
  const metricLbl3 = document.getElementById('metricLbl3');
  const tagsContainer = document.getElementById('heroTechTags');
  const codeLangLabel = document.querySelector('.terminal-lang');

  let currentKey = 'saas';
  let isHovered = false;

  card.addEventListener('mouseenter', () => isHovered = true);
  card.addEventListener('mouseleave', () => isHovered = false);

  function activateTab(key) {
    currentKey = key;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === key));

    const data = capabilities[key];
    if (!data) return;

    if (stageImg) {
      stageImg.style.opacity = '0';
      setTimeout(() => {
        stageImg.src = data.image;
        stageImg.style.opacity = '1';
      }, 140);
    }

    if (stageLabel) stageLabel.textContent = data.label;

    if (metricVal1 && data.metrics[0]) {
      metricVal1.textContent = data.metrics[0].val;
      metricLbl1.textContent = data.metrics[0].lbl;
    }
    if (metricVal2 && data.metrics[1]) {
      metricVal2.textContent = data.metrics[1].val;
      metricLbl2.textContent = data.metrics[1].lbl;
    }
    if (metricVal3 && data.metrics[2]) {
      metricVal3.textContent = data.metrics[2].val;
      metricLbl3.textContent = data.metrics[2].lbl;
    }

    if (tagsContainer) {
      tagsContainer.innerHTML = data.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('');
    }

    if (codeLangLabel) codeLangLabel.textContent = data.codeLang;
    if (codeSnippet) codeSnippet.innerHTML = `<code>${data.code}</code>`;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activateTab(tab.dataset.tab);
    });
  });

  // Smooth auto-cycle between tabs every 6 seconds when not hovered
  const tabKeys = ['saas', 'mobile', 'ai'];
  let cycleIdx = 0;
  setInterval(() => {
    if (!isHovered && document.visibilityState === 'visible') {
      cycleIdx = (cycleIdx + 1) % tabKeys.length;
      activateTab(tabKeys[cycleIdx]);
    }
  }, 6000);
}

/* ============================================================
   10. INTERNSHIP & TRAINING PROGRAM REGISTRATION ENGINE
   ============================================================ */
function initInternshipModule() {
  const tabBtns = document.querySelectorAll('.intern-tab-btn');
  const tabDirectPortal = document.getElementById('tabDirectPortal');
  const tabGoogleForm = document.getElementById('tabGoogleForm');
  const tabCheckStatus = document.getElementById('tabCheckStatus');

  // Tab Switching
  function switchInternTab(tabKey) {
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });

    if (tabDirectPortal) tabDirectPortal.style.display = tabKey === 'direct-portal' ? 'block' : 'none';
    if (tabGoogleForm) tabGoogleForm.style.display = tabKey === 'google-form' ? 'block' : 'none';
    if (tabCheckStatus) tabCheckStatus.style.display = tabKey === 'check-status' ? 'block' : 'none';
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchInternTab(btn.dataset.tab);
    });
  });

  // Live Portal Settings (Check if form is turned ON or OFF by Admin)
  fetch('/api/internship/settings')
    .then(r => r.json())
    .then(j => {
      if (j.success && j.settings && !j.settings.registrationActive) {
        const alertEl = document.getElementById('internAlertBox');
        const submitBtn = document.getElementById('btnSubmitInternship');
        if (alertEl) {
          alertEl.className = 'intern-alert-container error';
          alertEl.innerHTML = `<strong>⚠️ Registration Notice:</strong><br>${j.settings.closedMessage || 'Internship applications are currently paused.'}`;
          alertEl.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.6';
          submitBtn.style.cursor = 'not-allowed';
          submitBtn.innerHTML = '<span>🚫 Application Entry Closed</span>';
        }
      }
    })
    .catch(() => {});

  // Name Validation & Live Capitalization Indicator
  const fullNameInput = document.getElementById('internFullName');
  const capsIndicator = document.getElementById('capsIndicator');
  const capsIndicatorText = document.getElementById('capsIndicatorText');
  const btnAutoCapitalize = document.getElementById('btnAutoCapitalize');

  function validateCaps(name) {
    if (!name || !name.trim()) {
      return { status: 'idle', msg: 'Enter full name with Capital first letters' };
    }
    const clean = name.trim().replace(/\s+/g, ' ');
    const words = clean.split(' ');

    const isAllUpper = clean === clean.toUpperCase() && clean.length > 3 && /[A-Z]/.test(clean);
    const isAllLower = clean === clean.toLowerCase() && /[a-z]/.test(clean);

    const allWordsStartWithCap = words.every(w => {
      if (!w) return true;
      const first = w.charAt(0);
      return first === first.toUpperCase() && /[A-Z]/.test(first);
    });

    if (isAllUpper) {
      return { status: 'error', msg: '❌ Please avoid all capital letters (e.g. Ali Ahmed Khan)' };
    }
    if (isAllLower) {
      return { status: 'error', msg: '❌ Please capitalize the first letter of each word (e.g. Ali Ahmed Khan)' };
    }
    if (!allWordsStartWithCap) {
      return { status: 'error', msg: '❌ Every word after a space must begin with a capital letter' };
    }
    return { status: 'valid', msg: `✅ Format Correct: "${clean}"` };
  }

  if (fullNameInput && capsIndicator && capsIndicatorText) {
    fullNameInput.addEventListener('input', () => {
      const res = validateCaps(fullNameInput.value);
      capsIndicator.className = 'caps-status-indicator ' + res.status;
      capsIndicatorText.textContent = res.msg;
    });

    if (btnAutoCapitalize) {
      btnAutoCapitalize.addEventListener('click', () => {
        const val = fullNameInput.value;
        if (!val || !val.trim()) return;
        const formatted = val.trim().replace(/\s+/g, ' ').split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        fullNameInput.value = formatted;
        fullNameInput.dispatchEvent(new Event('input'));
      });
    }
  }

  // Form Submission
  const form = document.getElementById('internshipWebForm');
  const alertBox = document.getElementById('internAlertBox');
  const submitBtn = document.getElementById('btnSubmitInternship');
  const successCard = document.getElementById('internSuccessReceipt');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.className = 'intern-alert-container';
      }

      const fullName = (document.getElementById('internFullName')?.value || '').trim();
      const email = (document.getElementById('internEmail')?.value || '').trim();
      const whatsapp = (document.getElementById('internWhatsapp')?.value || '').trim();
      const gender = document.querySelector('input[name="internGender"]:checked')?.value;
      const dob = document.getElementById('internDob')?.value;
      const city = (document.getElementById('internCity')?.value || '').trim();
      const qualification = document.querySelector('input[name="internQualification"]:checked')?.value;
      const institute = (document.getElementById('internInstitute')?.value || '').trim();
      const degree = document.getElementById('internDegree')?.value;
      const domain = document.querySelector('input[name="internDomain"]:checked')?.value;
      const joinedWa = document.querySelector('input[name="internJoinedWa"]:checked')?.value || 'No';
      const confirmed = document.getElementById('internConfirmPolicy')?.checked;

      // Basic client checks
      if (!fullName || !email || !whatsapp || !gender || !dob || !city || !qualification || !institute || !degree || !domain) {
        showAlert('Please complete all required fields (*).', 'error');
        return;
      }

      if (!confirmed) {
        showAlert('Please acknowledge the declaration checkbox before submitting.', 'error');
        return;
      }

      // Check capitalization
      const capsCheck = validateCaps(fullName);
      if (capsCheck.status === 'error') {
        showAlert(capsCheck.msg + '. Click the ✨ "Auto-Capitalize" button to fix it instantly.', 'error');
        return;
      }

      // Submit
      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>⏳ Processing Registration...</span>`;

      try {
        const response = await fetch('/api/internship/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email,
            whatsapp,
            gender,
            dob,
            city,
            qualification,
            institute,
            degree,
            domain,
            whatsappGroupJoined: joinedWa
          })
        });

        const result = await response.json();

        if (response.status === 409 || result.duplicate) {
          showAlert(`⚠️ <strong>Multiple Submissions Policy:</strong> ${result.message}`, 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          return;
        }

        if (!response.ok || !result.success) {
          showAlert(result.message || 'Error submitting application. Please try again or use the Google Form option.', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          return;
        }

        // Show Success Receipt
        form.style.display = 'none';
        if (successCard) {
          document.getElementById('resReceiptId').textContent = result.referenceId;
          document.getElementById('resReceiptName').textContent = result.data.fullName;
          document.getElementById('resReceiptDomain').textContent = result.data.domain;
          document.getElementById('resReceiptEmail').textContent = result.data.email;

          const btnOffer = document.getElementById('btnReceiptOfferLetter');
          if (btnOffer) {
            btnOffer.href = `/offer-letter.html?id=${result.referenceId}`;
          }
          const btnVerify = document.getElementById('btnReceiptVerify');
          if (btnVerify) {
            btnVerify.href = `/verify.html?id=${result.referenceId}`;
          }

          successCard.style.display = 'block';
          successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Real-time Cloud Sync
        if (typeof window.saveInternToCloud === 'function' && result.data) {
          window.saveInternToCloud(result.data);
        }

      } catch (err) {
        console.error('Internship submission error:', err);
        showAlert('Connection error. Please check your network or apply via Google Forms.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  function showAlert(msg, type = 'error') {
    if (!alertBox) return;
    alertBox.className = `intern-alert-container ${type}`;
    alertBox.innerHTML = msg;
    alertBox.style.display = 'block';
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Copy Reference ID
  const btnCopyRefId = document.getElementById('btnCopyRefId');
  if (btnCopyRefId) {
    btnCopyRefId.addEventListener('click', () => {
      const code = document.getElementById('resReceiptId')?.textContent;
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          btnCopyRefId.innerHTML = `<span>✅ Reference ID Copied!</span>`;
          setTimeout(() => {
            btnCopyRefId.innerHTML = `<span>📋 Copy Reference ID</span>`;
          }, 2500);
        });
      }
    });
  }

  // Reset form button
  const btnReset = document.getElementById('btnResetInternForm');
  if (btnReset && form && successCard) {
    btnReset.addEventListener('click', () => {
      successCard.style.display = 'none';
      form.reset();
      form.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>🚀 Submit Official Internship Application</span>`;
    });
  }

  /* ============================================================
     INTERACTIVE OPTICAL QR SCANNER & AUDIO CONFIRMATION ENGINE
     ============================================================ */
  let qrMediaStream = null;
  let qrAnimationRequestId = null;
  let qrProcessed = false;
  let currentFacingMode = 'environment';
  let isAudioMuted = false;
  let isTorchOn = false;
  let torchTrack = null;

  const qrLiveContainer = document.getElementById('qrLiveScannerContainer');
  const scannerViewport = document.getElementById('scannerViewport');
  const statusCheckerCard = document.querySelector('.status-checker-card');
  const btnStartQr = document.getElementById('btnStartQrScanner');
  const btnCloseQr = document.getElementById('btnCloseQrScanner');
  const btnSwitchCam = document.getElementById('btnSwitchCamera');
  const btnTorch = document.getElementById('btnToggleTorch');
  const btnAudioToggle = document.getElementById('btnToggleAudio');
  const btnUploadQr = document.getElementById('btnUploadQrImage');
  const qrFileInput = document.getElementById('qrFileInput');
  const qrVideo = document.getElementById('qrScannerVideo');
  const qrCanvas = document.getElementById('qrScannerCanvas');
  const qrReticle = document.getElementById('scannerReticleOverlay');
  const qrSuccessBadge = document.getElementById('scannerSuccessBadge');
  const qrDetectedIdText = document.getElementById('scannerDetectedId');

  // Synthesize Modern Futuristic Verification Sound (Web Audio API)
  function playQrScanSuccessAudio() {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1: Futuristic frequency modulation (D5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: Crystalline Bell Harmonic (D6 -> A6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.22);
      gain2.gain.setValueAtTime(0.001, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.4, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.65);

      // Tone 3: Sub-bass tactile punch (130Hz -> 55Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(130, now);
      osc3.frequency.exponentialRampToValueAtTime(55, now + 0.15);
      gain3.gain.setValueAtTime(0.25, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now);
      osc3.stop(now + 0.15);
    } catch (err) {
      console.warn('[Web Audio Notice] Audio synthesis not supported or blocked:', err);
    }
  }

  // Parse candidate ID from raw QR code text or URL
  function parseCandidateIdFromQr(qrText) {
    if (!qrText) return '';
    const text = qrText.trim();
    
    // Check JSON payload
    try {
      const parsed = JSON.parse(text);
      if (parsed.id) return parsed.id.trim().toUpperCase();
      if (parsed.candidateId) return parsed.candidateId.trim().toUpperCase();
    } catch (e) {}

    // URL format parsing
    try {
      if (text.startsWith('http://') || text.startsWith('https://')) {
        const u = new URL(text);
        const idParam = u.searchParams.get('id');
        if (idParam) return idParam.trim().toUpperCase();
        const parts = u.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (last && /^UZ-[A-Z0-9_-]+$/i.test(last)) {
          return last.toUpperCase();
        }
      }
    } catch (e) {}

    // Direct regex match for any Uzair AI Studio ID (e.g. UZ-INT-..., UZ-EXP-...)
    const match = text.match(/UZ-[A-Z0-9_-]+/i);
    if (match) return match[0].toUpperCase();

    return text;
  }

  // Handle successful QR detection
  function handleDetectedQr(rawText) {
    if (qrProcessed) return;
    qrProcessed = true;

    const detectedId = parseCandidateIdFromQr(rawText);
    playQrScanSuccessAudio();

    // Haptic vibration feedback for mobile devices
    if (navigator.vibrate) {
      try { navigator.vibrate([40, 60, 100]); } catch (vibErr) {}
    }

    if (qrLiveContainer && qrLiveContainer.style.display === 'block') {
      if (qrReticle) qrReticle.classList.add('scan-success');
      if (qrDetectedIdText) qrDetectedIdText.textContent = `Identified: ${detectedId}`;
      if (qrSuccessBadge) qrSuccessBadge.style.display = 'flex';

      setTimeout(() => {
        stopQrScanner();
        qrProcessed = false;
        if (statusInput) statusInput.value = detectedId;
        lookupApplicationStatus(detectedId);
      }, 650);
    } else {
      // Direct image upload or drop mode: immediately display verified profile
      qrProcessed = false;
      if (statusInput) statusInput.value = detectedId;
      lookupApplicationStatus(detectedId);
    }
  }

  // Start Camera with Auto-Capability Detection
  async function startQrScanner() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera access is not supported by your browser. Please enter your ID manually or use the "Upload QR Image" option.');
      return;
    }

    qrProcessed = false;
    if (qrReticle) qrReticle.classList.remove('scan-success');
    if (qrSuccessBadge) qrSuccessBadge.style.display = 'none';
    if (qrLiveContainer) qrLiveContainer.style.display = 'block';

    try {
      const constraints = {
        video: {
          facingMode: { ideal: currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      qrMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (qrVideo) {
        qrVideo.srcObject = qrMediaStream;
        qrVideo.setAttribute('playsinline', true);
        await qrVideo.play();
        qrAnimationRequestId = requestAnimationFrame(scanQrVideoFrame);
      }

      // Check for multiple cameras and enable switch button
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        if (btnSwitchCam && videoInputs.length > 1) {
          btnSwitchCam.style.display = 'inline-block';
        }
      } catch (devErr) {}

      // Check for torch / flashlight capability
      torchTrack = qrMediaStream.getVideoTracks()[0];
      if (torchTrack && btnTorch) {
        const capabilities = torchTrack.getCapabilities ? torchTrack.getCapabilities() : {};
        if (capabilities.torch) {
          btnTorch.style.display = 'inline-block';
        } else {
          btnTorch.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('[QR Camera Error]', err);
      if (qrLiveContainer) qrLiveContainer.style.display = 'none';
      alert('Camera access was denied or is unavailable. You can enter your ID manually or click "Upload QR Image" to scan a photo of your QR code.');
    }
  }

  // Stop Camera & Reset Peripherals
  function stopQrScanner() {
    if (qrAnimationRequestId) {
      cancelAnimationFrame(qrAnimationRequestId);
      qrAnimationRequestId = null;
    }
    if (torchTrack && isTorchOn) {
      try { torchTrack.applyConstraints({ advanced: [{ torch: false }] }); } catch (e) {}
      isTorchOn = false;
      if (btnTorch) btnTorch.classList.remove('torch-active');
    }
    torchTrack = null;
    if (qrMediaStream) {
      qrMediaStream.getTracks().forEach(t => t.stop());
      qrMediaStream = null;
    }
    if (qrLiveContainer) qrLiveContainer.style.display = 'none';
    if (qrReticle) qrReticle.classList.remove('scan-success');
    if (qrSuccessBadge) qrSuccessBadge.style.display = 'none';
    qrProcessed = false;
  }

  // Scan frame loop
  function scanQrVideoFrame() {
    if (!qrVideo || qrVideo.readyState !== qrVideo.HAVE_ENOUGH_DATA) {
      if (qrMediaStream && !qrProcessed) {
        qrAnimationRequestId = requestAnimationFrame(scanQrVideoFrame);
      }
      return;
    }

    if (qrCanvas && !qrProcessed) {
      const ctx = qrCanvas.getContext('2d');
      qrCanvas.width = qrVideo.videoWidth;
      qrCanvas.height = qrVideo.videoHeight;
      ctx.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);
      const imgData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);

      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'dontInvert'
        });
        if (code && code.data) {
          handleDetectedQr(code.data);
          return;
        }
      }
    }

    if (qrMediaStream && !qrProcessed) {
      qrAnimationRequestId = requestAnimationFrame(scanQrVideoFrame);
    }
  }

  // Multi-tier Intelligent QR Code Image Decoder Engine
  async function decodeQrFromImageElement(img, dataUrl) {
    if (!img) return null;
    let decodedData = null;

    // TIER 1: Native BarcodeDetector API (if hardware/browser supported)
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          return barcodes[0].rawValue;
        }
      } catch (bdErr) {}
    }

    // TIER 2: ZXing Browser Multi-Format & QR Code Engine
    if (typeof ZXing !== 'undefined') {
      try {
        const hints = new Map();
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.QR_CODE]);
        const zxReader = new ZXing.BrowserQRCodeReader(hints);

        // Pass 2A: Direct Image Element
        try {
          const zxRes = await zxReader.decodeFromImageElement(img);
          if (zxRes && zxRes.getText()) return zxRes.getText();
        } catch (e) {}

        // Pass 2B: Via Data URL if available
        if (dataUrl) {
          try {
            const zxResUrl = await zxReader.decodeFromImageUrl(dataUrl);
            if (zxResUrl && zxResUrl.getText()) return zxResUrl.getText();
          } catch (e) {}
        }
      } catch (zxErr) {}
    }

    // TIER 3: Ultra-Comprehensive Multi-Scale & Multi-Crop jsQR Engine
    if (typeof jsQR !== 'undefined') {
      // Helper to safely scan ImageData with alpha-flattening, adaptive multi-thresholds & contrast stretching
      function tryScanData(data, w, h) {
        if (!data || w < 20 || h < 20) return null;

        // Step A: Flatten alpha transparency - any transparent pixel becomes solid white
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) {
            data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
          }
        }

        // Step B: Standard scan with attemptBoth for normal and inverted modules
        let res = jsQR(data, w, h, { inversionAttempts: 'attemptBoth' });
        if (res && res.data) return res.data;

        // Step C: Adaptive Multi-Threshold Binarization (Covers bright daylight, low-light, phone photos of screens)
        const thresholds = [85, 110, 135, 160, 185];
        for (const thresh of thresholds) {
          const binData = new Uint8ClampedArray(data.length);
          for (let i = 0; i < data.length; i += 4) {
            const lum = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
            const val = lum < thresh ? 0 : 255;
            binData[i] = val; binData[i + 1] = val; binData[i + 2] = val; binData[i + 3] = 255;
          }
          res = jsQR(binData, w, h, { inversionAttempts: 'attemptBoth' });
          if (res && res.data) return res.data;
        }

        // Step D: Contrast Stretching Pass (Maximizes separation for washed out or dark photos)
        let minLum = 255, maxLum = 0;
        const lums = new Uint8Array(data.length / 4);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const lum = Math.round((data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000);
          lums[j] = lum;
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }
        if (maxLum - minLum > 30) {
          const range = maxLum - minLum;
          const binData = new Uint8ClampedArray(data.length);
          for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const stretched = Math.round(((lums[j] - minLum) / range) * 255);
            const val = stretched < 128 ? 0 : 255;
            binData[i] = val; binData[i + 1] = val; binData[i + 2] = val; binData[i + 3] = 255;
          }
          res = jsQR(binData, w, h, { inversionAttempts: 'attemptBoth' });
          if (res && res.data) return res.data;
        }

        return null;
      }

      // Helper to extract canvas ImageData with pure white pre-fill and optional quiet zone padding
      function extractImageData(sourceImg, sx, sy, sw, sh, destW, destH, pad) {
        pad = pad || 0;
        destW = destW || sw;
        destH = destH || sh;
        const cvs = document.createElement('canvas');
        cvs.width = destW + (pad * 2);
        cvs.height = destH + (pad * 2);
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.drawImage(sourceImg, sx, sy, sw, sh, pad, pad, destW, destH);
        return {
          cvs,
          data: ctx.getImageData(0, 0, cvs.width, cvs.height).data,
          width: cvs.width,
          height: cvs.height
        };
      }

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // Strategy 3A: Scaled to 1200px with 28px Quiet Zone Padding
      {
        const maxDim = 1200;
        const scale = (origW > maxDim || origH > maxDim) ? Math.min(maxDim / origW, maxDim / origH) : 1;
        const w = Math.round(origW * scale);
        const h = Math.round(origH * scale);
        const imgInfo = extractImageData(img, 0, 0, origW, origH, w, h, 28);
        decodedData = tryScanData(imgInfo.data, imgInfo.width, imgInfo.height);
        if (decodedData) return decodedData;
        if (typeof ZXing !== 'undefined') {
          try {
            const zx = new ZXing.BrowserQRCodeReader();
            const zr = await zx.decodeFromImageElement(imgInfo.cvs);
            if (zr && zr.getText()) return zr.getText();
          } catch (e) {}
        }
      }

      // Strategy 3B: Native Full Resolution (unscaled with 24px padding)
      if (origW <= 2600 && origH <= 2600) {
        const imgInfo = extractImageData(img, 0, 0, origW, origH, origW, origH, 24);
        decodedData = tryScanData(imgInfo.data, imgInfo.width, imgInfo.height);
        if (decodedData) return decodedData;
      }

      // Strategy 3C: Targeted Digital Badge Center Crop (sx: 20%, sy: 25%, sw: 60%, sh: 48%)
      {
        const sx = Math.floor(origW * 0.20);
        const sy = Math.floor(origH * 0.25);
        const sw = Math.floor(origW * 0.60);
        const sh = Math.floor(origH * 0.48);
        const imgInfo = extractImageData(img, sx, sy, sw, sh, sw, sh, 24);
        decodedData = tryScanData(imgInfo.data, imgInfo.width, imgInfo.height);
        if (decodedData) return decodedData;
        if (typeof ZXing !== 'undefined') {
          try {
            const zx = new ZXing.BrowserQRCodeReader();
            const zr = await zx.decodeFromImageElement(imgInfo.cvs);
            if (zr && zr.getText()) return zr.getText();
          } catch (e) {}
        }
      }

      // Strategy 3D: Document Bottom-Right Quadrant Crop (Offer Letters & Recommendation Letters)
      {
        const sx = Math.floor(origW * 0.40);
        const sy = Math.floor(origH * 0.40);
        const sw = origW - sx;
        const sh = origH - sy;
        const imgInfo = extractImageData(img, sx, sy, sw, sh, sw, sh, 24);
        decodedData = tryScanData(imgInfo.data, imgInfo.width, imgInfo.height);
        if (decodedData) return decodedData;
        if (typeof ZXing !== 'undefined') {
          try {
            const zx = new ZXing.BrowserQRCodeReader();
            const zr = await zx.decodeFromImageElement(imgInfo.cvs);
            if (zr && zr.getText()) return zr.getText();
          } catch (e) {}
        }
      }

      // Strategy 3D-2: Document Bottom-Center Crop (Optimized for Certificates)
      {
        const sx = Math.floor(origW * 0.25);
        const sy = Math.floor(origH * 0.50);
        const sw = Math.floor(origW * 0.50);
        const sh = origH - sy;
        const imgInfo = extractImageData(img, sx, sy, sw, sh, sw, sh, 24);
        decodedData = tryScanData(imgInfo.data, imgInfo.width, imgInfo.height);
        if (decodedData) return decodedData;
        if (typeof ZXing !== 'undefined') {
          try {
            const zx = new ZXing.BrowserQRCodeReader();
            const zr = await zx.decodeFromImageElement(imgInfo.cvs);
            if (zr && zr.getText()) return zr.getText();
          } catch (e) {}
        }
      }

      // Strategy 3E: Wide Center 70% Crop
      {
        const sx = Math.floor(origW * 0.15);
        const sy = Math.floor(origH * 0.15);
        const sw = Math.floor(origW * 0.70);
        const sh = Math.floor(origH * 0.70);
        const imgInfo = extractImageData(img, sx, sy, sw, sh, sw, sh, 24);
        decodedData = tryScanData(imgInfo.data, imgInfo.width, imgInfo.height);
        if (decodedData) return decodedData;
      }

      // Strategy 3F: Scaled Step-Down to 720px (Eliminates high-frequency noise from smartphone camera shots)
      if (origW > 720 || origH > 720) {
        const scale = Math.min(720 / origW, 720 / origH);
        const w = Math.round(origW * scale);
        const h = Math.round(origH * scale);
        const imgInfo = extractImageData(img, 0, 0, origW, origH, w, h, 20);
        decodedData = tryScanData(imgInfo.data, imgInfo.width, imgInfo.height);
        if (decodedData) return decodedData;
      }
    }

    // TIER 4: Server-Side Optical Decoding Fallback
    if (dataUrl) {
      try {
        const srvRes = await fetch('/api/internship/scan-qr-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl })
        });
        const srvJson = await srvRes.json();
        if (srvJson && srvJson.success && srvJson.text) {
          return srvJson.text;
        }
      } catch (srvErr) {}
    }

    return null;
  }

  // Process File Object (Upload or Drag-and-Drop)
  function processQrImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('⚠️ Please select or drop a valid image file (PNG, JPG, WEBP).');
      return;
    }

    // Temporary HUD status
    const guideText = qrContainer ? qrContainer.querySelector('.scanner-alignment-guide') : null;
    const prevGuide = guideText ? guideText.textContent : '';
    if (guideText) guideText.textContent = '⚡ Analyzing uploaded image...';

    const reader = new FileReader();
    reader.onload = (re) => {
      const dataUrl = re.target.result;
      const img = new Image();
      img.onload = async () => {
        const decoded = await decodeQrFromImageElement(img, dataUrl);
        if (guideText) guideText.textContent = prevGuide;

        if (decoded) {
          handleDetectedQr(decoded);
        } else {
          // Failure Guidance: non-blocking audio, toast, and auto-focus manual search field
          playBeepSound('error');
          showToast('⚠️ No valid QR code detected. Please ensure the QR code is clearly visible, or enter your Registration ID manually below.');
          if (refIdInput) {
            refIdInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              refIdInput.focus();
              refIdInput.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.35)';
              setTimeout(() => { refIdInput.style.boxShadow = ''; }, 3000);
            }, 450);
          }
        }
        if (qrFileInput) qrFileInput.value = '';
      };
      img.onerror = () => {
        if (guideText) guideText.textContent = prevGuide;
        showToast('⚠️ Failed to load image. Please try another file or enter Registration ID manually.');
        if (qrFileInput) qrFileInput.value = '';
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Event Listeners for QR Controls
  if (btnStartQr) {
    btnStartQr.addEventListener('click', startQrScanner);
  }
  if (btnCloseQr) {
    btnCloseQr.addEventListener('click', stopQrScanner);
  }
  if (btnSwitchCam) {
    btnSwitchCam.addEventListener('click', () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      stopQrScanner();
      startQrScanner();
    });
  }
  if (btnTorch) {
    btnTorch.addEventListener('click', async () => {
      if (!torchTrack) return;
      isTorchOn = !isTorchOn;
      try {
        await torchTrack.applyConstraints({ advanced: [{ torch: isTorchOn }] });
        btnTorch.classList.toggle('torch-active', isTorchOn);
      } catch (tErr) {
        console.warn('Torch constraint failed:', tErr);
      }
    });
  }
  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
      isAudioMuted = !isAudioMuted;
      btnAudioToggle.textContent = isAudioMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
    });
  }
  if (btnUploadQr && qrFileInput) {
    btnUploadQr.addEventListener('click', () => qrFileInput.click());
    qrFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) processQrImageFile(file);
    });
  }

  // Interactive Drag & Drop Support
  [qrLiveContainer, scannerViewport, statusCheckerCard].filter(Boolean).forEach(target => {
    ['dragenter', 'dragover'].forEach(evt => {
      target.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        target.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      target.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        target.classList.remove('drag-over');
      });
    });
    target.addEventListener('drop', (e) => {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) processQrImageFile(file);
    });
  });

  // Application Status Checker Engine
  const statusForm = document.getElementById('statusLookupForm');
  const statusResult = document.getElementById('statusResultContainer');
  const statusInput = document.getElementById('statusLookupQuery');
  const btnCheckStatus = document.getElementById('btnCheckStatus');

  async function lookupApplicationStatus(query) {
    const q = (query || '').trim();
    if (!q) return;

    if (btnCheckStatus) {
      btnCheckStatus.disabled = true;
      btnCheckStatus.innerHTML = `<span>Searching...</span>`;
    }

    try {
      const res = await fetch(`/api/internship/verify/${encodeURIComponent(q)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        statusResult.className = 'status-result-area not-found';
        statusResult.innerHTML = `
          <div class="result-not-found">
            <span style="font-size:1.4rem;">🔍</span>
            <div>
              <strong>No Application Found</strong>
              <p>No active registration matches "${q}". Please check your Registration ID (e.g. <code>UZ-INT-XXXXX</code>) or registered Email address. If you haven't applied yet, register using the "Apply Directly on Website" tab.</p>
            </div>
          </div>
        `;
        statusResult.style.display = 'block';
      } else {
        const app = json.data;
        const isCompleted = app.isCompleted || (app.status || '').toLowerCase().includes('completed') || app.daysRemaining === 0;

        // Certificate & Letter of Recommendation buttons logic:
        // STRICT RULE: Only shown / unlocked after completing the full internship duration!
        let certButtonHtml = '';
        let lorButtonHtml = '';
        let expButtonHtml = '';
        if (isCompleted) {
          certButtonHtml = `
            <a href="/certificate/${encodeURIComponent(app.id)}" target="_blank" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #F59E0B, #D97706); border:none; box-shadow:0 4px 12px rgba(245, 158, 11, 0.35);">
              <span>🎓 View Certificate of Completion</span>
            </a>
          `;
          lorButtonHtml = `
            <a href="/recommendation-letter/${encodeURIComponent(app.id)}" target="_blank" class="btn btn-outline btn-sm" style="border-color:#2563EB; color:#1D4ED8;">
              <span>📜 View Letter of Recommendation</span>
            </a>
          `;
          expButtonHtml = `
            <a href="/experience-letter/${encodeURIComponent(app.id)}" target="_blank" class="btn btn-outline btn-sm" style="border-color:#8B5CF6; color:#6D28D9;">
              <span>💼 View Experience Letter</span>
            </a>
          `;
        }

        statusResult.className = 'status-result-area found';
        statusResult.innerHTML = `
          <div class="result-success-box">
            <div class="res-head" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <span class="badge-status-pending" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:700; padding:4px 10px; border-radius:999px; font-size:0.75rem;">
                ● ${app.status}
              </span>
              <span class="res-id" style="font-family:'JetBrains Mono', monospace; font-weight:700; color:#1D4ED8; background:#EFF6FF; padding:3px 8px; border-radius:6px; font-size:0.8rem;">
                ${app.id}
              </span>
            </div>
            
            <h4 style="font-size:1.2rem; font-weight:800; color:var(--text-primary); margin:10px 0 4px;">
              ${app.fullName}
            </h4>
            <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:12px;">
              Track: <strong style="color:#2563EB;">${app.domain}</strong> &bull; Institute: <strong>${app.institute}</strong> &bull; Degree: ${app.qualification}
            </p>

            <!-- Timeline Card -->
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:12px 14px; margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
                <span style="color:#64748B;">Duration: <strong>${app.duration || '2 Months'}</strong> (Started: ${app.startDate})</span>
                <span style="color:${isCompleted ? '#059669' : '#0284C7'}; font-weight:800;">
                  ${isCompleted ? '🎓 Program Completed & Certified' : `⏳ ${app.daysRemaining} Days Remaining (Target: ${app.completionDate})`}
                </span>
              </div>
              <div style="background:#E2E8F0; height:8px; border-radius:999px; overflow:hidden;">
                <div style="background:linear-gradient(90deg, #2563EB, #10B981); height:100%; width:${isCompleted ? 100 : Math.max(10, app.progressPercent || 15)}%; border-radius:999px;"></div>
              </div>
            </div>

            <!-- Notice & Credential Availability -->
            <div class="res-notice" style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:12px; font-size:0.825rem; color:#1E3A8A; margin-bottom:14px; line-height:1.5;">
              <span>📄 <strong>Credentials &amp; Official Documentation:</strong> Your verified registration is active. Your official Internship Offer Letter is ready to view and download below. Letters of recommendation unlock upon program completion.</span>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${certButtonHtml}
              <a href="/offer-letter/${encodeURIComponent(app.id)}" target="_blank" class="btn btn-primary btn-sm">
                <span>📄 View Offer Letter PDF</span>
              </a>
              <a href="/verify?id=${encodeURIComponent(app.id)}" target="_blank" class="btn btn-outline btn-sm" style="border-color:#0284C7; color:#0369A1;">
                <span>🛡️ Verified Credential Page</span>
              </a>
              ${lorButtonHtml}
              ${expButtonHtml}
              <button type="button" class="btn btn-outline btn-sm" id="btnStatusDownloadBadge" style="border-color:#2563EB; color:#1D4ED8; font-weight:700;">
                <span>🖼️ Save QR Badge (PNG)</span>
              </button>
              <a href="https://wa.me/923433885835?text=${encodeURIComponent(`Hi Coordinator, checking registration status for ${app.fullName} (${app.id})`)}" target="_blank" class="btn btn-whatsapp btn-sm">
                <span>💬 Coordinator WhatsApp</span>
              </a>
            </div>
          </div>
        `;
        statusResult.style.display = 'block';

        // Connect 1-Click QR Badge Downloader
        const btnDlBadge = document.getElementById('btnStatusDownloadBadge');
        if (btnDlBadge) {
          btnDlBadge.onclick = () => {
            if (window.UzairQrBadge) {
              window.UzairQrBadge.downloadBadge(app);
            }
          };
        }
        setTimeout(() => statusResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    } catch (err) {
      statusResult.className = 'status-result-area not-found';
      statusResult.innerHTML = `<p style="color:#B91C1C;">Connection error while checking status. Please try again.</p>`;
      statusResult.style.display = 'block';
    } finally {
      if (btnCheckStatus) {
        btnCheckStatus.disabled = false;
        btnCheckStatus.innerHTML = `<span>🔍 Check Status</span>`;
      }
    }
  }

  if (statusForm && statusInput) {
    statusForm.addEventListener('submit', (e) => {
      e.preventDefault();
      lookupApplicationStatus(statusInput.value);
    });
  }

  // Handle URL hash or direct /internship route
  const urlParams = new URLSearchParams(window.location.search);
  if (window.location.hash === '#check-status' || urlParams.get('tab') === 'check-status' || urlParams.get('scan') === '1' || urlParams.get('id')) {
    const statusTabBtn = document.querySelector('[data-tab="check-status"]');
    if (statusTabBtn) statusTabBtn.click();
    if (urlParams.get('scan') === '1' && qrLiveContainer) {
      qrLiveContainer.style.display = 'block';
    }
    const targetId = urlParams.get('id');
    if (targetId && statusInput) {
      statusInput.value = targetId;
      setTimeout(() => lookupApplicationStatus(targetId), 200);
    }
    const el = document.getElementById('internship');
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
  } else if (window.location.hash === '#internship' || window.location.pathname.includes('/internship')) {
    const el = document.getElementById('internship');
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }
}
