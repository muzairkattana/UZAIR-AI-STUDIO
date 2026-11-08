/**
 * Uzair AI Studio • Intern Portal Controller
 * Executive Light-Theme Client Engine with PWA Installation,
 * Sequential 8-Week Curriculum, and Document Recovery Vault.
 */

(function () {
  'use strict';

  // Storage Keys
  const TOKEN_KEY = 'uzair_intern_token';

  // DOM Elements - Auth & Gateways
  const authSection = document.getElementById('authSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const tabBtnLogin = document.getElementById('tabBtnLogin');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authAlert = document.getElementById('authAlert');
  const regClosedAlert = document.getElementById('regClosedAlert');
  const regClosedMsg = document.getElementById('regClosedMsg');
  const regFieldsContainer = document.getElementById('regFieldsContainer');

  // DOM Elements - User Header Pill
  const userHeaderPill = document.getElementById('userHeaderPill');
  const headerUserName = document.getElementById('headerUserName');
  const headerUserId = document.getElementById('headerUserId');
  const headerUserAvatar = document.getElementById('headerUserAvatar');
  const btnLogout = document.getElementById('btnLogout');

  // DOM Elements - PWA & Install
  const pwaBanner = document.getElementById('pwaBanner');
  const btnInstallApp = document.getElementById('btnInstallApp');
  const btnCloseBanner = document.getElementById('btnCloseBanner');
  const iosModal = document.getElementById('iosModal');
  const btnCloseIosModal = document.getElementById('btnCloseIosModal');

  // State
  let currentIntern = null;
  let currentCurriculum = null;
  let deferredPrompt = null;

  // ============================================================
  // 1. PWA INSTALLATION & SERVICE WORKER
  // ============================================================
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('[SW] ServiceWorker registration skipped:', err);
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaBanner) pwaBanner.style.display = 'flex';
  });

  if (btnInstallApp) {
    btnInstallApp.addEventListener('click', async () => {
      // Check iOS Safari
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIos) {
        if (iosModal) iosModal.style.display = 'flex';
        return;
      }

      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (pwaBanner) pwaBanner.style.display = 'none';
        }
        deferredPrompt = null;
      } else {
        alert('To install this app:\n\n• On Chrome/Android: Tap three dots (⋮) and select "Add to Home screen"\n• On iOS Safari: Tap Share (📤) and select "Add to Home Screen"');
      }
    });
  }

  if (btnCloseBanner) {
    btnCloseBanner.addEventListener('click', () => {
      if (pwaBanner) pwaBanner.style.display = 'none';
    });
  }

  if (btnCloseIosModal) {
    btnCloseIosModal.addEventListener('click', () => {
      if (iosModal) iosModal.style.display = 'none';
    });
  }

  // ============================================================
  // DIRECT IN-PAGE PRINT ENGINE & TOAST NOTIFICATION
  // ============================================================
  let portalToastTimer = null;
  function showPortalToast(msg, type = 'info') {
    const toast = document.getElementById('portalToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `portal-toast show ${type}`;
    if (portalToastTimer) clearTimeout(portalToastTimer);
    portalToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  window.directPrintDocument = function(rawUrl, docTitle, candidateName, shouldAutoPrint = false, showToast = true) {
    if (!rawUrl || rawUrl === '#' || rawUrl.endsWith('#')) {
      showPortalToast('Document link is not ready yet.', 'warning');
      return;
    }

    const cleanTitle = docTitle || 'Official Document';
    const modal = document.getElementById('docPrintModal');
    const modalTitle = document.getElementById('docPrintModalTitle');
    const iframe = document.getElementById('docPrintIframe');
    const loader = document.getElementById('docPrintLoading');
    const btnPrint = document.getElementById('btnTriggerModalPrint');
    const btnOpenTab = document.getElementById('btnDocPrintOpenTab');
    const btnClose = document.getElementById('btnCloseDocPrintModal');
    const backdrop = document.getElementById('docPrintBackdrop');

    if (!modal || !iframe) {
      window.open(rawUrl, '_blank');
      return;
    }

    if (modalTitle) modalTitle.textContent = cleanTitle;
    if (btnOpenTab) btnOpenTab.href = rawUrl;
    if (loader) loader.style.display = 'flex';
    modal.style.display = 'flex';

    let autoPrinted = false;
    const triggerPrint = () => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
      } catch (err) {
        console.warn('In-modal print notice:', err);
      }
    };

    if (btnPrint) {
      btnPrint.onclick = () => triggerPrint();
    }

    const closeModal = () => {
      modal.style.display = 'none';
      if (iframe) {
        iframe.removeAttribute('srcdoc');
        iframe.src = 'about:blank';
      }
    };

    if (btnClose) btnClose.onclick = closeModal;
    if (backdrop) backdrop.onclick = closeModal;

    const escListener = (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);

    iframe.onload = () => {
      if (loader) loader.style.display = 'none';
      if (shouldAutoPrint && !autoPrinted) {
        autoPrinted = true;
        setTimeout(triggerPrint, 400);
      }
    };

    if (rawUrl.startsWith('srcdoc:')) {
      const htmlContent = rawUrl.substring(7);
      iframe.removeAttribute('src');
      iframe.srcdoc = htmlContent;
      if (btnOpenTab) {
        btnOpenTab.style.display = 'none';
      }
    } else {
      if (btnOpenTab) btnOpenTab.style.display = 'inline-flex';
      const sep = rawUrl.includes('?') ? '&' : '?';
      iframe.removeAttribute('srcdoc');
      iframe.src = `${rawUrl}${sep}ts=${Date.now()}`;
    }
    if (showToast) {
      showPortalToast(`Rendering ${cleanTitle}...`, 'info');
    }
  };

  // Dedicated in-portal HTML document print trigger (Offline-ready)
  window.printDocumentContentInPortal = function(htmlContent, docTitle) {
    window.directPrintDocument(`srcdoc:${htmlContent}`, docTitle);
  };

  // ============================================================
  // 2. AUTHENTICATION & SESSION MANAGEMENT
  // ============================================================
  function showAuthAlert(msg, type = 'error') {
    if (!authAlert) return;
    authAlert.className = `auth-alert ${type}`;
    authAlert.textContent = msg;
    authAlert.style.display = 'block';
  }

  function clearAuthAlert() {
    if (authAlert) authAlert.style.display = 'none';
  }

  // Toggle Login vs Register Tabs
  if (tabBtnLogin && tabBtnRegister) {
    tabBtnLogin.addEventListener('click', () => {
      tabBtnLogin.classList.add('active');
      tabBtnRegister.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      clearAuthAlert();
    });

    tabBtnRegister.addEventListener('click', () => {
      tabBtnRegister.classList.add('active');
      tabBtnLogin.classList.remove('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      clearAuthAlert();
      checkPublicRegistrationStatus();
    });
  }

  // Check Admin Registration Settings Gate
  async function checkPublicRegistrationStatus() {
    try {
      const res = await fetch('/api/internship/settings');
      const json = await res.json();
      if (json && json.success && json.settings) {
        const active = json.settings.registrationActive;
        if (!active) {
          if (regClosedAlert) regClosedAlert.style.display = 'block';
          if (regClosedMsg) regClosedMsg.textContent = json.settings.closedMessage || 'Registrations for new interns are currently paused by administration.';
          if (regFieldsContainer) {
            regFieldsContainer.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
          }
        } else {
          if (regClosedAlert) regClosedAlert.style.display = 'none';
          if (regFieldsContainer) {
            regFieldsContainer.querySelectorAll('input, select, button').forEach(el => el.disabled = false);
          }
        }
      }
    } catch (e) {}
  }

  // Handle Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlert();
      const emailOrId = document.getElementById('loginEmailOrId').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      const btn = document.getElementById('btnLoginSubmit');

      btn.disabled = true;
      btn.innerHTML = '<span>Verifying credentials...</span>';

      try {
        const res = await fetch('/api/intern-portal/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrId, password })
        });
        const json = await res.json();

        if (res.ok && json.success && json.token) {
          localStorage.setItem(TOKEN_KEY, json.token);
          currentIntern = json.intern;
          if (window.UzairLocalDB) {
            window.UzairLocalDB.saveInternSession(currentIntern, json.token);
          }
          renderAuthenticatedPortal();
        } else {
          showAuthAlert(json.message || 'Invalid email or password.', 'error');
        }
      } catch (err) {
        showAuthAlert('Network error connecting to portal server. Please retry.', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In to Intern Portal &rarr;</span>';
      }
    });
  }

  // Handle Registration Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlert();

      const fullName = document.getElementById('regFullName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value.trim();
      const domain = document.getElementById('regDomain').value;
      const whatsapp = document.getElementById('regWhatsapp').value.trim();
      const institute = document.getElementById('regInstitute').value.trim();
      const degree = document.getElementById('regDegree').value.trim();
      const city = document.getElementById('regCity').value.trim();
      const durationEl = document.getElementById('regDuration');
      const trackDuration = durationEl ? durationEl.value : '2 Months';
      const btn = document.getElementById('btnRegisterSubmit');

      btn.disabled = true;
      btn.innerHTML = '<span>Creating your account...</span>';

      try {
        const res = await fetch('/api/intern-portal/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email,
            password,
            domain,
            trackDuration,
            whatsapp,
            institute,
            degree,
            city
          })
        });
        const json = await res.json();

        if (res.ok && json.success && json.token) {
          localStorage.setItem(TOKEN_KEY, json.token);
          currentIntern = json.intern;
          if (window.UzairLocalDB) {
            window.UzairLocalDB.saveInternSession(currentIntern, json.token);
          }
          renderAuthenticatedPortal();
        } else {
          showAuthAlert(json.message || 'Error creating account.', 'error');
        }
      } catch (err) {
        showAuthAlert('Network error creating account. Please retry.', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Create Account &amp; Launch Portal &rarr;</span>';
      }
    });
  }

  // Logout Handler
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      localStorage.removeItem(TOKEN_KEY);
      document.body.classList.remove('portal-authenticated');
      const mobileAppBar = document.getElementById('mobileAppBar');
      if (mobileAppBar) {
        mobileAppBar.style.setProperty('display', 'none', 'important');
        mobileAppBar.style.setProperty('visibility', 'hidden', 'important');
      }
      const headerDesktopNav = document.getElementById('headerDesktopNav');
      if (headerDesktopNav) {
        headerDesktopNav.style.setProperty('display', 'none', 'important');
      }
      if (window.UzairLocalDB) {
        await window.UzairLocalDB.clearInternSession();
      }
      currentIntern = null;
      window.location.reload();
    });
  }

  // Password Visibility Toggles
  function setupPasswordToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
          btn.setAttribute('aria-label', 'Hide password');
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
          btn.setAttribute('aria-label', 'Show password');
        }
      });
    }
  }

  setupPasswordToggle('btnToggleLoginPass', 'loginPassword');
  setupPasswordToggle('btnToggleRegPass', 'regPassword');
  setupPasswordToggle('btnToggleCurrentPass', 'inputCurrentPassword');
  setupPasswordToggle('btnToggleNewPass', 'inputNewPassword');

  // ============================================================
  // 3. NAVIGATION VIEW SWITCHER (HEADER DESKTOP NAV & MOBILE APP BAR)
  // ============================================================
  function switchPortalView(targetViewId) {
    if (!targetViewId) return;

    // Ensure dashboardSection is visible when switching portal views
    const dashSec = document.getElementById('dashboardSection');
    if (dashSec) {
      dashSec.style.setProperty('display', 'block', 'important');
    }

    // Hide all portal view panes
    document.querySelectorAll('.portal-view-pane').forEach(v => {
      v.style.setProperty('display', 'none', 'important');
    });
    
    // Show target view
    const target = document.getElementById(targetViewId);
    if (target) {
      target.style.setProperty('display', 'block', 'important');
      target.style.visibility = 'visible';
      target.style.opacity = '1';
    }

    // Update Desktop Header Nav Buttons
    document.querySelectorAll('.header-nav-btn').forEach(btn => {
      if (btn.dataset.view === targetViewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Mobile App Bar Items
    document.querySelectorAll('.app-bar-item').forEach(item => {
      if (item.dataset.view === targetViewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Dynamically repopulate view if needed
    try {
      if (targetViewId === 'viewVault' && typeof populateDocumentVault === 'function') {
        populateDocumentVault();
      } else if (targetViewId === 'viewSettings' && typeof populateSettingsView === 'function') {
        populateSettingsView();
      } else if (targetViewId === 'viewCurriculum' && typeof loadAndRenderCurriculum === 'function') {
        loadAndRenderCurriculum();
      }
    } catch (viewErr) {
      console.warn('[Intern Portal] View refresh notice:', viewErr);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Expose globally so onclick="switchPortalView('...')" works immediately
  window.switchPortalView = switchPortalView;

  // Global delegation for all nav triggers
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('.header-nav-btn, .dash-tab-btn, .app-bar-item');
    if (navBtn && navBtn.dataset.view) {
      e.preventDefault();
      switchPortalView(navBtn.dataset.view);
    }
  });

  // ============================================================
  // 3. CANDIDATE PROFILE DETAILS MODAL
  // ============================================================
  function openInternProfileModal() {
    if (!currentIntern) return;
    const modal = document.getElementById('internProfileModal');
    if (!modal) return;

    const initials = (currentIntern.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarEl = document.getElementById('profileModalAvatar');
    if (avatarEl) avatarEl.textContent = initials;

    document.getElementById('profileModalName').textContent = currentIntern.fullName || 'Candidate';
    document.getElementById('profileModalId').textContent = currentIntern.id || '-';
    document.getElementById('profileModalEmail').textContent = currentIntern.email || '-';
    document.getElementById('profileModalWhatsapp').textContent = currentIntern.whatsapp || '-';
    document.getElementById('profileModalDomain').textContent = currentIntern.domain || '-';
    
    const trackDuration = currentIntern.trackDuration || (currentIntern.duration && currentIntern.duration.includes('6') ? '6 Months (24 Weeks)' : '2 Months (8 Weeks)');
    document.getElementById('profileModalTrack').textContent = `${trackDuration} • ${currentIntern.isCompleted ? 'Completed' : `${internDays || 60} Days Remaining`}`;
    
    document.getElementById('profileModalInstitute').textContent = currentIntern.institute || 'N/A';
    document.getElementById('profileModalDegree').textContent = currentIntern.degree || 'N/A';
    document.getElementById('profileModalStartDate').textContent = currentIntern.startDate || '-';
    document.getElementById('profileModalEndDate').textContent = currentIntern.completionDate || '-';

    const statusBanner = document.getElementById('profileModalStatusText');
    if (statusBanner) {
      statusBanner.textContent = currentIntern.isCompleted
        ? '🎓 Certified Graduate • Official Credentials Awarded'
        : `🟢 Active Verified Candidate • Remote Fellowship (${trackDuration})`;
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
  }

  function closeInternProfileModal() {
    const modal = document.getElementById('internProfileModal');
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 220);
  }

  // Wire profile modal buttons
  const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
  if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', closeInternProfileModal);

  const btnProfileClose = document.getElementById('btnProfileClose');
  if (btnProfileClose) btnProfileClose.addEventListener('click', closeInternProfileModal);

  const btnCopyProfileId = document.getElementById('btnCopyProfileId');
  if (btnCopyProfileId) {
    btnCopyProfileId.addEventListener('click', () => {
      if (currentIntern?.id) {
        navigator.clipboard.writeText(currentIntern.id);
        alert(`Candidate ID Copied: ${currentIntern.id}`);
      }
    });
  }

  const btnProfileGoSettings = document.getElementById('btnProfileGoSettings');
  if (btnProfileGoSettings) {
    btnProfileGoSettings.addEventListener('click', () => {
      closeInternProfileModal();
      const tabSettings = document.querySelector('[data-view="viewSettings"]');
      if (tabSettings) tabSettings.click();
    });
  }

  const internProfileModal = document.getElementById('internProfileModal');
  if (internProfileModal) {
    internProfileModal.addEventListener('click', (e) => {
      if (e.target === internProfileModal) closeInternProfileModal();
    });
  }

  // ============================================================
  // 4. PORTAL POPULATION & RENDERING
  // ============================================================
  function renderAuthenticatedPortal() {
    if (!currentIntern) return;

    document.body.classList.add('portal-authenticated');
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    if (userHeaderPill) {
      userHeaderPill.style.display = 'flex';
      userHeaderPill.style.cursor = 'pointer';
      userHeaderPill.title = 'Click to view full candidate profile';
      userHeaderPill.onclick = (e) => {
        if (e.target && e.target.id === 'btnLogout') return;
        openInternProfileModal();
      };
    }

    const internNotifWrap = document.getElementById('internNotifWrap');
    if (internNotifWrap) internNotifWrap.style.display = 'inline-flex';

    const headerNav = document.getElementById('headerDesktopNav');
    const mobileAppBar = document.getElementById('mobileAppBar');
    function syncNavbars() {
      if (window.innerWidth > 768) {
        if (headerNav) headerNav.style.setProperty('display', 'inline-flex', 'important');
        if (mobileAppBar) {
          mobileAppBar.style.setProperty('display', 'none', 'important');
          mobileAppBar.style.setProperty('visibility', 'hidden', 'important');
        }
      } else {
        if (headerNav) headerNav.style.setProperty('display', 'none', 'important');
        if (mobileAppBar && document.body.classList.contains('portal-authenticated')) {
          mobileAppBar.style.setProperty('display', 'flex', 'important');
          mobileAppBar.style.setProperty('visibility', 'visible', 'important');
        }
      }
    }
    syncNavbars();
    window.addEventListener('resize', syncNavbars);

    if (window.UzairNotifications) {
      window.UzairNotifications.initBell({
        bellBtnId: 'notifBellBtnIntern',
        badgeId: 'notifBadgeCountIntern',
        dropdownId: 'notifCenterIntern',
        role: 'intern'
      });
      window.UzairNotifications.startPolling('intern');
    }

    // Populate Header & Connect Profile Click Trigger
    if (headerUserName) headerUserName.textContent = currentIntern.fullName;
    if (headerUserId) headerUserId.textContent = currentIntern.id;
    if (headerUserAvatar) {
      const initials = (currentIntern.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      headerUserAvatar.textContent = initials;
      headerUserAvatar.style.cursor = 'pointer';
      headerUserAvatar.title = 'Click to view full candidate profile';
      headerUserAvatar.onclick = (e) => {
        e.stopPropagation();
        openInternProfileModal();
      };
    }

    // Populate Hero & Metrics
    const isCompleted = currentIntern.isCompleted;
    const nameEl = document.getElementById('dashCandidateName');
    if (nameEl) nameEl.textContent = currentIntern.fullName;

    const domainEl = document.getElementById('dashDomainPill');
    if (domainEl) domainEl.textContent = `Track: ${currentIntern.domain}`;

    const idTextEl = document.getElementById('dashIdText');
    if (idTextEl) idTextEl.textContent = currentIntern.id;
    const idPill = document.getElementById('dashIdPill');
    if (idPill) {
      idPill.onclick = () => {
        navigator.clipboard.writeText(currentIntern.id).then(() => {
          showPortalToast(`Candidate ID ${currentIntern.id} copied!`, 'info');
        }).catch(() => {});
      };
    }

    const durEl = document.getElementById('dashTrackDuration');
    if (durEl) {
      const dur = currentIntern.trackDuration || currentIntern.duration || '2 Months';
      durEl.textContent = dur.includes('6') ? '🏆 24 Weeks (6 Months Fellowship Track)' : '⚡ 8 Weeks (2 Months Sprint Track)';
    }

    const statusEl = document.getElementById('dashStatusPill');
    if (statusEl) {
      statusEl.textContent = isCompleted ? '🎓 Certified Graduate' : '🟢 Active Remote Intern';
      statusEl.className = isCompleted ? 'welcome-pill-v2 pill-status completed' : 'welcome-pill-v2 pill-status';
    }

    const btnProfile = document.getElementById('btnWelcomeProfile');
    if (btnProfile) {
      btnProfile.onclick = () => openInternProfileModal();
    }

    const currentWeekNum = currentIntern.tasksProgress ? currentIntern.tasksProgress.currentWeek : 1;
    document.getElementById('statCurriculumWeek').textContent = isCompleted ? 'Week 8 / 8' : `Week ${currentWeekNum} / 8`;
    
    const progressPct = isCompleted ? 100 : (currentIntern.progressPercent || Math.round((currentWeekNum / 8) * 100));
    document.getElementById('statProgressPct').textContent = `${progressPct}% Completed`;
    document.getElementById('statProgressBar').style.width = `${progressPct}%`;

    document.getElementById('statDaysRemaining').textContent = isCompleted ? 'Completed' : `${internDays} Days`;
    document.getElementById('statTimelineTarget').textContent = `Target: ${currentIntern.completionDate}`;

    const completedTasksCount = (currentIntern.tasksProgress && currentIntern.tasksProgress.completedTasks) ? currentIntern.tasksProgress.completedTasks.length : 0;
    document.getElementById('statTasksCount').textContent = `${completedTasksCount} / 16`;

    const credStatusEl = document.getElementById('statCredentialStatus');
    if (credStatusEl) {
      const isSixMonthTrack = Boolean(currentIntern.isSixMonthTrack || (String(currentIntern.trackDuration || currentIntern.duration || '').includes('6')));
      if (isCompleted) {
        credStatusEl.textContent = isSixMonthTrack ? 'All Credentials & Exp Letter Ready' : 'Completion Credentials Ready';
        credStatusEl.style.color = '#059669';
      } else {
        credStatusEl.textContent = 'Offer Letter Ready';
        credStatusEl.style.color = '#0F172A';
      }
    }

    // Populate Verified Digital Badge Preview
    document.getElementById('badgeName').textContent = currentIntern.fullName;
    document.getElementById('badgeId').textContent = currentIntern.id;
    document.getElementById('badgeDomain').textContent = currentIntern.domain;
    
    const verifyLink = `${window.location.origin}/verify?id=${encodeURIComponent(currentIntern.id)}`;
    const btnVerifyLink = document.getElementById('btnBadgeVerifyLink');
    if (btnVerifyLink) btnVerifyLink.href = verifyLink;

    const btnCopyBadge = document.getElementById('btnCopyBadgeLink');
    if (btnCopyBadge) {
      btnCopyBadge.addEventListener('click', () => {
        navigator.clipboard.writeText(verifyLink);
        alert(`Copied official verification link:\n${verifyLink}`);
      });
    }

    // Render Badge QR Code
    const qrBox = document.getElementById('badgeQrCodeBox');
    if (qrBox && window.QRCode) {
      qrBox.innerHTML = '';
      try {
        new QRCode(qrBox, {
          text: verifyLink,
          width: 80,
          height: 80,
          colorDark: '#0F172A',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (qrErr) {}
    }

    // Populate Document Vault
    populateDocumentVault();

    // Populate Settings View Profile
    populateSettingsView();

    // Load & Render 8-Week Curriculum
    loadAndRenderCurriculum();
  }

  // Populate Document Vault Cards
  function populateDocumentVault() {
    if (!currentIntern) return;
    const isCompleted = Boolean(currentIntern.isCompleted);
    const internDays = (currentIntern.daysRemaining !== undefined && currentIntern.daysRemaining !== null) ? currentIntern.daysRemaining : (currentIntern.isCompleted ? 0 : 60);

    // Offer Letter
    const btnOffer = document.getElementById('btnVaultOffer');
    if (btnOffer) {
      const offerUrl = `/offer-letter/${encodeURIComponent(currentIntern.id)}`;
      btnOffer.href = offerUrl;
      btnOffer.innerHTML = '<span>🖨️ Direct Print Offer Letter</span>';
      btnOffer.onclick = (e) => {
        e.preventDefault();
        window.directPrintDocument(offerUrl, 'Internship Offer Letter', currentIntern.fullName, true);
      };
    }

    // Letter of Recommendation
    const btnLor = document.getElementById('btnVaultLor');
    const badgeLor = document.getElementById('vaultLorBadge');
    const descLor = document.getElementById('vaultLorDesc');
    if (isCompleted) {
      badgeLor.className = 'vault-card-badge badge-unlocked';
      badgeLor.textContent = '✓ Officially Awarded';
      descLor.textContent = 'Official Letter of Recommendation issued and signed by Founder Muhammad Uzair.';
      btnLor.className = 'vault-btn primary';
      const lorUrl = `/recommendation-letter/${encodeURIComponent(currentIntern.id)}`;
      btnLor.href = lorUrl;
      btnLor.innerHTML = '<span>🖨️ Direct Print LOR</span>';
      btnLor.onclick = (e) => {
        e.preventDefault();
        window.directPrintDocument(lorUrl, 'Letter of Recommendation (LOR)', currentIntern.fullName, true);
      };
    } else {
      badgeLor.className = 'vault-card-badge badge-locked';
      badgeLor.textContent = `🔒 Time-Locked (${internDays} days remaining)`;
      descLor.textContent = `Unlocks automatically upon completing your 8-week curriculum (${internDays} days remaining).`;
      btnLor.className = 'vault-btn locked';
      btnLor.removeAttribute('href');
      btnLor.innerHTML = '<span>🔒 Locked Until Program Completion</span>';
      btnLor.onclick = (e) => {
        e.preventDefault();
        alert(`🔒 Letter of Recommendation Notice:\n\nOfficial Letters of Recommendation are awarded exclusively upon successful completion of your 8-week internship curriculum.\n\n• Candidate: ${currentIntern.fullName}\n• Days Remaining: ${internDays}\n• Target Completion: ${currentIntern.completionDate}`);
      };
    }

    // Certificate of Completion
    const btnCert = document.getElementById('btnVaultCert');
    const badgeCert = document.getElementById('vaultCertBadge');
    const descCert = document.getElementById('vaultCertDesc');
    if (isCompleted) {
      badgeCert.className = 'vault-card-badge badge-unlocked';
      badgeCert.textContent = '✓ Officially Awarded';
      descCert.textContent = 'Official Certificate of Completion with gold ribbon seal, dual signatures, and live QR verification.';
      btnCert.className = 'vault-btn primary';
      const certUrl = `/certificate/${encodeURIComponent(currentIntern.id)}`;
      btnCert.href = certUrl;
      btnCert.innerHTML = '<span>🖨️ Direct Print Certificate</span>';
      btnCert.onclick = (e) => {
        e.preventDefault();
        window.directPrintDocument(certUrl, 'Certificate of Completion', currentIntern.fullName, true);
      };
    } else {
      badgeCert.className = 'vault-card-badge badge-locked';
      badgeCert.textContent = `🔒 Time-Locked (${internDays} days remaining)`;
      descCert.textContent = `Unlocks automatically upon completing your 8-week curriculum (${internDays} days remaining).`;
      btnCert.className = 'vault-btn locked';
      btnCert.removeAttribute('href');
      btnCert.innerHTML = '<span>🔒 Locked Until Program Completion</span>';
      btnCert.onclick = (e) => {
        e.preventDefault();
        alert(`🔒 Certificate of Completion Notice:\n\nOfficial graduation certificates are unlocked exclusively upon completing your full 8-week duration.\n\n• Days Remaining: ${internDays}\n• Target Date: ${currentIntern.completionDate}`);
      };
    }

    // Experience Letter (Strictly unlocked ONLY for 6-Month Track upon completing 6 months)
    const btnExp = document.getElementById('btnVaultExp');
    const badgeExp = document.getElementById('vaultExpBadge');
    const descExp = document.getElementById('vaultExpDesc');
    const isSixMonthTrack = Boolean(currentIntern.isSixMonthTrack || (String(currentIntern.trackDuration || currentIntern.duration || '').includes('6')));

    if (isCompleted && isSixMonthTrack) {
      badgeExp.className = 'vault-card-badge badge-unlocked';
      badgeExp.textContent = '✓ Officially Awarded';
      descExp.textContent = 'Official 6-month software engineering experience credential signed by Lead Architect Muhammad Uzair.';
      btnExp.className = 'vault-btn primary';
      btnExp.style.background = 'linear-gradient(135deg, #090D16 0%, #0F172A 50%, #1E293B 100%)';
      const expUrl = `/experience-letter/${encodeURIComponent(currentIntern.id)}`;
      btnExp.href = expUrl;
      btnExp.innerHTML = '<span>🖨️ Direct Print Experience Letter</span>';
      btnExp.onclick = (e) => {
        e.preventDefault();
        window.directPrintDocument(expUrl, 'Experience Letter', currentIntern.fullName, true);
      };
    } else if (isSixMonthTrack) {
      badgeExp.className = 'vault-card-badge badge-locked';
      badgeExp.textContent = `🔒 Time-Locked (${internDays || 180} days remaining)`;
      descExp.textContent = `Unlocks automatically upon completing your full 6-month (24-week) Fellowship Track (${internDays || 180} days remaining).`;
      btnExp.className = 'vault-btn locked';
      btnExp.removeAttribute('href');
      btnExp.innerHTML = '<span>🔒 Locked Until 6th Month Completion</span>';
      btnExp.onclick = (e) => {
        e.preventDefault();
        alert(`🔒 6-Month Experience Letter Notice:\n\nExperience letters substantiate 6-month software engineering contributions and unlock automatically upon completing your 6-month duration.\n\n• Days Remaining: ${internDays || 180}\n• Target Completion: ${currentIntern.completionDate || '6 Months'}`);
      };
    } else {
      // 2-Month sprint track - not enrolled in 6-month fellowship
      badgeExp.className = 'vault-card-badge badge-locked';
      badgeExp.textContent = '🔒 6-Month Track Only';
      descExp.textContent = 'The official Software Engineering Experience Letter is designated exclusively for candidates enrolled in the 6-Month Fellowship Track.';
      btnExp.className = 'vault-btn locked';
      btnExp.removeAttribute('href');
      btnExp.innerHTML = '<span>🔒 Enrolled in 2-Month Sprint Track</span>';
      btnExp.onclick = (e) => {
        e.preventDefault();
        alert('🔒 Experience Letter Notice:\n\nYou are enrolled in the 2-Month Sprint Track.\n\nOfficial Experience Letters are awarded exclusively to candidates enrolled in the 6-Month Fellowship Track after completing their full 6-month tenure.\n\nYour 2-Month credentials include:\n• Official Offer Letter (Ready)\n• Certificate of Completion (Unlocks upon completion)\n• Letter of Recommendation (Unlocks upon completion)');
      };
    }
  }

  // Populate Settings View
  function populateSettingsView() {
    if (!currentIntern) return;
    const setSafeText = (id, val, fallback = 'N/A') => {
      const el = document.getElementById(id);
      if (el) el.textContent = (val !== undefined && val !== null && val !== '') ? val : fallback;
    };
    setSafeText('settingsCurrentEmail', currentIntern.email, '-');
    setSafeText('profName', currentIntern.fullName, '-');
    setSafeText('profId', currentIntern.id, '-');
    setSafeText('profDomain', currentIntern.domain, '-');
    setSafeText('profInstitute', currentIntern.institute, 'N/A');
    setSafeText('profDegree', currentIntern.degree, 'N/A');
    setSafeText('profWa', currentIntern.whatsapp, 'N/A');
    setSafeText('profStartDate', currentIntern.startDate, '-');
    setSafeText('profEndDate', currentIntern.completionDate, '-');
  }

  // Settings Forms Listeners
  const formUpdateEmail = document.getElementById('formUpdateEmail');
  const formUpdatePassword = document.getElementById('formUpdatePassword');
  const settingsAlert = document.getElementById('settingsAlert');

  function showSettingsAlert(msg, type = 'success') {
    if (!settingsAlert) return;
    settingsAlert.className = `auth-alert ${type}`;
    settingsAlert.textContent = msg;
    settingsAlert.style.display = 'block';
    setTimeout(() => { settingsAlert.style.display = 'none'; }, 4500);
  }

  if (formUpdateEmail) {
    formUpdateEmail.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem(TOKEN_KEY);
      const newEmail = document.getElementById('inputNewEmail').value.trim();

      try {
        const res = await fetch('/api/intern-portal/update-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ newEmail })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          currentIntern = json.intern;
          populateSettingsView();
          document.getElementById('inputNewEmail').value = '';
          showSettingsAlert('Email address successfully updated!', 'success');
        } else {
          showSettingsAlert(json.message || 'Error updating email.', 'error');
        }
      } catch (err) {
        showSettingsAlert('Network error updating email.', 'error');
      }
    });
  }

  if (formUpdatePassword) {
    formUpdatePassword.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem(TOKEN_KEY);
      const currentPassword = document.getElementById('inputCurrentPassword').value.trim();
      const newPassword = document.getElementById('inputNewPassword').value.trim();

      try {
        const res = await fetch('/api/intern-portal/update-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          currentIntern = json.intern;
          document.getElementById('inputCurrentPassword').value = '';
          document.getElementById('inputNewPassword').value = '';
          showSettingsAlert('Password changed successfully!', 'success');
        } else {
          showSettingsAlert(json.message || 'Error changing password.', 'error');
        }
      } catch (err) {
        showSettingsAlert('Network error changing password.', 'error');
      }
    });
  }

  // ============================================================
  // 5. 8-WEEK SEQUENTIAL CURRICULUM & TASK ACTIONS
  // ============================================================
  async function loadAndRenderCurriculum() {
    const container = document.getElementById('curriculumContainer');
    if (!container) return;
    if (!currentIntern) {
      // Try restoring session from local storage / DB
      const token = localStorage.getItem(TOKEN_KEY);
      if (window.UzairLocalDB) {
        try {
          const sess = await window.UzairLocalDB.getInternSession();
          if (sess && sess.profile) currentIntern = sess.profile;
        } catch (e) {}
      }
    }
    if (!currentIntern) return;

    try {
      const domainQuery = encodeURIComponent(currentIntern.domain || '');
      const durationQuery = encodeURIComponent(currentIntern.trackDuration || currentIntern.duration || '');
      const res = await fetch(`/api/intern-portal/curriculum?domain=${domainQuery}&duration=${durationQuery}`);
      const json = await res.json();
      if (json && json.success && json.curriculum) {
        currentCurriculum = json.curriculum;
        try {
          localStorage.setItem(`uzair_cached_curriculum_${currentIntern.domain}`, JSON.stringify(currentCurriculum));
        } catch (e) {}
        renderCurriculumWeeks(currentCurriculum.weeks);
        return;
      }
    } catch (e) {
      console.warn('[Curriculum] Network fetch failed, checking offline cache...');
    }

    // Offline cache fallback from localStorage
    try {
      const cached = localStorage.getItem(`uzair_cached_curriculum_${currentIntern.domain}`) || localStorage.getItem('uzair_cached_curriculum');
      if (cached) {
        currentCurriculum = JSON.parse(cached);
        renderCurriculumWeeks(currentCurriculum.weeks);
        return;
      }
    } catch (cacheErr) {}

    container.innerHTML = '<div style="padding:20px; color:#EF4444; text-align:center;">Failed to load curriculum. Please connect to internet to download initial curriculum data.</div>';
  }

  function renderCurriculumWeeks(weeks) {
    const container = document.getElementById('curriculumContainer');
    if (!container || !weeks) return;

    const tp = currentIntern.tasksProgress || {
      currentWeek: 1,
      completedWeeks: [],
      completedTasks: [],
      submissions: {}
    };

    const completedTasks = tp.completedTasks || [];
    const completedWeeks = tp.completedWeeks || [];
    const activeWeekNum = tp.currentWeek || 1;

    container.innerHTML = weeks.map(w => {
      const weekNum = w.weekNumber;
      
      // Strict Sequential Unlock Rule:
      // Week 1 is always unlocked.
      // Week N is unlocked ONLY IF Week N-1 is in completedWeeks!
      const isUnlocked = weekNum === 1 || completedWeeks.includes(weekNum - 1) || currentIntern.isCompleted;
      const isDone = completedWeeks.includes(weekNum) || currentIntern.isCompleted;

      let cardClass = 'week-card';
      if (isDone) cardClass += ' done-week';
      else if (isUnlocked && weekNum === activeWeekNum) cardClass += ' active-week';
      else if (!isUnlocked) cardClass += ' locked-week';

      const tasksHtml = w.tasks.map(t => {
        const isTaskDone = completedTasks.includes(t.id) || isDone;
        const subData = (tp.submissions && tp.submissions[t.id]) ? tp.submissions[t.id] : { link: '', notes: '' };

        return `
          <div class="task-item ${isTaskDone ? 'completed' : ''}" id="taskItem_${t.id}">
            <div class="task-top-row">
              <input type="checkbox" class="task-checkbox" id="chk_${t.id}" data-task="${t.id}" data-week="${weekNum}" ${isTaskDone ? 'checked' : ''} ${!isUnlocked ? 'disabled' : ''}>
              <div class="task-content" style="flex:1;">
                <h4>${t.title}</h4>
                <p>${t.description}</p>
                <div style="font-size:0.75rem; color:#64748B; margin-top:4px;">
                  Deliverable: <strong style="color:#0284C7;">${t.deliverableType}</strong> &bull; <em>${t.hint || ''}</em>
                </div>
                <div class="task-actions-row">
                  <button type="button" class="btn-view-task-assignment" onclick="window.viewTaskAssignmentDoc(${weekNum}, '${t.id}')">
                    <span>📜 View Task Assignment</span>
                  </button>
                  <button type="button" class="btn-view-task-guide" onclick="window.triggerTaskGuide(${weekNum}, '${t.id}')">
                    <span>📋 Quick Specification &amp; Code</span>
                  </button>
                </div>
              </div>
            </div>

            ${isUnlocked ? `
              <div class="task-deliverable-box">
                <input type="text" class="task-deliverable-input" id="link_${t.id}" placeholder="GitHub Link / Deployment URL" value="${subData.link || ''}">
                <button type="button" class="btn-save-task" onclick="window.saveTaskDeliverable('${t.id}', ${weekNum})">Save Deliverable</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      return `
        <div class="${cardClass}" id="weekCard_${weekNum}">
          <div class="week-header" onclick="window.toggleWeekAccordion(${weekNum})">
            <div class="week-title-box">
              <div class="week-num-badge ${isDone ? 'done' : ''}">
                ${isDone ? '✓' : (isUnlocked ? weekNum : '🔒')}
              </div>
              <div>
                <h3>Week ${weekNum}: ${w.title}</h3>
                <p>${w.summary}</p>
              </div>
            </div>
            <div style="text-align:right;">
              <span class="vault-card-badge ${isDone ? 'badge-unlocked' : (isUnlocked ? 'badge-unlocked' : 'badge-locked')}">
                ${isDone ? '✓ Completed' : (isUnlocked ? 'In Progress' : '🔒 Locked')}
              </span>
            </div>
          </div>

          <div class="week-body" id="weekBody_${weekNum}" style="${isUnlocked ? 'display:block;' : 'display:none;'}">
            <div style="margin-bottom:12px; font-size:0.8rem; color:#475569;">
              <strong>🎯 Week Objectives:</strong>
              <ul style="padding-left:18px; margin-top:4px;">
                ${w.objectives.map(obj => `<li>${obj}</li>`).join('')}
              </ul>
            </div>
            <div class="tasks-list">
              ${tasksHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach checkbox event listeners
    document.querySelectorAll('.task-checkbox').forEach(chk => {
      chk.addEventListener('change', async () => {
        const taskId = chk.dataset.task;
        const weekNum = parseInt(chk.dataset.week, 10);
        const completed = chk.checked;
        await submitTaskAction(taskId, weekNum, completed);
      });
    });
  }

  // ============================================================
  // TASK SPECIFICATION & ARCHITECTURE BLUEPRINT PRINTABLE PDF ENGINE (OFFLINE)
  // ============================================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.generateTaskSpecPdfHtml = function (weekNum, weekTitle, task, intern) {
    const candidateName = intern?.fullName || 'Engineering Intern';
    const candidateId = intern?.id || 'UAIS-INT-CANDIDATE';
    const domainTrack = intern?.domain || 'Software Engineering & AI';
    const trackDuration = intern?.trackDuration || intern?.duration || '8 Weeks (2 Months)';
    const taskTitle = task?.title || 'Technical Sprint Milestone';
    const taskDesc = task?.description || '';
    const deliverable = task?.deliverableType || 'GitHub Repository & Working Implementation';
    const hint = task?.hint || 'Follow production-grade clean code conventions.';
    const tools = task?.tools || ['Git', 'VS Code', 'Modern Engineering Runtime'];
    const steps = task?.steps || [
      'Review engineering specifications and establish clean repository structure.',
      'Implement modular architecture and robust error handling.',
      'Write comprehensive unit tests ensuring high code coverage.',
      'Submit GitHub pull request link through private intern portal.'
    ];
    const codeSnippet = task?.codeTemplate || '';
    const criteria = task?.acceptanceCriteria || [
      'Production-grade implementation with zero unhandled exceptions.',
      'Documented README with installation, architecture diagram, and execution guide.',
      'Unit tests passing successfully before pull request submission.'
    ];

    const todayDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const verifyUrl = `${window.location.origin}/verify?id=${encodeURIComponent(candidateId)}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Task Blueprint - Week ${weekNum}: ${escapeHtml(taskTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 14mm 14mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0F172A;
    background: #FFFFFF;
    line-height: 1.5;
    font-size: 13px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-wrapper {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    background: #FFFFFF;
    position: relative;
  }
  @media print {
    body {
      background: #FFFFFF !important;
    }
    .doc-wrapper {
      border: none !important;
      padding: 0 !important;
      max-width: 100% !important;
    }
    .no-print {
      display: none !important;
    }
  }
  /* Executive Header */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0F172A;
    padding-bottom: 14px;
    margin-bottom: 16px;
  }
  .doc-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .doc-brand-logo {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #0F172A;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-weight: 800;
    font-size: 18px;
    border: 2px solid #334155;
  }
  .doc-brand-info h1 {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0F172A;
    line-height: 1.1;
  }
  .doc-brand-info h1 span {
    color: #0F172A;
  }
  .doc-brand-info p {
    font-size: 11px;
    font-weight: 600;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 2px;
  }
  .doc-meta-badge {
    text-align: right;
  }
  .doc-spec-badge {
    display: inline-block;
    background: #F1F5F9;
    border: 1px solid #CBD5E1;
    color: #0F172A;
    font-size: 11px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .doc-date {
    font-size: 11px;
    color: #64748B;
    font-weight: 500;
  }

  /* Candidate Context Bar */
  .candidate-table {
    width: 100%;
    border-collapse: collapse;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 18px;
    font-size: 11.5px;
  }
  .candidate-table td {
    padding: 7px 12px;
    border: 1px solid #E2E8F0;
  }
  .candidate-table .lbl {
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.05em;
    background: #F1F5F9;
    width: 18%;
  }
  .candidate-table .val {
    font-weight: 700;
    color: #0F172A;
    width: 32%;
  }

  /* Task Banner */
  .task-banner {
    background: linear-gradient(135deg, #090D16 0%, #0F172A 50%, #1E293B 100%);
    color: #FFFFFF;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 18px;
  }
  .task-banner .sprint-tag {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #94A3B8;
    margin-bottom: 4px;
  }
  .task-banner h2 {
    font-size: 18px;
    font-weight: 800;
    line-height: 1.25;
    color: #FFFFFF;
    margin-bottom: 6px;
  }
  .task-banner p {
    font-size: 12px;
    color: #E2E8F0;
    line-height: 1.45;
  }

  /* Section Styles */
  .section-block {
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #1E293B;
    border-left: 3px solid #0F172A;
    padding-left: 8px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .section-title span.badge {
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
    color: #475569;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: none;
  }

  /* Deliverable Card */
  .deliverable-callout {
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-left: 4px solid #16A34A;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 14px;
    font-size: 12px;
  }
  .deliverable-callout strong {
    color: #15803D;
  }
  .deliverable-callout em {
    color: #475569;
    font-style: normal;
  }

  /* Tools Tags */
  .tools-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }
  .tool-tag {
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    color: #1E293B;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 5px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Steps List */
  .steps-ol {
    padding-left: 20px;
    margin-bottom: 14px;
    color: #334155;
    font-size: 12px;
  }
  .steps-ol li {
    margin-bottom: 6px;
    line-height: 1.45;
  }

  /* Code Scaffolding Box */
  .code-pre {
    background: #0B1120;
    color: #38BDF8;
    border: 1px solid #1E293B;
    border-radius: 8px;
    padding: 12px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    line-height: 1.5;
    overflow-x: auto;
    margin-bottom: 14px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Criteria List */
  .criteria-ul {
    list-style: none;
    padding: 0;
    margin-bottom: 14px;
  }
  .criteria-ul li {
    position: relative;
    padding-left: 20px;
    margin-bottom: 6px;
    font-size: 12px;
    color: #334155;
    line-height: 1.4;
  }
  .criteria-ul li::before {
    content: "✓";
    position: absolute;
    left: 0;
    top: 0;
    color: #16A34A;
    font-weight: 900;
    font-size: 12px;
  }

  /* Verification Footer & Signoff */
  .doc-footer {
    border-top: 1px solid #E2E8F0;
    padding-top: 14px;
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .eval-signoff {
    font-size: 11px;
    color: #475569;
    line-height: 1.4;
  }
  .eval-signoff strong {
    color: #0F172A;
    font-size: 12px;
  }
  .verification-seal {
    text-align: right;
    font-size: 10px;
    color: #64748B;
  }
  .verification-seal strong {
    color: #0F172A;
    font-size: 11px;
    display: block;
  }
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 60px;
    font-weight: 900;
    color: rgba(15, 23, 42, 0.035);
    letter-spacing: 0.15em;
    pointer-events: none;
    white-space: nowrap;
    text-transform: uppercase;
  }
</style>
</head>
<body>
<div class="doc-wrapper">
  <div class="watermark">UZAIR AI STUDIO • OFFICIAL</div>

  <!-- Header -->
  <div class="doc-header">
    <div class="doc-brand">
      <div class="doc-brand-logo">UA</div>
      <div class="doc-brand-info">
        <h1>Uzair <span>AI Studio</span></h1>
        <p>Software Engineering &bull; Task Specification Guide</p>
      </div>
    </div>
    <div class="doc-meta-badge">
      <div class="doc-spec-badge">Sprint Task Guide &bull; Week ${weekNum}</div>
      <div class="doc-date">Generated: ${todayDate}</div>
    </div>
  </div>

  <!-- Candidate Context Table -->
  <table class="candidate-table">
    <tr>
      <td class="lbl">Candidate</td>
      <td class="val">${escapeHtml(candidateName)}</td>
      <td class="lbl">Candidate ID</td>
      <td class="val" style="font-family:'JetBrains Mono',monospace; color:#0F172A;">${escapeHtml(candidateId)}</td>
    </tr>
    <tr>
      <td class="lbl">Specialization</td>
      <td class="val">${escapeHtml(domainTrack)}</td>
      <td class="lbl">Tenure Track</td>
      <td class="val">${escapeHtml(trackDuration)}</td>
    </tr>
    <tr>
      <td class="lbl">Milestone</td>
      <td class="val">Week ${weekNum}: ${escapeHtml(weekTitle)}</td>
      <td class="lbl">Lead Mentor</td>
      <td class="val">Muhammad Uzair (Founder & Lead Architect)</td>
    </tr>
  </table>

  <!-- Task Banner -->
  <div class="task-banner">
    <div class="sprint-tag">Sprint Task Specification • ID: ${escapeHtml(task?.id || 'TASK-SPEC')}</div>
    <h2>${escapeHtml(taskTitle)}</h2>
    <p>${escapeHtml(taskDesc)}</p>
  </div>

  <!-- Deliverable Specification -->
  <div class="deliverable-callout">
    <strong>🎯 Required Deliverable:</strong> ${escapeHtml(deliverable)}<br>
    <em>💡 Architectural Hint: ${escapeHtml(hint)}</em>
  </div>

  <!-- Tools & Tech Stack -->
  <div class="section-block">
    <div class="section-title">Required Technology Stack &amp; Tools</div>
    <div class="tools-list">
      ${tools.map(tool => `<span class="tool-tag">${escapeHtml(tool)}</span>`).join('')}
    </div>
  </div>

  <!-- Step-by-Step Implementation Roadmap -->
  <div class="section-block">
    <div class="section-title">Step-by-Step Engineering Roadmap</div>
    <ol class="steps-ol">
      ${steps.map(st => `<li>${escapeHtml(st)}</li>`).join('')}
    </ol>
  </div>

  ${codeSnippet ? `
  <!-- Starter Code & Architectural Scaffolding -->
  <div class="section-block">
    <div class="section-title">Architectural Starter Pattern / Code Template</div>
    <pre class="code-pre">${escapeHtml(codeSnippet)}</pre>
  </div>
  ` : ''}

  <!-- Acceptance Criteria -->
  <div class="section-block">
    <div class="section-title">Acceptance &amp; Evaluation Criteria</div>
    <ul class="criteria-ul">
      ${criteria.map(cr => `<li>${escapeHtml(cr)}</li>`).join('')}
    </ul>
  </div>

  <!-- Signoff & Verification Footer -->
  <div class="doc-footer">
    <div class="eval-signoff">
      Approved for Remote Engineering Sprints:<br>
      <strong>Muhammad Uzair</strong><br>
      Lead Architect & Founder, Uzair AI Studio
    </div>
    <div class="verification-seal">
      <strong>OFFICIAL SPECIFICATION</strong>
      Candidate Submission Portal: /intern-portal<br>
      Verification ID: ${escapeHtml(candidateId)}
    </div>
  </div>
</div>
</body>
</html>`;
  };

  // Direct In-Portal View for Task PDF using the official Intern Task Assignment specification
  window.viewTaskAssignmentDoc = function (weekNum, taskId) {
    if (!currentCurriculum || !currentCurriculum.weeks) {
      showPortalToast('Curriculum data is still loading. Please retry.', 'warning');
      return;
    }
    const week = currentCurriculum.weeks.find(w => w.weekNumber === weekNum);
    if (!week) {
      showPortalToast(`Week ${weekNum} could not be located.`, 'warning');
      return;
    }
    const task = week.tasks ? week.tasks.find(t => t.id === taskId) : null;
    if (!task) {
      showPortalToast('Task details could not be found.', 'warning');
      return;
    }

    const intern = currentIntern || {};
    const taskPayload = {
      meta: {
        intern: intern.fullName || 'Engineering Intern',
        track: intern.domain || 'Software Engineering & AI',
        mentor: intern.mentor || 'Muhammad Uzair',
        period: `Week ${weekNum}: ${week.title || ('Milestone ' + weekNum)}`,
        issued: new Date().toISOString().split('T')[0],
        ref: `UAIS-TASK-${intern.id || '2026'}-W${weekNum}`
      },
      tasks: [
        {
          title: task.title || 'Technical Sprint Milestone',
          priority: task.priority || 'High',
          due: intern.completionDate || 'End of Sprint Week',
          desc: (task.description || '') + (task.hint ? `\n\nImplementation Hint: ${task.hint}` : ''),
          deliv: (Array.isArray(task.steps) && task.steps.length ? task.steps.join('\n') : '') +
                 (task.deliverableType ? `\nDeliverable Type: ${task.deliverableType}` : '\nDeliverable: Production-Grade GitHub Implementation'),
          codeTemplate: task.codeTemplate || '',
          notes: (task.acceptanceCriteria && task.acceptanceCriteria.length ? ('Acceptance Criteria:\n' + task.acceptanceCriteria.join('\n')) : '')
        }
      ]
    };

    const taskDocUrl = `/task-assignment?data=${encodeURIComponent(JSON.stringify(taskPayload))}`;
    window.directPrintDocument(taskDocUrl, `Task Assignment - Week ${weekNum}: ${task.title}`, intern.fullName, false, false);
  };
  window.printTaskGuidePdf = window.viewTaskAssignmentDoc;

  // Copy Starter Code from Task Guide Modal
  window.copyTaskGuideCode = function () {
    const codeEl = document.getElementById('taskGuideCode');
    const btnText = document.getElementById('btnCopyTaskCodeText');
    if (!codeEl || !codeEl.textContent) return;
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      if (btnText) {
        btnText.textContent = 'Copied! ✓';
        setTimeout(() => { btnText.textContent = 'Copy Code'; }, 2000);
      }
      showPortalToast('Starter code copied to clipboard!', 'success');
    }).catch(() => {
      showPortalToast('Failed to copy code to clipboard.', 'warning');
    });
  };

  // Task Blueprint Guide Functions
  window.triggerTaskGuide = function (weekNum, taskId) {
    if (!currentCurriculum || !currentCurriculum.weeks) return;
    const week = currentCurriculum.weeks.find(w => w.weekNumber === weekNum);
    if (!week) return;
    const task = week.tasks ? week.tasks.find(t => t.id === taskId) : null;
    if (!task) return;
    window.openTaskGuideModal(weekNum, week.title, task);
  };

  window.openTaskGuideModal = function (weekNum, weekTitle, task) {
    const modal = document.getElementById('taskGuideModal');
    if (!modal) return;

    modal.dataset.currentWeek = weekNum;
    modal.dataset.currentTaskId = task.id;

    document.getElementById('taskGuideMeta').textContent = `TECHNICAL SPRINT BLUEPRINT • WEEK ${weekNum} • ${currentIntern.domain || 'ENGINEERING'}`;
    document.getElementById('taskGuideTitle').textContent = task.title;
    document.getElementById('taskGuideDesc').textContent = task.description;
    document.getElementById('taskGuideDeliverable').textContent = `${task.deliverableType || 'GitHub Repository Link'} (Hint: ${task.hint || 'Follow studio conventions'})`;

    // Tools
    const toolsContainer = document.getElementById('taskGuideTools');
    toolsContainer.innerHTML = '';
    const toolsList = task.tools || ['Git', 'VS Code', 'Node.js / Python Runtime'];
    toolsList.forEach(tool => {
      const chip = document.createElement('span');
      chip.className = 'task-tool-chip';
      chip.textContent = tool;
      toolsContainer.appendChild(chip);
    });

    // Steps
    const stepsContainer = document.getElementById('taskGuideSteps');
    stepsContainer.innerHTML = '';
    const steps = task.steps || [
      '1. Review repository architecture and clean coding conventions.',
      '2. Create dedicated feature branch feat/' + (task.id || 'sprint') + '.',
      '3. Implement modular logic and write passing unit tests.',
      '4. Push clean commit to GitHub and verify automated pipeline.'
    ];
    steps.forEach(st => {
      const li = document.createElement('li');
      li.textContent = st;
      stepsContainer.appendChild(li);
    });

    // Code
    const codeEl = document.getElementById('taskGuideCode');
    const codeSec = document.getElementById('taskGuideCodeSection');
    const filenameEl = document.getElementById('taskGuideCodeFilename');
    if (task.codeTemplate) {
      codeSec.style.display = 'block';
      codeEl.textContent = task.codeTemplate;
      if (filenameEl) {
        const domain = (currentIntern.domain || '').toLowerCase();
        let fname = 'app.js';
        if (domain.includes('python') || domain.includes('ai') || domain.includes('data') || domain.includes('machine')) fname = 'main.py';
        else if (domain.includes('react') || domain.includes('frontend') || domain.includes('next')) fname = 'App.tsx';
        else if (domain.includes('flutter') || domain.includes('mobile')) fname = 'main.dart';
        else if (domain.includes('android')) fname = 'MainActivity.kt';
        filenameEl.textContent = fname;
      }
    } else {
      codeSec.style.display = 'none';
    }

    // Criteria
    const criteriaContainer = document.getElementById('taskGuideCriteria');
    criteriaContainer.innerHTML = '';
    const criteria = task.acceptanceCriteria || [
      'Zero compilation or linting errors.',
      'Unit tests pass with valid assertions.',
      'Deliverable submitted via private intern portal.'
    ];
    criteria.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c;
      criteriaContainer.appendChild(li);
    });

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
  };

  window.closeTaskGuideModal = function () {
    const modal = document.getElementById('taskGuideModal');
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 220);
  };

  const btnCloseTaskGuideModal = document.getElementById('btnCloseTaskGuideModal');
  if (btnCloseTaskGuideModal) btnCloseTaskGuideModal.addEventListener('click', window.closeTaskGuideModal);

  const btnCloseTaskGuideBottom = document.getElementById('btnCloseTaskGuideBottom');
  if (btnCloseTaskGuideBottom) btnCloseTaskGuideBottom.addEventListener('click', window.closeTaskGuideModal);

  const taskGuideModal = document.getElementById('taskGuideModal');
  if (taskGuideModal) {
    taskGuideModal.addEventListener('click', (e) => {
      if (e.target === taskGuideModal) window.closeTaskGuideModal();
    });
  }

  const btnPrintTaskGuide = document.getElementById('btnPrintTaskGuide');
  if (btnPrintTaskGuide) {
    btnPrintTaskGuide.addEventListener('click', () => {
      window.closeTaskGuideModal();
    });
  }

  // Toggle Week Accordion View
  window.toggleWeekAccordion = function (weekNum) {
    const body = document.getElementById(`weekBody_${weekNum}`);
    if (body) {
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    }
  };

  // Save Deliverable Link
  window.saveTaskDeliverable = async function (taskId, weekNum) {
    const linkInput = document.getElementById(`link_${taskId}`);
    const submissionLink = linkInput ? linkInput.value.trim() : '';
    const chk = document.getElementById(`chk_${taskId}`);
    const completed = chk ? chk.checked : true;
    await submitTaskAction(taskId, weekNum, completed, submissionLink);
  };

  // Submit Task Action to Backend API
  async function submitTaskAction(taskId, weekNumber, completed, submissionLink = '') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      const res = await fetch('/api/intern-portal/task-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId,
          weekNumber,
          completed,
          submissionLink
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (json.intern) currentIntern = json.intern;
        renderCurriculumWeeks(currentCurriculum.weeks);
        populateDocumentVault();
        
        // Update metric values in dashboard
        const currentWeekNum = currentIntern.tasksProgress ? currentIntern.tasksProgress.currentWeek : 1;
        document.getElementById('statCurriculumWeek').textContent = currentIntern.isCompleted ? 'Week 8 / 8' : `Week ${currentWeekNum} / 8`;
        const completedCount = currentIntern.tasksProgress.completedTasks ? currentIntern.tasksProgress.completedTasks.length : 0;
        document.getElementById('statTasksCount').textContent = `${completedCount} / 16`;
      } else {
        alert(json.message || 'Error updating task progress.');
      }
    } catch (err) {
      alert('Network error updating task. Please retry.');
    }
  }

  // ============================================================
  // 6. INITIALIZATION & SESSION RESTORATION (OFFLINE INDEXEDDB)
  // ============================================================
  function updateInternNetworkStatus(isOnline) {
    const dot = document.getElementById('internOfflineHeaderDot');
    const banner = document.getElementById('internOfflineBanner');
    if (dot) dot.style.display = isOnline ? 'none' : 'inline-flex';
    if (banner) banner.style.display = isOnline ? 'none' : 'block';
  }

  window.addEventListener('online', () => {
    updateInternNetworkStatus(true);
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch('/api/intern-portal/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(j => {
        if (j.success && j.intern) {
          currentIntern = j.intern;
          if (window.UzairLocalDB) window.UzairLocalDB.saveInternSession(currentIntern, token);
          renderAuthenticatedPortal();
        }
      }).catch(() => {});
    }
  });

  window.addEventListener('offline', () => {
    updateInternNetworkStatus(false);
  });

  async function initPortal() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch('/api/intern-portal/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok && json.success && json.intern) {
          currentIntern = json.intern;
          if (window.UzairLocalDB) {
            window.UzairLocalDB.saveInternSession(currentIntern, token);
          }
          renderAuthenticatedPortal();
          updateInternNetworkStatus(true);
          return;
        }
      } catch (e) {
        console.warn('[Intern Portal] Network offline during token check, querying IndexedDB:', e);
      }

      // Offline fallback: load cached intern profile from IndexedDB
      if (window.UzairLocalDB) {
        try {
          const sess = await window.UzairLocalDB.getInternSession();
          if (sess && sess.profile) {
            currentIntern = sess.profile;
            renderAuthenticatedPortal();
            updateInternNetworkStatus(false);
            return;
          }
        } catch (dbErr) {
          console.error('[Intern Portal] Failed to read cached profile:', dbErr);
        }
      }
    }

    // Default to Auth Section (unauthenticated state)
    document.body.classList.remove('portal-authenticated');
    const mobileAppBar = document.getElementById('mobileAppBar');
    if (mobileAppBar) {
      mobileAppBar.style.setProperty('display', 'none', 'important');
      mobileAppBar.style.setProperty('visibility', 'hidden', 'important');
    }
    const headerDesktopNav = document.getElementById('headerDesktopNav');
    if (headerDesktopNav) {
      headerDesktopNav.style.setProperty('display', 'none', 'important');
    }
    const internNotifWrap = document.getElementById('internNotifWrap');
    if (internNotifWrap) internNotifWrap.style.display = 'none';
    if (userHeaderPill) userHeaderPill.style.display = 'none';
    if (authSection) authSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
    checkPublicRegistrationStatus();
  }

  initPortal();

})();


  // ==========================================
  // MIT ARTIFICIAL INTELLIGENCE COURSE HUB (6.034)
  // ==========================================
  const MIT_PLAYLIST_ID = 'PLUl4u3cNGP63gFHB6xb-kVBiQHYe_4hSi';
  const MIT_COURSE_LECTURES = [
    {
      id: 1,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '1. Introduction and Scope',
      videoId: 'TjZBTDzGeGg',
      duration: '49 min',
      desc: 'Introduction to foundational ideas of artificial intelligence, representations that enable reasoning, and course roadmap.'
    },
    {
      id: 2,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '2. Reasoning: Goal Trees and Problem Solving',
      videoId: 'PNKj529yY5c',
      duration: '51 min',
      desc: 'Symbolic integration, safe and heuristic transformations, goal trees, and decomposing problems into solvable subproblems.'
    },
    {
      id: 3,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '3. Reasoning: Goal Trees and Rule-Based Expert Systems',
      videoId: 'leXa7EKUPFk',
      duration: '48 min',
      desc: 'Forward chaining, backward chaining, deduction systems, and capturing domain knowledge with rule-based models.'
    },
    {
      id: 4,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '4. Search: Depth-First, Hill Climbing, Beam',
      videoId: 'j1H3jAAGlEA',
      duration: '50 min',
      desc: 'Uninformed and heuristic search algorithms, tree traversals, local search, hill climbing pitfalls, and beam search width.'
    },
    {
      id: 5,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '5. Search: Optimal, Branch and Bound, A*',
      videoId: 'gGQ-vAmdAOI',
      duration: '47 min',
      desc: 'Finding guaranteed optimal paths, branch and bound, admissible heuristics, dynamic programming principle, and the A* search algorithm.'
    },
    {
      id: 6,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '6. Search: Games, Minimax, and Alpha-Beta',
      videoId: 'STjW3eH0Cik',
      duration: '52 min',
      desc: 'Adversarial games, minimax evaluation of game trees, progressive deepening, and alpha-beta pruning optimization.'
    },
    {
      id: 7,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '7. Constraints: Interpreting Line Drawings',
      videoId: 'l-tzjenXrvI',
      duration: '46 min',
      desc: 'Constraint propagation in computer vision, Huffman-Clowes labeling, edge classifications, and impossible object detection.'
    },
    {
      id: 8,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '8. Constraints: Search, Domain Reduction',
      videoId: 'd1KyYyLmGpA',
      duration: '49 min',
      desc: 'Constraint Satisfaction Problems (CSPs), map coloring, domain reduction, arc consistency, and variable ordering heuristics.'
    },
    {
      id: 9,
      module: 'Module 1: Reasoning, Search & Constraints',
      title: '9. Constraints: Visual Object Recognition',
      videoId: 'gvmfbePC2pc',
      duration: '50 min',
      desc: 'Recognizing geometric shapes and 3D objects through constraint satisfaction and alignment techniques.'
    },
    {
      id: 10,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '10. Introduction to Learning, Nearest Neighbors',
      videoId: '09mb78oiPkA',
      duration: '49 min',
      desc: 'Supervised classification foundations, Euclidean metrics, decision boundaries, and k-Nearest Neighbors (k-NN).'
    },
    {
      id: 11,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '11. Learning: Identification Trees, Disorder',
      videoId: 'SXBG3RGr_Rc',
      duration: '51 min',
      desc: 'Decision tree induction, Shannon entropy, calculating average disorder, information gain, and building compact trees.'
    },
    {
      id: 12,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '12A. Neural Nets',
      videoId: 'uXt8qF2Zzfo',
      duration: '48 min',
      desc: 'Biological neurons, perceptrons, multi-layer feedforward neural networks, sigmoid activations, and backpropagation gradient descent.'
    },
    {
      id: 13,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '12B. Deep Neural Nets',
      videoId: 'VrMHA3yX_QI',
      duration: '54 min',
      desc: 'Modern deep neural network architectures, convolutional networks, representation learning, and computer vision breakthroughs.'
    },
    {
      id: 14,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '13. Learning: Genetic Algorithms',
      videoId: 'kHyNqSnzP8Y',
      duration: '50 min',
      desc: 'Evolutionary computing, chromosome representations, fitness evaluation functions, crossover operators, and stochastic search.'
    },
    {
      id: 15,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '14. Learning: Sparse Spaces, Phonology',
      videoId: 'L73hY1pBcQI',
      duration: '45 min',
      desc: 'Working with sparse high-dimensional data, phonological rules, pattern classification in linguistics, and nearest neighbor subtleties.'
    },
    {
      id: 16,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '15. Learning: Near Misses, Felicity Conditions',
      videoId: 'sh3EPjhhd40',
      duration: '47 min',
      desc: 'Winston structural concept learning, learning from positive examples and near-misses, heuristic model refinement, and teacher-learner dynamics.'
    },
    {
      id: 17,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '16. Learning: Support Vector Machines (SVMs)',
      videoId: '_PwhiWxHK8o',
      duration: '49 min',
      desc: 'Maximum margin hyperplanes, convex quadratic optimization, Lagrange multipliers, support vectors, and non-linear kernel transformations.'
    },
    {
      id: 18,
      module: 'Module 2: Machine Learning Fundamentals',
      title: '17. Learning: Boosting (AdaBoost)',
      videoId: 'UHBmv7qCey4',
      duration: '52 min',
      desc: 'Ensemble learning, converting weak learners into strong classifiers, sample weighting updates, and the AdaBoost training algorithm.'
    },
    {
      id: 19,
      module: 'Module 3: Representations, Architectures & Probabilistic AI',
      title: '18. Representations: Classes, Trajectories, Transitions',
      videoId: 'kY9v4W98Xok',
      duration: '48 min',
      desc: 'Representing knowledge, frames, inheritance hierarchies, trajectories, and symbolic transitions for physical reasoning.'
    },
    {
      id: 20,
      module: 'Module 3: Representations, Architectures & Probabilistic AI',
      title: '19. Architectures: GPS, SOAR, Subsumption, Society of Mind',
      videoId: 'O1p4ZgK-8t8',
      duration: '50 min',
      desc: 'Classic cognitive architectures: General Problem Solver (GPS), SOAR, Rodney Brooks subsumption reactive robotics, and Marvin Minsky Society of Mind.'
    },
    {
      id: 21,
      module: 'Module 3: Representations, Architectures & Probabilistic AI',
      title: '21. Probabilistic Inference I',
      videoId: 'A6Ud6oUCRak',
      duration: '49 min',
      desc: 'Conditional probabilities, prior and posterior distributions, joint tables, Bayes Theorem, and independence assumptions.'
    },
    {
      id: 22,
      module: 'Module 3: Representations, Architectures & Probabilistic AI',
      title: '22. Probabilistic Inference II',
      videoId: 'EC6bf8JCpDQ',
      duration: '51 min',
      desc: 'Bayesian belief networks, directed acyclic graphs, causal reasoning, d-separation, and inference algorithms.'
    },
    {
      id: 23,
      module: 'Module 3: Representations, Architectures & Probabilistic AI',
      title: '23. Model Merging, Cross-Modal Coupling, Course Summary',
      videoId: 'XPEJg_6Cg6o',
      duration: '53 min',
      desc: 'Multimodal perception, vision and language integration, story comprehension systems, and closing perspectives on human-level artificial intelligence.'
    },
    {
      id: 24,
      module: 'Module 3: Representations, Architectures & Probabilistic AI',
      title: 'Special Recitation: Problem Solving Mega-Session',
      videoId: 'TjZBTDzGeGg',
      duration: '55 min',
      desc: 'Comprehensive review of examination problems, search heuristics, constraint satisfaction proofs, and decision boundaries.'
    }
  ];

  let currentMitLectureIndex = 0;

  function initMitCoursePlayer() {
    renderMitLectureList();
    loadMitLecture(0);

    const searchInput = document.getElementById('mitLectureSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        renderMitLectureList(query);
      });
    }

    const prevBtn = document.getElementById('btnMitPrevLecture');
    const nextBtn = document.getElementById('btnMitNextLecture');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentMitLectureIndex > 0) {
          loadMitLecture(currentMitLectureIndex - 1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentMitLectureIndex < MIT_COURSE_LECTURES.length - 1) {
          loadMitLecture(currentMitLectureIndex + 1);
        }
      });
    }
  }

  function loadMitLecture(index) {
    if (index < 0 || index >= MIT_COURSE_LECTURES.length) return;
    currentMitLectureIndex = index;
    const lecture = MIT_COURSE_LECTURES[index];

    // Update iframe player
    const frame = document.getElementById('mitVideoPlayerFrame');
    if (frame) {
      frame.src = `https://www.youtube-nocookie.com/embed/${lecture.videoId}?autoplay=0&rel=0&modestbranding=1`;
    }

    // Update text details
    const badge = document.getElementById('mitCurrentLectureBadge');
    if (badge) badge.textContent = `LECTURE ${lecture.id} OF ${MIT_COURSE_LECTURES.length}`;

    const moduleText = document.getElementById('mitCurrentModuleText');
    if (moduleText) moduleText.textContent = lecture.module;

    const titleEl = document.getElementById('mitCurrentLectureTitle');
    if (titleEl) titleEl.textContent = lecture.title;

    const descEl = document.getElementById('mitCurrentLectureDesc');
    if (descEl) descEl.textContent = lecture.desc;

    // External link removed per design specification

    // Update Previous / Next button states
    const prevBtn = document.getElementById('btnMitPrevLecture');
    if (prevBtn) prevBtn.disabled = index === 0;

    const nextBtn = document.getElementById('btnMitNextLecture');
    if (nextBtn) nextBtn.disabled = index === MIT_COURSE_LECTURES.length - 1;

    // Highlight in list
    document.querySelectorAll('.mit-lecture-item').forEach((item) => {
      const idx = parseInt(item.dataset.index, 10);
      const isCurrent = idx === index;
      if (isCurrent) {
        item.classList.add('active');
        item.style.background = '#F1F5F9';
        item.style.borderColor = '#0F172A';
        item.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        item.classList.remove('active');
        item.style.background = '#FFFFFF';
        item.style.borderColor = '#E2E8F0';
        item.style.boxShadow = 'none';
      }
    });
  }

  function renderMitLectureList(filterQuery = '') {
    const listContainer = document.getElementById('mitLecturesListContainer');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    let renderedCount = 0;

    MIT_COURSE_LECTURES.forEach((lec, idx) => {
      const matches = !filterQuery || lec.title.toLowerCase().includes(filterQuery) || lec.desc.toLowerCase().includes(filterQuery) || lec.module.toLowerCase().includes(filterQuery);
      if (!matches) return;
      renderedCount++;

      const isCurrent = idx === currentMitLectureIndex;

      const item = document.createElement('div');
      item.className = 'mit-lecture-item' + (isCurrent ? ' active' : '');
      item.dataset.index = idx;
      item.style.padding = '12px 14px';
      item.style.marginBottom = '8px';
      item.style.borderRadius = '12px';
      item.style.border = isCurrent ? '1.5px solid #0F172A' : '1px solid #E2E8F0';
      item.style.background = isCurrent ? '#F1F5F9' : '#FFFFFF';
      item.style.boxShadow = isCurrent ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none';
      item.style.cursor = 'pointer';
      item.style.transition = 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)';

      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
          <span style="font-size:0.68rem; font-weight:800; color:${isCurrent ? '#0F172A' : '#475569'}; background:${isCurrent ? '#E2E8F0' : '#F1F5F9'}; padding:2px 7px; border-radius:5px; letter-spacing:0.02em;">
            LEC ${lec.id}
          </span>
          <span style="font-size:0.72rem; color:#64748B; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
            <span>⏱️</span> ${lec.duration}
          </span>
        </div>
        <div style="font-size:0.84rem; font-weight:800; color:#0F172A; line-height:1.35; margin-bottom:3px;">
          ${lec.title}
        </div>
        <div style="font-size:0.73rem; color:#64748B; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.4;">
          ${lec.desc}
        </div>
      `;

      item.addEventListener('mouseenter', () => {
        if (idx !== currentMitLectureIndex) {
          item.style.background = '#F8FAFC';
          item.style.borderColor = '#CBD5E1';
          item.style.transform = 'translateY(-1px)';
        }
      });
      item.addEventListener('mouseleave', () => {
        if (idx !== currentMitLectureIndex) {
          item.style.background = '#FFFFFF';
          item.style.borderColor = '#E2E8F0';
          item.style.transform = 'none';
        }
      });
      item.addEventListener('click', () => {
        loadMitLecture(idx);
      });

      listContainer.appendChild(item);
    });

    // Update count badge
    const countBadge = document.getElementById('mitLecturesCountBadge');
    if (countBadge) {
      countBadge.textContent = filterQuery ? `${renderedCount} found` : '24 Sessions';
    }

    if (renderedCount === 0) {
      listContainer.innerHTML = '<div style="padding:28px 16px; text-align:center; color:#94A3B8; font-size:0.825rem;"><span style="font-size:1.4rem; display:block; margin-bottom:6px;">🔍</span>No lecture topics matching "'+filterQuery+'"</div>';
    }
  }
  document.addEventListener("DOMContentLoaded", initMitCoursePlayer);
