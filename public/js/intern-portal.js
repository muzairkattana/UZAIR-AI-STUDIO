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
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem(TOKEN_KEY);
      currentIntern = null;
      window.location.reload();
    });
  }

  // ============================================================
  // 3. NAVIGATION VIEW SWITCHER (DESKTOP TABS & MOBILE APP BAR)
  // ============================================================
  function switchPortalView(targetViewId) {
    // Hide all views
    document.querySelectorAll('.portal-view-pane').forEach(v => v.style.display = 'none');
    
    // Show target view
    const target = document.getElementById(targetViewId);
    if (target) target.style.display = 'block';

    // Update Desktop Tabs
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
      if (btn.dataset.view === targetViewId) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Update Mobile App Bar Items
    document.querySelectorAll('.app-bar-item').forEach(item => {
      if (item.dataset.view === targetViewId) item.classList.add('active');
      else item.classList.remove('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.dash-tab-btn, .app-bar-item').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.view;
      if (view) switchPortalView(view);
    });
  });

  // ============================================================
  // 4. PORTAL POPULATION & RENDERING
  // ============================================================
  function renderAuthenticatedPortal() {
    if (!currentIntern) return;

    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    if (userHeaderPill) userHeaderPill.style.display = 'flex';

    // Populate Header
    if (headerUserName) headerUserName.textContent = currentIntern.fullName;
    if (headerUserId) headerUserId.textContent = currentIntern.id;
    if (headerUserAvatar) {
      const initials = (currentIntern.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      headerUserAvatar.textContent = initials;
    }

    // Populate Hero & Metrics
    const isCompleted = currentIntern.isCompleted;
    document.getElementById('dashCandidateName').textContent = currentIntern.fullName;
    document.getElementById('dashDomainPill').textContent = `Track: ${currentIntern.domain}`;
    document.getElementById('dashIdPill').textContent = currentIntern.id;
    document.getElementById('dashStatusPill').textContent = isCompleted ? '🎓 Certified Graduate' : '🟢 Active Remote Intern';

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
      credStatusEl.style.color = isCompleted ? '#059669' : '#2563EB';
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
    if (btnOffer) btnOffer.href = `/offer-letter/${encodeURIComponent(currentIntern.id)}`;

    // Letter of Recommendation
    const btnLor = document.getElementById('btnVaultLor');
    const badgeLor = document.getElementById('vaultLorBadge');
    const descLor = document.getElementById('vaultLorDesc');
    if (isCompleted) {
      badgeLor.className = 'vault-card-badge badge-unlocked';
      badgeLor.textContent = '✓ Officially Awarded';
      descLor.textContent = 'Official Letter of Recommendation issued and signed by Founder Muhammad Uzair.';
      btnLor.className = 'vault-btn primary';
      btnLor.href = `/recommendation-letter/${encodeURIComponent(currentIntern.id)}`;
      btnLor.innerHTML = '<span>📜 Download / Print LOR</span>';
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
      btnCert.href = `/certificate/${encodeURIComponent(currentIntern.id)}`;
      btnCert.innerHTML = '<span>🎓 Download / Print Certificate</span>';
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
      btnExp.href = `/experience-letter/${encodeURIComponent(currentIntern.id)}`;
      btnExp.innerHTML = '<span>💼 Download / Print Experience Letter</span>';
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
      const res = await fetch('/api/intern-portal/curriculum');
      const json = await res.json();
      if (json && json.success && json.curriculum) {
        currentCurriculum = json.curriculum;
        renderCurriculumWeeks(currentCurriculum.weeks);
      }
    } catch (e) {
      container.innerHTML = '<div style="padding:20px; color:#EF4444;">Failed to load curriculum. Please refresh.</div>';
    }
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
      
      // Sequential Unlock Rule:
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
                  Deliverable: <strong style="color:#0284C7;">${t.deliverableType}</strong> &bull; <em>${t.hint}</em>
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
  // 6. INITIALIZATION & SESSION RESTORATION
  // ============================================================
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
          renderAuthenticatedPortal();
          return;
        }
      } catch (e) {}
    }

    // Default to Auth Section
    if (authSection) authSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
    checkPublicRegistrationStatus();
  }

  initPortal();

})();
