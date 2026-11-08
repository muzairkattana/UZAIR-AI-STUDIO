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

  window.directPrintDocument = function(rawUrl, docTitle, candidateName) {
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

    const sep = rawUrl.includes('?') ? '&' : '?';
    const targetUrl = `${rawUrl}${sep}ts=${Date.now()}`;

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
      if (iframe) iframe.src = 'about:blank';
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
      if (!autoPrinted) {
        autoPrinted = true;
        setTimeout(triggerPrint, 400);
      }
    };

    iframe.src = targetUrl;
    showPortalToast(`Rendering ${cleanTitle}...`, 'info');
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

    // Hide all portal view panes
    document.querySelectorAll('.portal-view-pane').forEach(v => {
      v.style.display = 'none';
    });
    
    // Show target view
    const target = document.getElementById(targetViewId);
    if (target) {
      target.style.display = 'block';
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
    document.getElementById('profileModalTrack').textContent = `${trackDuration} • ${currentIntern.isCompleted ? 'Completed' : `${currentIntern.daysRemaining || 60} Days Remaining`}`;
    
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

    document.getElementById('statDaysRemaining').textContent = isCompleted ? 'Completed' : `${currentIntern.daysRemaining} Days`;
    document.getElementById('statTimelineTarget').textContent = `Target: ${currentIntern.completionDate}`;

    const completedTasksCount = (currentIntern.tasksProgress && currentIntern.tasksProgress.completedTasks) ? currentIntern.tasksProgress.completedTasks.length : 0;
    document.getElementById('statTasksCount').textContent = `${completedTasksCount} / 16`;

    const credStatusEl = document.getElementById('statCredentialStatus');
    if (credStatusEl) {
      credStatusEl.textContent = isCompleted ? 'All Credentials Ready' : 'Offer Letter Ready';
      credStatusEl.style.color = isCompleted ? '#059669' : '#4F46E5';
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
    const isCompleted = currentIntern.isCompleted;

    // Offer Letter
    const btnOffer = document.getElementById('btnVaultOffer');
    if (btnOffer) {
      const offerUrl = `/offer-letter/${encodeURIComponent(currentIntern.id)}`;
      btnOffer.href = offerUrl;
      btnOffer.innerHTML = '<span>🖨️ Direct Print Offer Letter</span>';
      btnOffer.onclick = (e) => {
        e.preventDefault();
        window.directPrintDocument(offerUrl, 'Internship Offer Letter', currentIntern.fullName);
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
        window.directPrintDocument(lorUrl, 'Letter of Recommendation (LOR)', currentIntern.fullName);
      };
    } else {
      badgeLor.className = 'vault-card-badge badge-locked';
      badgeLor.textContent = `🔒 Time-Locked (${currentIntern.daysRemaining} days remaining)`;
      descLor.textContent = `Unlocks automatically upon completing your 8-week curriculum (${currentIntern.daysRemaining} days remaining).`;
      btnLor.className = 'vault-btn locked';
      btnLor.removeAttribute('href');
      btnLor.innerHTML = '<span>🔒 Locked Until Program Completion</span>';
      btnLor.onclick = (e) => {
        e.preventDefault();
        alert(`🔒 Letter of Recommendation Notice:\n\nOfficial Letters of Recommendation are awarded exclusively upon successful completion of your 8-week internship curriculum.\n\n• Candidate: ${currentIntern.fullName}\n• Days Remaining: ${currentIntern.daysRemaining}\n• Target Completion: ${currentIntern.completionDate}`);
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
      btnCert.className = 'vault-btn gold';
      const certUrl = `/certificate/${encodeURIComponent(currentIntern.id)}`;
      btnCert.href = certUrl;
      btnCert.innerHTML = '<span>🖨️ Direct Print Certificate</span>';
      btnCert.onclick = (e) => {
        e.preventDefault();
        window.directPrintDocument(certUrl, 'Certificate of Completion', currentIntern.fullName);
      };
    } else {
      badgeCert.className = 'vault-card-badge badge-locked';
      badgeCert.textContent = `🔒 Time-Locked (${currentIntern.daysRemaining} days remaining)`;
      descCert.textContent = `Unlocks automatically upon completing your 8-week curriculum (${currentIntern.daysRemaining} days remaining).`;
      btnCert.className = 'vault-btn locked';
      btnCert.removeAttribute('href');
      btnCert.innerHTML = '<span>🔒 Locked Until Program Completion</span>';
      btnCert.onclick = (e) => {
        e.preventDefault();
        alert(`🔒 Certificate of Completion Notice:\n\nOfficial graduation certificates are unlocked exclusively upon completing your full 8-week duration.\n\n• Days Remaining: ${currentIntern.daysRemaining}\n• Target Date: ${currentIntern.completionDate}`);
      };
    }

    // Experience Letter
    const btnExp = document.getElementById('btnVaultExp');
    const badgeExp = document.getElementById('vaultExpBadge');
    const descExp = document.getElementById('vaultExpDesc');
    if (isCompleted) {
      badgeExp.className = 'vault-card-badge badge-unlocked';
      badgeExp.textContent = '✓ Officially Awarded';
      descExp.textContent = 'Official software engineering experience credential signed by Lead Architect Muhammad Uzair.';
      btnExp.className = 'vault-btn primary';
      btnExp.style.background = '#8B5CF6';
      const expUrl = `/experience-letter/${encodeURIComponent(currentIntern.id)}`;
      btnExp.href = expUrl;
      btnExp.innerHTML = '<span>🖨️ Direct Print Experience Letter</span>';
      btnExp.onclick = (e) => {
        e.preventDefault();
        window.directPrintDocument(expUrl, 'Experience Letter', currentIntern.fullName);
      };
    } else {
      badgeExp.className = 'vault-card-badge badge-locked';
      badgeExp.textContent = '🔒 Time-Locked';
      descExp.textContent = 'Unlocks upon graduation to substantiate your completed software engineering contributions.';
      btnExp.className = 'vault-btn locked';
      btnExp.removeAttribute('href');
      btnExp.innerHTML = '<span>🔒 Locked Until Program Completion</span>';
      btnExp.onclick = (e) => {
        e.preventDefault();
        alert('🔒 Experience Letter Notice:\n\nExperience letters substantiate completed software engineering work and unlock upon internship completion.');
      };
    }
  }

  // Populate Settings View
  function populateSettingsView() {
    document.getElementById('settingsCurrentEmail').textContent = currentIntern.email;
    document.getElementById('profName').textContent = currentIntern.fullName;
    document.getElementById('profId').textContent = currentIntern.id;
    document.getElementById('profDomain').textContent = currentIntern.domain;
    document.getElementById('profInstitute').textContent = currentIntern.institute || 'N/A';
    document.getElementById('profDegree').textContent = currentIntern.degree || 'N/A';
    document.getElementById('profWa').textContent = currentIntern.whatsapp || 'N/A';
    document.getElementById('profStartDate').textContent = currentIntern.startDate;
    document.getElementById('profEndDate').textContent = currentIntern.completionDate;
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
                <div style="margin-top:8px;">
                  <button type="button" class="btn-task-blueprint-open" onclick="window.triggerTaskGuide(${weekNum}, '${t.id}')" style="background:#EEF2FF; border:1px solid #C7D2FE; color:#4338CA; border-radius:6px; padding:4px 10px; font-size:0.75rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all 0.15s;">
                    <span>📄 Download Task Guide (PDF / Blueprint)</span>
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
    if (task.codeTemplate) {
      codeSec.style.display = 'block';
      codeEl.textContent = task.codeTemplate;
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
      window.print();
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
