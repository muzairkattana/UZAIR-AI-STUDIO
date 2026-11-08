/**
 * Uzair AI Studio - Executive Admin Controller
 * Manages Internships, Real-Time Settings, QR Codes, and Strategy Consultations
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
  initAdminNavigation();
  initInternsManager();
  initAnalyticsTab();
  initConsultationsManager();
  initSettingsManager();
  initQrTester();
  const defaultInternView = localStorage.getItem('admin_intern_view') || 'cards';
  if (window.switchCandidateView) window.switchCandidateView(defaultInternView);
  if (window.innerWidth <= 768) {
    if (window.switchConsultationView) window.switchConsultationView('cards');
  }
});

let allInternsData = [];
let allConsultationsData = [];

/* ============================================================
   SECURE ADMIN API FETCH HELPER (INJECTS BEARER AUTH TOKEN)
   ============================================================ */
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('uzair_admin_token');
  const headers = options.headers ? { ...options.headers } : {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    console.warn('[Admin Security] Unauthorized request detected. Redirecting to administrator login.');
    localStorage.removeItem('uzair_admin_token');
    localStorage.removeItem('uzair_admin_user');
    const loginWrapper = document.getElementById('loginWrapper');
    const adminLayout = document.getElementById('adminLayout');
    const loginAlert = document.getElementById('loginAlertBox');
    if (loginWrapper) loginWrapper.style.display = 'flex';
    if (adminLayout) adminLayout.style.display = 'none';
    if (loginAlert) {
      loginAlert.textContent = 'Administrator session expired or unauthorized. Please sign in again.';
      loginAlert.style.display = 'block';
    }
  }
  return res;
}

/* ============================================================
   1. AUTHENTICATION & SESSION MANAGEMENT
   ============================================================ */
function initAdminAuth() {
  const loginWrapper = document.getElementById('loginWrapper');
  const adminLayout = document.getElementById('adminLayout');
  const loginForm = document.getElementById('adminLoginForm');
  const loginAlert = document.getElementById('loginAlertBox');
  const btnTogglePass = document.getElementById('btnTogglePass');
  const adminPassInput = document.getElementById('adminPass');
  const btnLogout = document.getElementById('btnLogout');

  // Check saved session (strict: must verify token against backend, no query bypass)
  const savedToken = localStorage.getItem('uzair_admin_token');
  if (savedToken) {
    fetch('/api/admin/verify-session', {
      headers: { 'Authorization': `Bearer ${savedToken}` }
    }).then(res => res.json()).then(data => {
      if (data && data.success) {
        showDashboard();
      } else {
        localStorage.removeItem('uzair_admin_token');
        localStorage.removeItem('uzair_admin_user');
        if (loginWrapper) loginWrapper.style.display = 'flex';
        if (adminLayout) adminLayout.style.display = 'none';
      }
    }).catch(() => {
      showDashboard();
    });
  } else {
    if (loginWrapper) loginWrapper.style.display = 'flex';
    if (adminLayout) adminLayout.style.display = 'none';
  }

  // Toggle password visibility
  if (btnTogglePass && adminPassInput) {
    btnTogglePass.addEventListener('click', () => {
      adminPassInput.type = adminPassInput.type === 'password' ? 'text' : 'password';
      btnTogglePass.textContent = adminPassInput.type === 'password' ? '👁️' : '🔒';
    });
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginAlert.style.display = 'none';

      const username = document.getElementById('adminUser').value.trim();
      const password = document.getElementById('adminPass').value;
      const btnSubmit = document.getElementById('btnLoginSubmit');

      if (!username || !password) {
        loginAlert.textContent = 'Please enter both administrator email and password.';
        loginAlert.style.display = 'block';
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span>⚡ Verifying Credentials...</span>';
      }

      try {
        let authPayload = { username, password };

        // Attempt direct client-side Firebase Auth if SDK is loaded and username is an email
        if (window.UzairFirebase && window.UzairFirebase.auth && window.UzairFirebase.signInWithEmailAndPassword && username.includes('@')) {
          try {
            const userCred = await window.UzairFirebase.signInWithEmailAndPassword(window.UzairFirebase.auth, username, password);
            if (userCred && userCred.user) {
              const idToken = await userCred.user.getIdToken();
              authPayload = {
                idToken: idToken,
                email: userCred.user.email,
                username: username,
                password: password
              };
            }
          } catch (clientAuthErr) {
            console.log('[Firebase Client Auth Notice] Falling back to server verification:', clientAuthErr.message);
          }
        }

        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authPayload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem('uzair_admin_token', data.token);
          localStorage.setItem('uzair_admin_user', JSON.stringify(data.user));
          if (btnSubmit) {
            btnSubmit.innerHTML = '<span>✅ Verified • Launching Command Hub...</span>';
          }
          setTimeout(() => {
            showDashboard();
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML = '<span>🔒 Authenticate Administrator</span><span style="font-size:1.05rem;">&rarr;</span>';
            }
          }, 350);
        } else {
          loginAlert.textContent = data.message || 'Invalid administrator credentials. Access denied.';
          loginAlert.style.display = 'block';
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span>🔒 Authenticate Administrator</span><span style="font-size:1.05rem;">&rarr;</span>';
          }
        }
      } catch (err) {
        loginAlert.textContent = 'Network error connecting to authentication server.';
        loginAlert.style.display = 'block';
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span>🔒 Authenticate Administrator</span><span style="font-size:1.05rem;">&rarr;</span>';
        }
      }
    });
  }

  // Handle Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (window.UzairFirebase && window.UzairFirebase.auth && window.UzairFirebase.signOut) {
        try {
          await window.UzairFirebase.signOut(window.UzairFirebase.auth);
        } catch (e) {}
      }
      localStorage.removeItem('uzair_admin_token');
      localStorage.removeItem('uzair_admin_user');
      window.location.reload();
    });
  }

  function showDashboard() {
    if (loginWrapper) loginWrapper.style.display = 'none';
    if (adminLayout) adminLayout.style.display = 'flex';

    // Show authenticated user email/name in sidebar
    try {
      const savedUser = JSON.parse(localStorage.getItem('uzair_admin_user') || '{}');
      const nameEl = document.getElementById('adminUserName');
      const emailEl = document.getElementById('adminUserEmail');
      const initialsEl = document.getElementById('adminUserInitials');

      const displayName = savedUser.name || 'Muhammad Uzair';
      const displayEmail = savedUser.email || 'kmuzairkhan123@gmail.com';

      if (nameEl) nameEl.textContent = displayName;
      if (emailEl) {
        emailEl.textContent = displayEmail;
        emailEl.title = `Authorized Administrator: ${displayEmail}`;
      }
      if (initialsEl) {
        const parts = displayName.trim().split(/\s+/);
        const initials = parts.length > 1
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : displayName.slice(0, 2).toUpperCase();
        initialsEl.textContent = initials || 'MU';
      }
    } catch (e) {}

    loadAllAdminData();
    const defaultInternView = localStorage.getItem('admin_intern_view') || 'cards';
    if (window.switchCandidateView) window.switchCandidateView(defaultInternView);
    if (window.innerWidth <= 768) {
      if (window.switchConsultationView) window.switchConsultationView('cards');
    }
  }
}

/* ============================================================
   2. DASHBOARD NAVIGATION & ADAPTIVE TOPBAR HEADER
   ============================================================ */
function initAdminNavigation() {
  const navLinks = document.querySelectorAll('.sidebar-nav-link[data-section]');
  const bottomNavBtns = document.querySelectorAll('#mobileBottomNav .mob-nav-btn[data-section]');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');
  const heading = document.getElementById('pageTitleHeading');
  const subHeading = document.getElementById('pageSubtitleHeading');
  const pillBadge = document.getElementById('pageSectionPill');
  const mobileToggle = document.getElementById('mobileAdminToggle');
  const mobMenuDrawerBtn = document.getElementById('mobMenuDrawerBtn');
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  const metaMap = {
    internshipsSection: {
      title: 'Internship & Candidate Registry',
      subtitle: '2-Month Training Program applicants, offer letters, recommendations & official verification',
      pill: 'REGISTRY'
    },
    analyticsSection: {
      title: 'Live Analytics & Telemetry Hub',
      subtitle: 'Real-time domain metrics, funnel conversion rates, university distribution & activity feed',
      pill: 'TELEMETRY'
    },
    consultationsSection: {
      title: 'Architecture & Strategy Consultations',
      subtitle: 'Client project briefs, strategy session bookings & scope estimates',
      pill: 'CONSULTATIONS'
    },
    settingsSection: {
      title: 'Portal Controls & Registration Management',
      subtitle: 'Form status toggles, lead instructor config, digital stamp & default cohort dates',
      pill: 'CONTROLS'
    },
    qrVerificationSection: {
      title: 'QR Authenticity & Credential Verifier',
      subtitle: 'Live lookup and integrity validation for all issued candidate credentials',
      pill: 'VERIFIER'
    }
  };

  function switchSection(targetSection) {
    if (!targetSection) return;

    // Update Sidebar links active state
    navLinks.forEach(l => {
      l.classList.toggle('active', l.dataset.section === targetSection);
    });

    // Update Mobile Bottom Nav active state
    bottomNavBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.section === targetSection);
    });

    // Toggle tab panes
    tabPanes.forEach(pane => {
      pane.style.display = pane.id === targetSection ? 'block' : 'none';
    });

    // Update Topbar header titles
    if (metaMap[targetSection]) {
      if (heading) heading.textContent = metaMap[targetSection].title;
      if (subHeading) subHeading.textContent = metaMap[targetSection].subtitle;
      if (pillBadge) pillBadge.textContent = metaMap[targetSection].pill;
    }

    // Close mobile drawer and backdrop if open
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');

    // Trigger section-specific initializers
    if (targetSection === 'analyticsSection') renderAnalyticsCharts();
    if (targetSection === 'consultationsSection') loadConsultations();
    if (targetSection === 'settingsSection') loadSettings();

    // Scroll workspace back to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Sidebar links
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      switchSection(link.dataset.section);
    });
  });

  // Mobile bottom navigation bar links
  bottomNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchSection(btn.dataset.section);
    });
  });

  // Drawer Toggle Helpers
  function toggleSidebarDrawer() {
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('active', isOpen);
  }

  function closeSidebarDrawer() {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }

  if (mobileToggle) mobileToggle.addEventListener('click', toggleSidebarDrawer);
  if (mobMenuDrawerBtn) mobMenuDrawerBtn.addEventListener('click', toggleSidebarDrawer);
  if (backdrop) backdrop.addEventListener('click', closeSidebarDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebarDrawer();
  });

  // Check for direct tab deep link (e.g. ?tab=analytics or #analytics)
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
  const tabParam = urlParams.get('tab') || hash;
  if (tabParam) {
    const sectionId = tabParam.endsWith('Section') ? tabParam : `${tabParam}Section`;
    setTimeout(() => {
      switchSection(sectionId);
    }, 150);
  }
}

/* ============================================================
   3. INTERNSHIP REGISTRY (SHOWN FIRST)
   ============================================================ */
function initInternsManager() {
  const searchInput = document.getElementById('internSearchInput');
  const domainFilter = document.getElementById('domainFilterSelect');
  const statusFilter = document.getElementById('statusFilterSelect');
  const btnRefresh = document.getElementById('btnRefreshInterns');
  const btnExport = document.getElementById('btnExportCSV');

  if (searchInput) searchInput.addEventListener('input', filterAndRenderInterns);
  if (domainFilter) domainFilter.addEventListener('change', filterAndRenderInterns);
  if (statusFilter) statusFilter.addEventListener('change', filterAndRenderInterns);
  if (btnRefresh) btnRefresh.addEventListener('click', loadInterns);

  // Interactive KPI card click-filters
  document.querySelectorAll('.kpi-card[data-kpi-filter]').forEach(card => {
    card.addEventListener('click', () => {
      const filterVal = card.dataset.kpiFilter;
      if (statusFilter) {
        statusFilter.value = filterVal;
        filterAndRenderInterns();
      }
    });
  });

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (!allInternsData.length) {
        alert('No intern records available to export.');
        return;
      }
      let csv = 'ID,Full Name,Domain,Qualification,Institute,City,WhatsApp,Email,Gender,Status,Start Date,Completion Date,Batch,Created At\n';
      allInternsData.forEach(i => {
        csv += `"${i.id}","${i.fullName}","${i.domain}","${i.qualification}","${i.institute}","${i.city}","${i.whatsapp}","${i.email}","${i.gender||''}","${i.status}","${i.startDate||''}","${i.completionDate||''}","${i.batch||''}","${i.createdAt}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uzair_ai_studio_interns_${Date.now()}.csv`;
      a.click();
    });
  }

  // Modal setup
  const modal = document.getElementById('editInternModal');
  const btnClose = document.getElementById('btnModalClose');
  const btnCancel = document.getElementById('btnCancelEdit');
  const editForm = document.getElementById('editInternForm');

  if (btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');
  if (btnCancel) btnCancel.addEventListener('click', () => modal.style.display = 'none');
  const btnResetPw = document.getElementById('btnAdminResetPw');
  if (btnResetPw) {
    btnResetPw.addEventListener('click', () => {
      const modalId = document.getElementById('editModalId').value;
      if (modalId) {
        document.getElementById('editPortalPassword').value = modalId;
        alert(`Password field set to default ID: ${modalId}. Click 'Save Changes' to update.`);
      }
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editModalId').value;
      const updates = {
        fullName: document.getElementById('editFullName').value.trim(),
        email: document.getElementById('editPortalEmail').value.trim(),
        password: document.getElementById('editPortalPassword').value.trim(),
        gender: document.getElementById('editGender').value,
        domain: document.getElementById('editDomain').value,
        status: document.getElementById('editStatus').value,
        startDate: document.getElementById('editStartDate').value,
        completionDate: document.getElementById('editCompletionDate').value,
        issueDate: document.getElementById('editIssueDate').value.trim(),
        recommendationDate: document.getElementById('editRecommendationDate').value.trim(),
        duration: document.getElementById('editDuration').value.trim(),
        batch: document.getElementById('editBatch').value.trim(),
        notes: document.getElementById('editNotes').value.trim()
      };

      try {
        const res = await adminFetch(`/api/admin/interns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.success) {
          modal.style.display = 'none';
          loadInterns();
        } else {
          alert('Error updating intern: ' + data.message);
        }
      } catch (err) {
        alert('Connection error saving intern.');
      }
    });
  }
}

async function loadInterns() {
  const tbody = document.getElementById('internsTableBody');
  try {
    const res = await adminFetch('/api/admin/interns');
    const json = await res.json();
    if (json.success) {
      allInternsData = json.data || [];
      updateKPIs(allInternsData);
      filterAndRenderInterns();
    }
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#EF4444; padding:24px;">Failed to load intern records from server.</td></tr>`;
    }
  }
}

function updateKPIs(interns) {
  document.getElementById('kpiTotalInterns').textContent = interns.length;
  document.getElementById('kpiPendingLetters').textContent = interns.filter(i => (i.status || '').includes('Pending')).length;
  document.getElementById('kpiActiveInterns').textContent = interns.filter(i => (i.status || '').includes('Active') || (i.status || '').includes('Released')).length;
  document.getElementById('kpiCompletedInterns').textContent = interns.filter(i => (i.status || '').includes('Completed')).length;
}

function filterAndRenderInterns() {
  const tbody = document.getElementById('internsTableBody');
  const mobileGrid = document.getElementById('internsMobileGrid');
  const countEl = document.getElementById('candidateCountVisible');
  if (!tbody) return;

  const q = (document.getElementById('internSearchInput')?.value || '').toLowerCase();
  const domain = document.getElementById('domainFilterSelect')?.value || 'ALL';
  const status = document.getElementById('statusFilterSelect')?.value || 'ALL';

  const filtered = allInternsData.filter(i => {
    const matchQ = !q || 
      (i.fullName && i.fullName.toLowerCase().includes(q)) ||
      (i.id && i.id.toLowerCase().includes(q)) ||
      (i.email && i.email.toLowerCase().includes(q)) ||
      (i.whatsapp && i.whatsapp.includes(q)) ||
      (i.institute && i.institute.toLowerCase().includes(q)) ||
      (i.city && i.city.toLowerCase().includes(q));

    const matchDomain = domain === 'ALL' || i.domain === domain;
    const matchStatus = status === 'ALL' || (i.status || '').includes(status);

    return matchQ && matchDomain && matchStatus;
  });

  if (countEl) countEl.textContent = filtered.length;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#64748B;">No candidate records found matching current filters.</td></tr>`;
    if (mobileGrid) {
      mobileGrid.innerHTML = `<div style="text-align:center; padding:32px; color:#64748B; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px;">No candidate records found matching current filters.</div>`;
    }
    return;
  }

  // 1. Render Desktop / Tablet Table Rows
  tbody.innerHTML = filtered.map(i => {
    const dateFormatted = new Date(i.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isWaJoined = i.whatsappGroupJoined === 'Yes';

    return `
      <tr>
        <td>
          <span class="id-tag" onclick="navigator.clipboard.writeText('${i.id}'); alert('Copied ID: ${i.id}');" title="Click to copy ID" style="cursor:pointer;">${i.id} 📋</span>
          <span style="font-size:0.72rem; color:#64748B; display:block; margin-top:3px;">📅 ${dateFormatted}</span>
        </td>
        <td>
          <strong style="display:block; color:#0F172A; font-size:0.85rem;">${i.fullName}</strong>
          <span style="font-size:0.72rem; color:#64748B;">📍 ${i.city || 'Pakistan'} &bull; ${i.gender || 'Student'}</span>
        </td>
        <td><span class="domain-tag">${i.domain}</span></td>
        <td>
          <div style="font-size:0.78rem; font-weight:700; color:#1E293B;">${i.qualification}</div>
          <div style="font-size:0.72rem; color:#64748B; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${i.institute}">${i.institute}</div>
        </td>
        <td>
          <div style="font-weight:700;">
            <a href="https://wa.me/${(i.whatsapp||'').replace(/[^\d]/g, '')}" target="_blank" style="color:#059669; text-decoration:none;">${i.whatsapp}</a>
            <span style="font-size:0.68rem; padding:1px 5px; border-radius:4px; margin-left:4px; font-weight:700; background:${isWaJoined ? '#DCFCE7' : '#FEF3C7'}; color:${isWaJoined ? '#15803D' : '#B45309'};">
              ${isWaJoined ? 'WA Group ✅' : 'WA Group ⏳'}
            </span>
          </div>
          <div style="font-size:0.72rem; color:#64748B;">${i.email}</div>
        </td>
        <td>
          <div style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:4px 6px;">
            <div style="color:#0284C7; font-weight:700; word-break:break-all;">✉ ${i.email}</div>
            <div style="color:#D97706; font-weight:700; margin-top:2px;">🔑 <span title="Portal Password">${i.password || i.id}</span></div>
          </div>
        </td>
        <td>
          <select class="status-select-inline" onchange="quickUpdateStatus('${i.id}', this.value)">
            <option value="Application Received • Offer Letter Pending" ${i.status.includes('Pending') ? 'selected' : ''}>⏳ Pending</option>
            <option value="Offer Letter Released • Active Intern" ${i.status.includes('Released') ? 'selected' : ''}>📄 Offer Released</option>
            <option value="Active Intern • Milestone Review" ${i.status.includes('Active') ? 'selected' : ''}>🚀 Active Intern</option>
            <option value="Internship Completed • Certificate Awarded" ${i.status.includes('Completed') ? 'selected' : ''}>🎓 Completed & LOR</option>
            <option value="Application Rejected" ${i.status.includes('Rejected') ? 'selected' : ''}>❌ Rejected</option>
          </select>
        </td>
        <td>
          <div class="action-btns-group">
            <a href="/certificate?id=${i.id}" onclick="event.preventDefault(); directPrintDocument(this.href, 'Completion Certificate', '${i.fullName.replace(/'/g, "\\'")}')" class="btn-act cert" style="background:#F59E0B; color:#FFFFFF;" title="Directly Print Official Completion Certificate (Right-click to open preview)">🖨️ Cert</a>
            <a href="/offer-letter?id=${i.id}" onclick="event.preventDefault(); directPrintDocument(this.href, 'Offer Letter', '${i.fullName.replace(/'/g, "\\'")}')" class="btn-act primary" title="Directly Print Official Offer Letter (Right-click to open preview)">🖨️ Offer</a>
            <a href="/recommendation-letter?id=${i.id}" onclick="event.preventDefault(); directPrintDocument(this.href, 'Recommendation Letter (LOR)', '${i.fullName.replace(/'/g, "\\'")}')" class="btn-act lor" title="Directly Print Official Recommendation Letter (Right-click to open preview)">🖨️ LOR</a>
            <a href="/experience-letter?id=${i.id}" onclick="event.preventDefault(); directPrintDocument(this.href, 'Experience Letter', '${i.fullName.replace(/'/g, "\\'")}')" class="btn-act" style="background:#8B5CF6; color:#FFFFFF;" title="Directly Print Official Experience Letter (Right-click to open preview)">🖨️ Exp</a>
            <a href="/verify?id=${i.id}" target="_blank" class="btn-act" title="Live QR Credential Verification">🛡️ QR</a>
            <button type="button" class="btn-act wa" onclick="openCandidateWhatsApp('${i.id}')" title="Send Official Links to Candidate via WhatsApp">💬 WA</button>
            <button type="button" class="btn-act" onclick="openEditModal('${i.id}')" title="Edit candidate records & dates">✏️</button>
            <button type="button" class="btn-act danger" onclick="deleteIntern('${i.id}', '${i.fullName.replace(/'/g, "\\'")}')" title="Delete record">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // 2. Render Mobile & Tablet Candidate Cards Grid
  if (mobileGrid) {
    mobileGrid.innerHTML = filtered.map(i => {
      const dateFormatted = new Date(i.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const isWaJoined = i.whatsappGroupJoined === 'Yes';
      const cleanWa = (i.whatsapp || '').replace(/[^\d]/g, '');

      return `
        <div class="cand-card">
          <div class="cand-card-top">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
                <span class="id-tag" onclick="navigator.clipboard.writeText('${i.id}'); alert('Copied ID: ${i.id}');" style="cursor:pointer;" title="Click to copy ID">${i.id} 📋</span>
                <span class="domain-tag">${i.domain}</span>
              </div>
              <h3 class="cand-card-name">${i.fullName}</h3>
              <div class="cand-card-meta">📅 Registered: ${dateFormatted} &bull; 📍 ${i.city || 'Pakistan'}</div>
            </div>
            <div style="text-align:right;">
              <select class="status-select-inline" onchange="quickUpdateStatus('${i.id}', this.value)" style="margin-bottom:4px; max-width:180px;">
                <option value="Application Received • Offer Letter Pending" ${i.status.includes('Pending') ? 'selected' : ''}>⏳ Pending</option>
                <option value="Offer Letter Released • Active Intern" ${i.status.includes('Released') ? 'selected' : ''}>📄 Offer Released</option>
                <option value="Active Intern • Milestone Review" ${i.status.includes('Active') ? 'selected' : ''}>🚀 Active Intern</option>
                <option value="Internship Completed • Certificate Awarded" ${i.status.includes('Completed') ? 'selected' : ''}>🎓 Completed & LOR</option>
                <option value="Application Rejected" ${i.status.includes('Rejected') ? 'selected' : ''}>❌ Rejected</option>
              </select>
            </div>
          </div>

          <div class="cand-card-details-grid">
            <div class="cand-card-cell">
              <span>Academic Profile</span>
              <strong title="${i.qualification || 'N/A'} • ${i.institute || 'N/A'}">${i.qualification || 'Undergrad'}</strong>
              <small style="color:#64748B; font-size:0.7rem; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${i.institute || 'University'}</small>
            </div>
            <div class="cand-card-cell">
              <span>Contact & WhatsApp</span>
              <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                <strong style="color:#059669;">
                  <a href="https://wa.me/${cleanWa}" target="_blank" style="color:#059669; text-decoration:none;">${i.whatsapp}</a>
                </strong>
                <span style="font-size:0.65rem; padding:1px 4px; border-radius:4px; font-weight:700; background:${isWaJoined ? '#DCFCE7' : '#FEF3C7'}; color:${isWaJoined ? '#15803D' : '#B45309'};">
                  ${isWaJoined ? 'WA Group ✅' : 'WA Group ⏳'}
                </span>
              </div>
              <small style="color:#64748B; font-size:0.7rem; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${i.email}</small>
            </div>
          </div>

          <!-- Portal Account Credentials on Mobile Card -->
          <div style="margin:8px 0 10px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:6px 10px; font-size:0.75rem; font-family:'JetBrains Mono',monospace;">
            <div style="color:#166534; font-weight:700;">🔑 Portal Account:</div>
            <div style="color:#0369A1;">✉ ${i.email}</div>
            <div style="color:#D97706; font-weight:700;">Password: ${i.password || i.id}</div>
          </div>

          <div class="cand-card-actions">
            <a href="/certificate?id=${i.id}" onclick="event.preventDefault(); directPrintDocument(this.href, 'Completion Certificate', '${i.fullName.replace(/'/g, "\\'")}')" class="btn-act cert" style="background:#F59E0B; color:#FFFFFF;" title="Directly Print Official Completion Certificate (Right-click to open preview)">🖨️ Cert</a>
            <a href="/offer-letter?id=${i.id}" onclick="event.preventDefault(); directPrintDocument(this.href, 'Offer Letter', '${i.fullName.replace(/'/g, "\\'")}')" class="btn-act primary" title="Directly Print Official Offer Letter (Right-click to open preview)">🖨️ Offer</a>
            <a href="/recommendation-letter?id=${i.id}" onclick="event.preventDefault(); directPrintDocument(this.href, 'Recommendation Letter (LOR)', '${i.fullName.replace(/'/g, "\\'")}')" class="btn-act lor" title="Directly Print Official Recommendation Letter (Right-click to open preview)">🖨️ LOR</a>
            <a href="/experience-letter?id=${i.id}" onclick="event.preventDefault(); directPrintDocument(this.href, 'Experience Letter', '${i.fullName.replace(/'/g, "\\'")}')" class="btn-act" style="background:#8B5CF6; color:#FFFFFF;" title="Directly Print Official Experience Letter (Right-click to open preview)">🖨️ Exp</a>
            <a href="/verify?id=${i.id}" target="_blank" class="btn-act" title="Live QR Credential Verification">🛡️ QR</a>
            <button type="button" class="btn-act wa" onclick="openCandidateWhatsApp('${i.id}')" title="Send Official Links to Candidate via WhatsApp">💬 WA</button>
            <button type="button" class="btn-act" onclick="openEditModal('${i.id}')" title="Edit candidate records & dates">✏️ Edit</button>
            <button type="button" class="btn-act danger" onclick="deleteIntern('${i.id}', '${i.fullName.replace(/'/g, "\\'")}')" title="Delete record">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Candidate View Switcher (Cards is Default, Table when converted)
window.switchCandidateView = function(mode) {
  const tableBox = document.getElementById('internsTableBox');
  const cardGrid = document.getElementById('internsMobileGrid');
  const btnTable = document.getElementById('btnViewTable');
  const btnCards = document.getElementById('btnViewCards');

  const targetMode = mode === 'table' ? 'table' : 'cards';
  try { localStorage.setItem('admin_intern_view', targetMode); } catch(e) {}

  if (targetMode === 'cards') {
    if (tableBox) {
      tableBox.style.display = 'none';
      tableBox.classList.add('hide-on-mobile-cards');
    }
    if (cardGrid) {
      cardGrid.style.display = 'grid';
    }
    if (btnCards) btnCards.classList.add('active');
    if (btnTable) btnTable.classList.remove('active');
  } else {
    if (tableBox) {
      tableBox.style.display = 'block';
      tableBox.classList.remove('hide-on-mobile-cards');
    }
    if (cardGrid) {
      cardGrid.style.display = 'none';
    }
    if (btnTable) btnTable.classList.add('active');
    if (btnCards) btnCards.classList.remove('active');
  }
};

// Inline status update
window.quickUpdateStatus = async function(id, newStatus) {
  try {
    const res = await adminFetch(`/api/admin/interns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (json.success) {
      loadInterns();
    }
  } catch (err) {
    alert('Error updating status.');
  }
};

// Open candidate WhatsApp with direct official letter links
window.openCandidateWhatsApp = function(id) {
  const intern = allInternsData.find(i => i.id === id);
  if (!intern) return;

  const rawNum = (intern.whatsapp || '').replace(/[^0-9]/g, '');
  if (!rawNum) {
    alert('No WhatsApp number on file for this candidate.');
    return;
  }

  const origin = window.location.origin;
  const isCompleted = (intern.status || '').toLowerCase().includes('completed');
  const certLine = isCompleted ? `🎓 Certificate of Completion: ${origin}/certificate?id=${intern.id}\n💼 Experience Letter: ${origin}/experience-letter?id=${intern.id}\n` : '';

  const msg = 
    `Dear ${intern.fullName},\n\n` +
    `Congratulations! Here are your official credentials from Uzair AI Studio:\n\n` +
    certLine +
    `📄 Internship Offer Letter: ${origin}/offer-letter?id=${intern.id}\n` +
    `📜 Letter of Recommendation: ${origin}/recommendation-letter?id=${intern.id}\n` +
    `🔍 Live QR Verification Badge: ${origin}/verify?id=${intern.id}\n` +
    `Candidate Ref ID: ${intern.id}\n\n` +
    `Best Regards,\nMuhammad Uzair (Founder & Lead Architect)\nUzair AI Studio`;

  window.open(`https://wa.me/${rawNum}?text=${encodeURIComponent(msg)}`, '_blank');
};

// Open Edit Modal
window.openEditModal = function(id) {
  const intern = allInternsData.find(i => i.id === id);
  if (!intern) return;

  document.getElementById('modalInternId').textContent = intern.id;
  document.getElementById('editModalId').value = intern.id;
  document.getElementById('editPortalEmail').value = intern.email || '';
  document.getElementById('editPortalPassword').value = intern.password || intern.id;
  document.getElementById('editFullName').value = intern.fullName;
  document.getElementById('editGender').value = intern.gender || 'Male';
  document.getElementById('editDomain').value = intern.domain;
  document.getElementById('editStatus').value = intern.status;
  document.getElementById('editStartDate').value = intern.startDate || (intern.createdAt ? intern.createdAt.split('T')[0] : '');
  document.getElementById('editCompletionDate').value = intern.completionDate || '';
  document.getElementById('editIssueDate').value = intern.issueDate || '';
  document.getElementById('editRecommendationDate').value = intern.recommendationDate || '';
  document.getElementById('editDuration').value = intern.duration || '8 weeks';
  document.getElementById('editBatch').value = intern.batch || '2026 AI Department Batch';
  document.getElementById('editNotes').value = intern.notes || '';

  // Direct letter links with 1-click direct print
  const modalCert = document.getElementById('modalCertLink');
  if (modalCert) {
    modalCert.href = `/certificate?id=${intern.id}`;
    modalCert.onclick = (e) => { e.preventDefault(); directPrintDocument(modalCert.href, 'Completion Certificate', intern.fullName); };
  }
  const modalOffer = document.getElementById('modalOfferLink');
  if (modalOffer) {
    modalOffer.href = `/offer-letter?id=${intern.id}`;
    modalOffer.onclick = (e) => { e.preventDefault(); directPrintDocument(modalOffer.href, 'Offer Letter', intern.fullName); };
  }
  const modalLor = document.getElementById('modalLorLink');
  if (modalLor) {
    modalLor.href = `/recommendation-letter?id=${intern.id}`;
    modalLor.onclick = (e) => { e.preventDefault(); directPrintDocument(modalLor.href, 'Recommendation Letter (LOR)', intern.fullName); };
  }
  const modalExp = document.getElementById('modalExpLink');
  if (modalExp) {
    modalExp.href = `/experience-letter?id=${intern.id}`;
    modalExp.onclick = (e) => { e.preventDefault(); directPrintDocument(modalExp.href, 'Experience Letter', intern.fullName); };
  }
  const modalVerify = document.getElementById('modalVerifyLink');
  if (modalVerify) modalVerify.href = `/verify?id=${intern.id}`;

  document.getElementById('editInternModal').style.display = 'flex';
};

// Delete intern
window.deleteIntern = async function(id, name) {
  if (!confirm(`Are you sure you want to permanently delete the application of "${name}" (${id})?`)) return;

  try {
    const res = await adminFetch(`/api/admin/interns/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      loadInterns();
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Error deleting intern record.');
  }
};

/* ============================================================
   ADMIN DIRECT PRINT ENGINE & TOAST NOTIFIER
   Triggers instant print dialog for official candidate documents
   without navigating away to another page.
   ============================================================ */
window.showAdminToast = function(message, type = 'info') {
  let toast = document.getElementById('adminGlobalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminGlobalToast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }

  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  toast.className = `admin-toast ${type} show`;
  toast.innerHTML = `<span class="toast-icon">${iconMap[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;

  clearTimeout(window.__adminToastTimer);
  window.__adminToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
};

window.directPrintDocument = function(rawUrl, docTitle, candidateName) {
  if (!rawUrl || rawUrl === '#' || rawUrl.endsWith('#')) {
    window.showAdminToast('⚠️ Document link is not ready yet.', 'warning');
    return;
  }

  const cleanName = candidateName || 'Candidate';
  const cleanTitle = docTitle || 'Official Document';

  window.showAdminToast(`🖨️ Opening print dialog for ${cleanTitle} (${cleanName})...`, 'info');

  // Remove existing frame if any to ensure clean print cycle
  const oldFrame = document.getElementById('adminDocumentPrintFrame');
  if (oldFrame) {
    try { oldFrame.remove(); } catch(e) {}
  }

  const printFrame = document.createElement('iframe');
  printFrame.id = 'adminDocumentPrintFrame';
  printFrame.name = 'adminDocumentPrintFrame';
  // Use exact standard A4 proportions for accurate print layout engine, positioned off-screen
  printFrame.style.position = 'fixed';
  printFrame.style.left = '-9999px';
  printFrame.style.top = '-9999px';
  printFrame.style.width = '794px';
  printFrame.style.height = '1123px';
  printFrame.style.border = 'none';
  printFrame.style.opacity = '0';
  printFrame.style.pointerEvents = 'none';
  printFrame.style.zIndex = '-9999';
  document.body.appendChild(printFrame);

  const sep = rawUrl.includes('?') ? '&' : '?';
  const targetUrl = `${rawUrl}${sep}autoprint=1&ts=${Date.now()}`;

  let printExecuted = false;
  const executePrint = () => {
    if (printExecuted) return;
    printExecuted = true;
    try {
      if (printFrame.contentWindow) {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        window.showAdminToast(`✅ Ready to print: ${cleanName}'s ${cleanTitle}`, 'success');
      }
    } catch (err) {
      console.warn('Direct print execution fallback:', err);
      // Graceful fallback to opening in new tab if iframe printing is restricted
      window.open(rawUrl, '_blank');
    }
  };

  // 1. PostMessage notification from inside the document once async data & QR are painted
  const handleMsg = (ev) => {
    if (ev.data && ev.data.type === 'UZAIR_DOC_PRINTED') {
      window.removeEventListener('message', handleMsg);
      executePrint();
    }
  };
  window.addEventListener('message', handleMsg);

  // 2. Fallback timeout after frame load in case postMessage didn't fire
  printFrame.onload = () => {
    setTimeout(() => {
      window.removeEventListener('message', handleMsg);
      executePrint();
    }, 750);
  };

  printFrame.src = targetUrl;
};

/* ============================================================
   4. ANALYTICS CHARTS & TELEMETRY
   ============================================================ */
let currentAnalyticsStats = null;
let currentActivityFeed = [];
let currentActFilter = 'ALL';
let currentAnalyticsPeriod = 'all';

function initAnalyticsTab() {
  // Timeframe selector buttons
  const tfBtns = document.querySelectorAll('#analyticsTimeframeGroup .timeframe-btn');
  tfBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tfBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const period = btn.dataset.period || 'all';
      currentAnalyticsPeriod = period;
      renderAnalyticsCharts(period);
    });
  });

  // Refresh Telemetry
  const btnRefresh = document.getElementById('btnRefreshAnalytics');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      btnRefresh.style.opacity = '0.6';
      renderAnalyticsCharts(currentAnalyticsPeriod).finally(() => {
        setTimeout(() => { btnRefresh.style.opacity = '1'; }, 500);
      });
    });
  }

  // Export Analytics CSV
  const btnExport = document.getElementById('btnExportAnalyticsCsv');
  if (btnExport) {
    btnExport.addEventListener('click', exportAnalyticsCsv);
  }

  // Live Activity category filter tabs
  const actTabs = document.querySelectorAll('#activityFilterTabs .view-btn');
  actTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      actTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentActFilter = tab.dataset.actFilter || 'ALL';
      renderFilteredActivityFeed();
    });
  });
}

async function renderAnalyticsCharts(period = currentAnalyticsPeriod || 'all') {
  currentAnalyticsPeriod = period;
  const domainBox = document.getElementById('domainBarsContainer');
  const statusBox = document.getElementById('statusBarsContainer');
  const academicBox = document.getElementById('academicBarsContainer');

  try {
    const res = await adminFetch(`/api/admin/stats?period=${encodeURIComponent(period)}`);
    const json = await res.json();
    if (!json.success) return;

    const stats = json.stats;
    currentAnalyticsStats = stats;
    currentActivityFeed = stats.activityFeed || [];

    const domainCounts = stats.domainBreakdown || {};
    const statusCounts = stats.statusBreakdown || {};
    const universityCounts = stats.universityBreakdown || {};
    const qualificationCounts = stats.qualificationBreakdown || {};

    // Top KPI counters - adjust dynamically by timeframe if filtered
    const elTotal = document.getElementById('analyticsTotalCandidates');
    const elAccept = document.getElementById('analyticsAcceptanceRate');
    const elActive = document.getElementById('analyticsActiveInterns');
    const elCertified = document.getElementById('analyticsCertifiedGrads');
    const elInquiries = document.getElementById('analyticsTotalInquiries');
    const elCandSub = document.getElementById('analyticsCandidateSub');

    let totalCandidateMetric = stats.totalInterns || 0;
    let totalInquiriesMetric = (stats.totalClientConsultations || 0) + (stats.totalArchitecturePlans || 0);

    if (period !== 'all' && stats.timeframeStats && stats.timeframeStats[period]) {
      const tf = stats.timeframeStats[period];
      totalCandidateMetric = tf.interns;
      totalInquiriesMetric = tf.inquiries;
      const periodLabels = {
        '30d': 'Past 30 Days',
        '7d': 'Past 7 Days',
        'today': 'Today Only'
      };
      if (elCandSub) elCandSub.textContent = `● Timeframe: ${periodLabels[period] || period}`;
    } else {
      if (elCandSub) elCandSub.textContent = '● Across All Domains';
    }

    if (elTotal) elTotal.textContent = totalCandidateMetric;
    if (elAccept) elAccept.textContent = `${stats.acceptanceRate || 0}%`;
    if (elActive) elActive.textContent = stats.activeInterns || 0;
    if (elCertified) elCertified.textContent = stats.completedInterns || 0;
    if (elInquiries) elInquiries.textContent = totalInquiriesMetric;

    // Render 14-Day Velocity Area & Line Chart
    renderVelocitySvgChart(stats.dailyTrend || []);

    const total = Math.max(stats.totalInterns || 1, 1);

    // 1. Domain Popularity Progress Bars
    const domainColorMap = {
      'Generative AI': 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 100%)',
      'Data Science': 'linear-gradient(90deg, #0284C7 0%, #06B6D4 100%)',
      'Web Development': 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)',
      'Python Development': 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
      'Front-End Development': 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)'
    };

    if (domainBox) {
      const keys = Object.keys(domainCounts);
      if (!keys.length) {
        domainBox.innerHTML = '<p style="color:#64748B; font-size:0.85rem;">No candidate domain registrations recorded yet.</p>';
      } else {
        domainBox.innerHTML = keys.map(dom => {
          const cnt = domainCounts[dom];
          const pct = Math.round((cnt / total) * 100);
          const color = domainColorMap[dom] || 'linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)';
          return `
            <div style="margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.825rem; font-weight:700; margin-bottom:5px;">
                <span style="color:#0F172A;">${dom}</span>
                <span style="color:#475569; font-weight:800;">${cnt} candidate${cnt > 1 ? 's' : ''} <span style="color:#2563EB;">(${pct}%)</span></span>
              </div>
              <div style="background:#F1F5F9; height:10px; border-radius:999px; overflow:hidden; border:1px solid #E2E8F0;">
                <div style="background:${color}; width:${pct}%; height:100%; border-radius:999px; transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Candidate Funnel Progression
    if (statusBox) {
      const activeCnt = stats.activeInterns || 0;
      const completedCnt = stats.completedInterns || 0;

      const funnelStages = [
        { label: 'Step 1: Application Received & Verified', count: total, color: '#2563EB', icon: '📝' },
        { label: 'Step 2: Offer Letter Issued & Dispatched', count: activeCnt + completedCnt, color: '#0284C7', icon: '📄' },
        { label: 'Step 3: Active Sprint In Progress', count: activeCnt, color: '#059669', icon: '🚀' },
        { label: 'Step 4: Certified Graduate with LOR', count: completedCnt, color: '#10B981', icon: '🎓' }
      ];

      statusBox.innerHTML = funnelStages.map(st => {
        const pct = Math.round((st.count / total) * 100);
        return `
          <div style="margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.825rem; font-weight:700; margin-bottom:5px;">
              <span>${st.icon} ${st.label}</span>
              <span style="color:#0F172A; font-weight:800;">${st.count} <span style="color:#64748B; font-weight:600;">(${pct}%)</span></span>
            </div>
            <div style="background:#F1F5F9; height:10px; border-radius:999px; overflow:hidden; border:1px solid #E2E8F0;">
              <div style="background:${st.color}; width:${pct}%; height:100%; border-radius:999px; transition:width 0.8s ease;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. Academic Backgrounds & Institutes
    if (academicBox) {
      const uKeys = Object.keys(universityCounts);
      const qKeys = Object.keys(qualificationCounts);

      let html = '<div style="margin-bottom:14px;"><strong style="display:block; font-size:0.75rem; text-transform:uppercase; color:#64748B; margin-bottom:8px; letter-spacing:0.04em;">Top Universities</strong>';
      if (!uKeys.length) {
        html += '<p style="color:#64748B; font-size:0.8rem;">No academic institutions logged.</p>';
      } else {
        html += uKeys.slice(0, 4).map(u => `
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; padding:5px 0; border-bottom:1px dashed #F1F5F9;">
            <span style="font-weight:600; color:#1E293B;">🏛️ ${u}</span>
            <span style="font-weight:700; color:#1D4ED8;">${universityCounts[u]}</span>
          </div>
        `).join('');
      }
      html += '</div>';

      html += '<div><strong style="display:block; font-size:0.75rem; text-transform:uppercase; color:#64748B; margin-bottom:8px; letter-spacing:0.04em;">Degree Qualifications</strong><div style="display:flex; gap:6px; flex-wrap:wrap;">';
      if (!qKeys.length) {
        html += '<p style="color:#64748B; font-size:0.8rem;">No qualifications recorded.</p>';
      } else {
        html += qKeys.map(q => `
          <span style="background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px;">
            ${q} (${qualificationCounts[q]})
          </span>
        `).join('');
      }
      html += '</div></div>';

      academicBox.innerHTML = html;
    }

    // 4. Render Live Activity Stream
    renderFilteredActivityFeed();

  } catch (err) {
    console.error('Analytics load error:', err);
  }
}

// Draw Responsive High-Definition SVG Velocity Area & Line Chart
function renderVelocitySvgChart(dailyTrend) {
  const container = document.getElementById('analyticsSvgChartWrap');
  if (!container) return;

  if (!dailyTrend || !dailyTrend.length) {
    container.innerHTML = `<div style="text-align:center; padding:40px; color:#64748B; font-size:0.85rem;">No historical registration trend data available yet.</div>`;
    return;
  }

  const W = 760;
  const H = 210;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 35;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;
  const baseY = padTop + plotH;

  const maxVal = Math.max(
    ...dailyTrend.map(d => Math.max(d.interns || 0, d.inquiries || 0)),
    3
  );

  const n = dailyTrend.length;
  const xStep = n > 1 ? plotW / (n - 1) : plotW;

  const getX = (i) => padLeft + i * xStep;
  const getY = (val) => padTop + plotH - ((val / maxVal) * plotH);

  // Points for Interns (Blue)
  const ptsInterns = dailyTrend.map((d, i) => ({ x: getX(i), y: getY(d.interns || 0), val: d.interns || 0, label: d.label, date: d.date }));
  // Points for Inquiries (Purple)
  const ptsInquiries = dailyTrend.map((d, i) => ({ x: getX(i), y: getY(d.inquiries || 0), val: d.inquiries || 0, label: d.label, date: d.date }));

  function buildPathD(pts) {
    if (!pts.length) return '';
    return pts.map((p, i) => (i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)).join(' ');
  }

  const lineInterns = buildPathD(ptsInterns);
  const areaInterns = `${lineInterns} L ${ptsInterns[ptsInterns.length - 1].x.toFixed(1)} ${baseY} L ${ptsInterns[0].x.toFixed(1)} ${baseY} Z`;

  const lineInquiries = buildPathD(ptsInquiries);
  const areaInquiries = `${lineInquiries} L ${ptsInquiries[ptsInquiries.length - 1].x.toFixed(1)} ${baseY} L ${ptsInquiries[0].x.toFixed(1)} ${baseY} Z`;

  // Gridlines & Y-axis labels
  const gridSteps = [0, Math.ceil(maxVal / 2), maxVal];
  const gridLines = gridSteps.map(v => {
    const yPos = getY(v);
    return `
      <line x1="${padLeft}" y1="${yPos}" x2="${W - padRight}" y2="${yPos}" stroke="#F1F5F9" stroke-width="1.2" stroke-dasharray="3,3" />
      <text x="${padLeft - 8}" y="${yPos + 4}" fill="#94A3B8" font-size="10" font-weight="700" text-anchor="end" font-family="'JetBrains Mono', monospace">${v}</text>
    `;
  }).join('');

  // X-axis date labels
  const stepMod = n > 10 ? 2 : 1;
  const xLabels = dailyTrend.map((d, i) => {
    if (i % stepMod !== 0 && i !== n - 1) return '';
    const xPos = getX(i);
    return `<text x="${xPos}" y="${baseY + 18}" fill="#64748B" font-size="10" font-weight="600" text-anchor="middle">${d.label}</text>`;
  }).join('');

  // Interactive dots
  const dotsInterns = ptsInterns.map(p => `
    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#2563EB" stroke="#FFFFFF" stroke-width="2" style="cursor:pointer;">
      <title>${p.label} (${p.date}): ${p.val} Verified Candidate${p.val === 1 ? '' : 's'}</title>
    </circle>
  `).join('');

  const dotsInquiries = ptsInquiries.map(p => `
    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="2" style="cursor:pointer;">
      <title>${p.label} (${p.date}): ${p.val} Client Brief${p.val === 1 ? '' : 's'}</title>
    </circle>
  `).join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%;">
      <defs>
        <linearGradient id="chartGradCandidates" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2563EB" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#2563EB" stop-opacity="0.01" />
        </linearGradient>
        <linearGradient id="chartGradInquiries" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.24" />
          <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.01" />
        </linearGradient>
      </defs>

      <!-- Dotted Gridlines -->
      ${gridLines}

      <!-- Baseline -->
      <line x1="${padLeft}" y1="${baseY}" x2="${W - padRight}" y2="${baseY}" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Gradient Area Fills -->
      <path d="${areaInterns}" fill="url(#chartGradCandidates)" />
      <path d="${areaInquiries}" fill="url(#chartGradInquiries)" />

      <!-- Trend Lines -->
      <path d="${lineInterns}" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="${lineInquiries}" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

      <!-- X-axis Date Markers -->
      ${xLabels}

      <!-- Interactive Data Dots with Native Tooltips -->
      ${dotsInquiries}
      ${dotsInterns}
    </svg>
  `;
}

// Filtered Activity Feed Renderer
function renderFilteredActivityFeed() {
  const activityBox = document.getElementById('activityFeedContainer');
  if (!activityBox) return;

  const filtered = (currentActivityFeed || []).filter(act => {
    if (currentActFilter === 'ALL') return true;
    if (currentActFilter === 'intern') {
      return act.type === 'intern' || (act.title && (act.title.includes('Candidate') || act.title.includes('Intern') || act.title.includes('Offer')));
    }
    if (currentActFilter === 'client') {
      return act.type === 'client' || (act.title && (act.title.includes('Consultation') || act.title.includes('Scope') || act.title.includes('Strategy') || act.title.includes('Architecture')));
    }
    return true;
  });

  if (!filtered.length) {
    activityBox.innerHTML = '<p style="color:#64748B; font-size:0.85rem; padding:12px; text-align:center;">No matching activity logged for this category.</p>';
    return;
  }

  activityBox.innerHTML = filtered.map(act => {
    let timeStr = 'Recent';
    if (act.timestamp && act.timestamp !== 'Recent') {
      const p = new Date(act.timestamp);
      if (!isNaN(p.getTime())) {
        timeStr = p.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } else {
        timeStr = act.timestamp;
      }
    }
    return `
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 12px; display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.25rem;">${act.icon || '📌'}</span>
        <div style="flex:1; min-width:0;">
          <strong style="display:block; font-size:0.825rem; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${act.title}</strong>
          <span style="font-size:0.725rem; color:#64748B;">${act.subtitle}</span>
        </div>
        <span style="font-size:0.68rem; color:#94A3B8; font-weight:600; white-space:nowrap;">${timeStr}</span>
      </div>
    `;
  }).join('');
}

// Export Comprehensive Analytics Report CSV
function exportAnalyticsCsv() {
  if (!currentAnalyticsStats) {
    alert('Analytics data is still loading. Please try again in a moment.');
    return;
  }
  const s = currentAnalyticsStats;
  let csv = '=== UZAIR AI STUDIO - EXECUTIVE ANALYTICS & TELEMETRY REPORT ===\n';
  csv += `Generated At,"${new Date().toISOString()}"\n\n`;

  csv += '--- KEY METRICS SUMMARY ---\n';
  csv += 'Metric,Value\n';
  csv += `Total Registered Candidates,${s.totalInterns || 0}\n`;
  csv += `Acceptance Rate,${s.acceptanceRate || 0}%\n`;
  csv += `Active Sprint Interns,${s.activeInterns || 0}\n`;
  csv += `Certified Graduates (LOR Ready),${s.completedInterns || 0}\n`;
  csv += `Client Consultations Booked,${(s.totalClientConsultations || 0) + (s.totalArchitecturePlans || 0)}\n\n`;

  csv += '--- DOMAIN BREAKDOWN ---\n';
  csv += 'Domain,Candidate Count,Share Percentage\n';
  const total = Math.max(s.totalInterns || 1, 1);
  const doms = s.domainBreakdown || {};
  Object.keys(doms).forEach(d => {
    const cnt = doms[d];
    const pct = Math.round((cnt / total) * 100);
    csv += `"${d}",${cnt},${pct}%\n`;
  });
  csv += '\n';

  csv += '--- 14-DAY VELOCITY DAILY TREND ---\n';
  csv += 'Date,Label,Candidates,Client Inquiries\n';
  const daily = s.dailyTrend || [];
  daily.forEach(d => {
    csv += `"${d.date}","${d.label}",${d.interns || 0},${d.inquiries || 0}\n`;
  });
  csv += '\n';

  csv += '--- RECENT TELEMETRY EVENT LOG ---\n';
  csv += 'Timestamp,Category,Event Title,Details\n';
  const acts = s.activityFeed || [];
  acts.forEach(a => {
    csv += `"${a.timestamp || ''}","${a.type || 'system'}","${(a.title || '').replace(/"/g, '""')}","${(a.subtitle || '').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Uzair_AI_Studio_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ============================================================
   5. ARCHITECTURE & STRATEGY CONSULTATIONS (ENTERPRISE MANAGEMENT)
   ============================================================ */
let filteredConsultations = [];

function initConsultationsManager() {
  const btnRefresh = document.getElementById('btnRefreshConsultations');
  const searchInput = document.getElementById('consultationSearchInput');
  const typeSelect = document.getElementById('consultationTypeSelect');
  const statusSelect = document.getElementById('consultationStatusSelect');
  const btnExport = document.getElementById('btnExportConsultationsCsv');

  if (btnRefresh) btnRefresh.addEventListener('click', loadConsultations);
  if (searchInput) searchInput.addEventListener('input', filterAndRenderConsultations);
  if (typeSelect) typeSelect.addEventListener('change', filterAndRenderConsultations);
  if (statusSelect) statusSelect.addEventListener('change', filterAndRenderConsultations);
  if (btnExport) btnExport.addEventListener('click', exportConsultationsCsv);

  // Modal Handlers
  const modal = document.getElementById('consultationDetailModal');
  const btnClose = document.getElementById('btnConsultationModalClose');
  const btnCancel = document.getElementById('btnCancelConsultationModal');
  const form = document.getElementById('consultationUpdateForm');
  const btnDel = document.getElementById('btnDeleteConsultation');

  if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('open'));
  if (btnCancel) btnCancel.addEventListener('click', () => modal.classList.remove('open'));

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('cModalHiddenId').value;
      const status = document.getElementById('cModalStatusSelect').value;
      const notes = document.getElementById('cModalNotes').value;

      try {
        const res = await adminFetch(`/api/admin/consultations/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, adminNotes: notes })
        });
        const json = await res.json();
        if (json.success) {
          modal.classList.remove('open');
          loadConsultations();
        } else {
          alert(json.message);
        }
      } catch (err) {
        alert('Error updating consultation inquiry.');
      }
    });
  }

  if (btnDel) {
    btnDel.addEventListener('click', async () => {
      const id = document.getElementById('cModalHiddenId').value;
      if (!confirm(`Are you sure you want to permanently remove consultation inquiry ${id}?`)) return;

      try {
        const res = await adminFetch(`/api/admin/consultations/${encodeURIComponent(id)}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          modal.classList.remove('open');
          loadConsultations();
        } else {
          alert(json.message);
        }
      } catch (err) {
        alert('Error removing inquiry.');
      }
    });
  }
}

async function loadConsultations() {
  const tbody = document.getElementById('consultationsTableBody');
  if (!tbody) return;

  try {
    const res = await adminFetch('/api/admin/consultations');
    const json = await res.json();
    if (!json.success) return;

    const subs = (json.submissions || []).map(s => ({
      ...s,
      inquiryType: 'STRATEGY',
      typeLabel: 'Strategy Session'
    }));

    const ests = (json.estimates || []).map(e => ({
      id: e.id,
      name: e.contactInfo ? e.contactInfo.name : 'Architecture Client',
      email: e.contactInfo ? e.contactInfo.email : 'N/A',
      phone: e.contactInfo ? e.contactInfo.phone : 'Not provided',
      service: e.projectType ? e.projectType.toUpperCase() : 'Custom Solution',
      projectScale: `${e.sprints || 2} Sprints (${e.timelineSpeed || 'Standard'})`,
      timeline: e.squad || 'Agile Squad',
      message: (e.features && e.features.length) ? `Features requested: ${e.features.join(', ')}. Client notes: ${e.notes || 'None'}` : (e.notes || 'Scope planner submission'),
      createdAt: e.generatedAt || e.createdAt,
      status: e.status || 'New',
      inquiryType: 'ESTIMATOR',
      typeLabel: 'Scope Planner'
    }));

    allConsultationsData = [...subs, ...ests];
    allConsultationsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Update KPI counters
    const totalCount = allConsultationsData.length;
    const stratCount = subs.length;
    const estCount = ests.length;
    const newCount = allConsultationsData.filter(c => (c.status || 'New').toLowerCase() === 'new').length;
    const scheduledCount = allConsultationsData.filter(c => (c.status || '').toLowerCase().includes('schedule') || (c.status || '').toLowerCase().includes('contact')).length;

    const kpiTot = document.getElementById('kpiTotalConsultations');
    const kpiStrat = document.getElementById('kpiStrategyConsultations');
    const kpiEst = document.getElementById('kpiEstimatesCount');
    const kpiNew = document.getElementById('kpiNewConsultations');
    const kpiSched = document.getElementById('kpiScheduledConsultations');

    if (kpiTot) kpiTot.textContent = totalCount;
    if (kpiStrat) kpiStrat.textContent = stratCount;
    if (kpiEst) kpiEst.textContent = estCount;
    if (kpiNew) kpiNew.textContent = newCount;
    if (kpiSched) kpiSched.textContent = scheduledCount;

    filterAndRenderConsultations();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#EF4444; padding:24px;">Error connecting to consultations database.</td></tr>`;
  }
}

function filterAndRenderConsultations() {
  const tbody = document.getElementById('consultationsTableBody');
  if (!tbody) return;

  const searchTerm = (document.getElementById('consultationSearchInput')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('consultationTypeSelect')?.value || 'ALL';
  const statusFilter = document.getElementById('consultationStatusSelect')?.value || 'ALL';

  filteredConsultations = allConsultationsData.filter(item => {
    // Type Filter
    if (typeFilter !== 'ALL' && item.inquiryType !== typeFilter) return false;

    // Status Filter
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

    // Search Filter
    if (searchTerm) {
      const matchName = (item.name || '').toLowerCase().includes(searchTerm);
      const matchEmail = (item.email || '').toLowerCase().includes(searchTerm);
      const matchPhone = (item.phone || '').toLowerCase().includes(searchTerm);
      const matchService = (item.service || '').toLowerCase().includes(searchTerm);
      const matchMsg = (item.message || '').toLowerCase().includes(searchTerm);
      const matchId = (item.id || '').toLowerCase().includes(searchTerm);
      return matchName || matchEmail || matchPhone || matchService || matchMsg || matchId;
    }

    return true;
  });

  const mobileGrid = document.getElementById('consultationsMobileGrid');
  const countEl = document.getElementById('consultationCountVisible');
  if (countEl) countEl.textContent = filteredConsultations.length;

  if (!filteredConsultations.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#64748B;">No consultations matching your filters.</td></tr>`;
    if (mobileGrid) {
      mobileGrid.innerHTML = `<div style="text-align:center; padding:32px; color:#64748B; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px;">No consultations matching your filters.</div>`;
    }
    return;
  }

  // 1. Render Desktop / Tablet Table Rows
  tbody.innerHTML = filteredConsultations.map(sub => {
    const dateStr = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const cleanPhone = (sub.phone || '').replace(/[^\d]/g, '');
    const isNew = (sub.status || 'New') === 'New';

    const statusBadgeMap = {
      'New': 'background:#FEF3C7; color:#92400E; border:1px solid #FDE68A;',
      'Contacted': 'background:#E0F2FE; color:#0369A1; border:1px solid #BAE6FD;',
      'Call Scheduled': 'background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0;',
      'Proposal Sent': 'background:#EDE9FE; color:#5B21B6; border:1px solid #DDD6FE;',
      'Closed Won': 'background:#DCFCE7; color:#15803D; border:1px solid #86EFAC;',
      'Closed Lost': 'background:#FEE2E2; color:#991B1B; border:1px solid #FECACA;'
    };

    const statusStyle = statusBadgeMap[sub.status] || 'background:#F1F5F9; color:#475569;';

    // WhatsApp Message
    const waText = encodeURIComponent(
      `Hello ${sub.name},\n\n` +
      `This is Muhammad Uzair, Founder & Lead Solutions Architect at Uzair AI Studio.\n` +
      `I am following up on your consultation request for ${sub.service} (Ref: ${sub.id}).\n\n` +
      `When would be a convenient time for a quick 15-minute architecture discovery call?\n\n` +
      `Best Regards,\nMuhammad Uzair`
    );

    return `
      <tr>
        <td>
          <span class="id-tag">${sub.id}</span>
          <div style="font-size:0.7rem; color:#64748B; margin-top:3px;">📅 ${dateStr}</div>
        </td>
        <td>
          <strong style="display:block; color:#0F172A; font-size:0.875rem;">${sub.name}</strong>
          <div style="font-size:0.75rem; color:#1D4ED8; font-weight:600;"><a href="mailto:${sub.email}">${sub.email}</a></div>
          <div style="font-size:0.72rem; color:#64748B;">📞 ${sub.phone || 'N/A'}</div>
        </td>
        <td>
          <span class="domain-tag domain-genai" style="display:inline-block; margin-bottom:4px;">${sub.service}</span>
          <div style="font-size:0.75rem; color:#475569; font-weight:600;">${sub.projectScale || '-'}</div>
        </td>
        <td style="max-width:240px; font-size:0.78rem; line-height:1.4; color:#334155;">
          <div style="max-height:48px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
            ${sub.message || 'No client brief specified.'}
          </div>
        </td>
        <td>
          <select onchange="updateConsultationStatusInline('${sub.id}', this.value)" style="padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer; ${statusStyle}">
            <option value="New" ${sub.status === 'New' ? 'selected' : ''}>⏳ New</option>
            <option value="Contacted" ${sub.status === 'Contacted' ? 'selected' : ''}>💬 Contacted</option>
            <option value="Call Scheduled" ${sub.status === 'Call Scheduled' ? 'selected' : ''}>📅 Call Scheduled</option>
            <option value="Proposal Sent" ${sub.status === 'Proposal Sent' ? 'selected' : ''}>📑 Proposal Sent</option>
            <option value="Closed Won" ${sub.status === 'Closed Won' ? 'selected' : ''}>🏆 Closed Won</option>
            <option value="Closed Lost" ${sub.status === 'Closed Lost' ? 'selected' : ''}>❌ Closed Lost</option>
          </select>
        </td>
        <td>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="btn btn-whatsapp btn-sm" style="padding:4px 8px; font-size:0.72rem;" title="Chat directly with client on WhatsApp">
                <span>💬 WA</span>
              </a>
            ` : ''}
            <a href="mailto:${sub.email}?subject=${encodeURIComponent(`Uzair AI Studio - Strategy Consultation [${sub.id}]`)}" class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.72rem;" title="Email Client">
              <span>✉️</span>
            </a>
          </div>
        </td>
        <td>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="openConsultationModal('${sub.id}')" class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.72rem;" title="View Full Brief & Notes">
              <span>👁️ Brief</span>
            </button>
            <button type="button" onclick="deleteConsultationRow('${sub.id}')" class="btn btn-outline btn-sm" style="padding:4px 7px; color:#EF4444; border-color:#FECACA; font-size:0.72rem;" title="Remove Inquiry">
              <span>🗑️</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // 2. Render Mobile & Tablet Consultations Cards Grid
  if (mobileGrid) {
    mobileGrid.innerHTML = filteredConsultations.map(sub => {
      const dateStr = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      const cleanPhone = (sub.phone || '').replace(/[^\d]/g, '');

      const statusBadgeMap = {
        'New': 'background:#FEF3C7; color:#92400E; border:1px solid #FDE68A;',
        'Contacted': 'background:#E0F2FE; color:#0369A1; border:1px solid #BAE6FD;',
        'Call Scheduled': 'background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0;',
        'Proposal Sent': 'background:#EDE9FE; color:#5B21B6; border:1px solid #DDD6FE;',
        'Closed Won': 'background:#DCFCE7; color:#15803D; border:1px solid #86EFAC;',
        'Closed Lost': 'background:#FEE2E2; color:#991B1B; border:1px solid #FECACA;'
      };
      const statusStyle = statusBadgeMap[sub.status] || 'background:#F1F5F9; color:#475569;';

      const waText = encodeURIComponent(
        `Hello ${sub.name},\n\n` +
        `This is Muhammad Uzair, Founder & Lead Solutions Architect at Uzair AI Studio.\n` +
        `I am following up on your consultation request for ${sub.service} (Ref: ${sub.id}).\n\n` +
        `When would be a convenient time for a quick 15-minute architecture discovery call?\n\n` +
        `Best Regards,\nMuhammad Uzair`
      );

      return `
        <div class="cand-card">
          <div class="cand-card-top">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
                <span class="id-tag">${sub.id}</span>
                <span class="domain-tag domain-genai">${sub.service}</span>
                <span style="font-size:0.7rem; color:#64748B; font-weight:700;">${sub.typeLabel}</span>
              </div>
              <h3 class="cand-card-name">${sub.name}</h3>
              <div class="cand-card-meta">📅 ${dateStr} &bull; ${sub.projectScale || 'Custom Scope'}</div>
            </div>
            <div style="text-align:right;">
              <select onchange="updateConsultationStatusInline('${sub.id}', this.value)" style="padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer; ${statusStyle}">
                <option value="New" ${sub.status === 'New' ? 'selected' : ''}>⏳ New</option>
                <option value="Contacted" ${sub.status === 'Contacted' ? 'selected' : ''}>💬 Contacted</option>
                <option value="Call Scheduled" ${sub.status === 'Call Scheduled' ? 'selected' : ''}>📅 Call Scheduled</option>
                <option value="Proposal Sent" ${sub.status === 'Proposal Sent' ? 'selected' : ''}>📑 Proposal Sent</option>
                <option value="Closed Won" ${sub.status === 'Closed Won' ? 'selected' : ''}>🏆 Closed Won</option>
                <option value="Closed Lost" ${sub.status === 'Closed Lost' ? 'selected' : ''}>❌ Closed Lost</option>
              </select>
            </div>
          </div>

          <div class="cand-card-details-grid">
            <div class="cand-card-cell">
              <span>Contact Information</span>
              <strong title="${sub.email}"><a href="mailto:${sub.email}" style="color:#1D4ED8; text-decoration:none;">${sub.email}</a></strong>
              <small style="color:#64748B; font-size:0.72rem;">📞 ${sub.phone || 'N/A'}</small>
            </div>
            <div class="cand-card-cell">
              <span>Project Scope Brief</span>
              <div style="font-size:0.75rem; color:#334155; line-height:1.3; max-height:42px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                ${sub.message || 'No client brief specified.'}
              </div>
            </div>
          </div>

          <div class="cand-card-actions">
            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="btn-act wa" title="Chat on WhatsApp">💬 WA Client</a>
            ` : ''}
            <a href="mailto:${sub.email}?subject=${encodeURIComponent(`Uzair AI Studio - Strategy Consultation [${sub.id}]`)}" class="btn-act" title="Email Client">✉️ Email</a>
            <button type="button" onclick="openConsultationModal('${sub.id}')" class="btn-act primary" title="View Full Brief">👁️ View Brief</button>
            <button type="button" onclick="deleteConsultationRow('${sub.id}')" class="btn-act danger" title="Delete Inquiry">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Consultations View Switcher (Table vs Cards)
window.switchConsultationView = function(mode) {
  const tableBox = document.getElementById('consultationsTableBox');
  const cardGrid = document.getElementById('consultationsMobileGrid');
  const btnTable = document.getElementById('btnViewConsultationsTable');
  const btnCards = document.getElementById('btnViewConsultationsCards');

  if (mode === 'cards') {
    if (tableBox) {
      tableBox.style.display = 'none';
      tableBox.classList.add('hide-on-mobile-cards');
    }
    if (cardGrid) {
      cardGrid.style.display = 'flex';
    }
    if (btnCards) btnCards.classList.add('active');
    if (btnTable) btnTable.classList.remove('active');
  } else {
    if (tableBox) {
      tableBox.style.display = 'block';
      tableBox.classList.remove('hide-on-mobile-cards');
    }
    if (cardGrid) {
      cardGrid.style.display = 'none';
    }
    if (btnTable) btnTable.classList.add('active');
    if (btnCards) btnCards.classList.remove('active');
  }
};

// Inline Status Update
window.updateConsultationStatusInline = async function(id, newStatus) {
  try {
    const res = await adminFetch(`/api/admin/consultations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (json.success) {
      const found = allConsultationsData.find(c => c.id === id);
      if (found) found.status = newStatus;
      filterAndRenderConsultations();
    }
  } catch (e) {
    alert('Failed to update status on server.');
  }
};

// Open Consultation Detail Modal
window.openConsultationModal = function(id) {
  const item = allConsultationsData.find(c => c.id === id);
  if (!item) return;

  const modal = document.getElementById('consultationDetailModal');
  document.getElementById('cModalHiddenId').value = item.id;
  document.getElementById('cModalId').textContent = item.id;
  document.getElementById('cModalTypeTag').textContent = item.typeLabel || 'Strategy Consultation';
  document.getElementById('cModalClientName').textContent = item.name || 'Client';
  document.getElementById('cModalSubmittedDate').textContent = item.createdAt ? `Submitted on ${new Date(item.createdAt).toLocaleString()}` : '';
  document.getElementById('cModalEmail').textContent = item.email || 'N/A';
  document.getElementById('cModalPhone').textContent = item.phone || 'Not provided';
  document.getElementById('cModalService').textContent = item.service || '-';
  document.getElementById('cModalScale').textContent = `${item.projectScale || '-'} • ${item.timeline || '-'}`;
  document.getElementById('cModalMessage').textContent = item.message || 'No project notes provided.';
  document.getElementById('cModalStatusSelect').value = item.status || 'New';
  document.getElementById('cModalNotes').value = item.adminNotes || '';

  const cleanPhone = (item.phone || '').replace(/[^\d]/g, '');
  const waBtn = document.getElementById('cModalWaLink');
  if (waBtn) {
    if (cleanPhone) {
      waBtn.style.display = 'inline-flex';
      const waText = encodeURIComponent(`Hello ${item.name}, this is Muhammad Uzair from Uzair AI Studio regarding your project consultation [${item.id}]...`);
      waBtn.href = `https://wa.me/${cleanPhone}?text=${waText}`;
    } else {
      waBtn.style.display = 'none';
    }
  }

  const mailBtn = document.getElementById('cModalMailLink');
  if (mailBtn) {
    mailBtn.href = `mailto:${item.email}?subject=${encodeURIComponent(`Uzair AI Studio - Consultation Inquiry [${item.id}]`)}`;
  }

  modal.classList.add('open');
};

// Delete Consultation Row
window.deleteConsultationRow = async function(id) {
  if (!confirm(`Are you sure you want to permanently remove inquiry "${id}"?`)) return;

  try {
    const res = await adminFetch(`/api/admin/consultations/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      loadConsultations();
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('Error deleting consultation inquiry.');
  }
};

// Export Consultations CSV
function exportConsultationsCsv() {
  if (!filteredConsultations.length) {
    alert('No consultations to export.');
    return;
  }

  const headers = ['Ref ID', 'Client Name', 'Email', 'Phone', 'Service', 'Project Scale', 'Timeline', 'Status', 'Submitted At', 'Brief Message'];
  const rows = filteredConsultations.map(c => [
    `"${c.id}"`,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.service || '').replace(/"/g, '""')}"`,
    `"${(c.projectScale || '').replace(/"/g, '""')}"`,
    `"${(c.timeline || '').replace(/"/g, '""')}"`,
    `"${c.status || 'New'}"`,
    `"${c.createdAt || ''}"`,
    `"${(c.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Uzair_AI_Studio_Consultations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ============================================================
   6. PORTAL & FORM SETTINGS (TURN FORM ON / OFF)
   ============================================================ */
function initSettingsManager() {
  const form = document.getElementById('portalSettingsForm');
  const alertBox = document.getElementById('settingsAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.style.display = 'none';

      const payload = {
        registrationActive: document.getElementById('settingRegistrationActive').checked,
        closedMessage: document.getElementById('settingClosedMessage').value.trim(),
        batchName: document.getElementById('settingBatchName').value.trim(),
        programDuration: document.getElementById('settingProgramDuration').value.trim(),
        coordinatorWhatsApp: document.getElementById('settingCoordinatorWhatsApp').value.trim(),
        instructorName: document.getElementById('settingInstructorName')?.value.trim() || 'Engr. Saad',
        instructorTitle: document.getElementById('settingInstructorTitle')?.value.trim() || 'Lead AI & Technical Instructor',
        studioLocation: document.getElementById('settingStudioLocation')?.value.trim() || '23200 MARDAN KPK',
        studioEmail: document.getElementById('settingStudioEmail')?.value.trim() || 'kmuzairkhan123@gmail.com',
        defaultStartDate: document.getElementById('settingDefaultStartDate')?.value || '',
        defaultEndDate: document.getElementById('settingDefaultEndDate')?.value || ''
      };

      try {
        const res = await adminFetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          alertBox.className = 'intern-alert-container success';
          alertBox.textContent = '✅ Settings successfully updated! Changes are live on the website and documents.';
          alertBox.style.display = 'block';

          // Update KPI indicator
          const kpiStatus = document.getElementById('kpiFormStatus');
          const kpiSub = document.getElementById('kpiFormStatusSub');
          if (kpiStatus && kpiSub) {
            kpiStatus.textContent = payload.registrationActive ? 'ONLINE' : 'PAUSED';
            kpiStatus.style.color = payload.registrationActive ? '#0F172A' : '#EF4444';
            kpiSub.textContent = payload.registrationActive ? 'Active Accepting' : 'Entry Closed';
          }
        }
      } catch (err) {
        alertBox.className = 'intern-alert-container error';
        alertBox.textContent = 'Error saving portal configuration.';
        alertBox.style.display = 'block';
      }
    });
  }
}

async function loadSettings() {
  try {
    const res = await adminFetch('/api/admin/settings');
    const json = await res.json();
    if (!json.success) return;

    const s = json.settings;
    document.getElementById('settingRegistrationActive').checked = !!s.registrationActive;
    document.getElementById('settingClosedMessage').value = s.closedMessage || '';
    document.getElementById('settingBatchName').value = s.batchName || '';
    document.getElementById('settingProgramDuration').value = s.programDuration || '';
    document.getElementById('settingCoordinatorWhatsApp').value = s.coordinatorWhatsApp || '';

    if (document.getElementById('settingInstructorName')) {
      document.getElementById('settingInstructorName').value = s.instructorName || 'Engr. Saad';
    }
    if (document.getElementById('settingInstructorTitle')) {
      document.getElementById('settingInstructorTitle').value = s.instructorTitle || 'Lead AI & Technical Instructor';
    }
    if (document.getElementById('settingStudioLocation')) {
      document.getElementById('settingStudioLocation').value = s.studioLocation || '23200 MARDAN KPK';
    }
    if (document.getElementById('settingStudioEmail')) {
      document.getElementById('settingStudioEmail').value = s.studioEmail || 'kmuzairkhan123@gmail.com';
    }
    if (document.getElementById('settingDefaultStartDate')) {
      document.getElementById('settingDefaultStartDate').value = s.defaultStartDate || '';
    }
    if (document.getElementById('settingDefaultEndDate')) {
      document.getElementById('settingDefaultEndDate').value = s.defaultEndDate || '';
    }

    const kpiStatus = document.getElementById('kpiFormStatus');
    const kpiSub = document.getElementById('kpiFormStatusSub');
    if (kpiStatus && kpiSub) {
      kpiStatus.textContent = s.registrationActive ? 'ONLINE' : 'PAUSED';
      kpiStatus.style.color = s.registrationActive ? '#0F172A' : '#EF4444';
      kpiSub.textContent = s.registrationActive ? 'Active Accepting' : 'Entry Closed';
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

/* ============================================================
   7. QR TESTER HUB
   ============================================================ */
function initQrTester() {
  const btn = document.getElementById('btnGenerateQrTest');
  const input = document.getElementById('qrLookupInput');
  const previewBox = document.getElementById('qrPreviewBox');
  const canvasContainer = document.getElementById('qrCanvasContainer');
  const nameEl = document.getElementById('qrCandidateName');
  const detailsEl = document.getElementById('qrCandidateDetails');
  const linkEl = document.getElementById('qrOpenVerifyLink');

  if (btn && input) {
    btn.addEventListener('click', async () => {
      const q = input.value.trim();
      if (!q) return;

      try {
        const res = await fetch(`/api/internship/verify/${encodeURIComponent(q)}`);
        const json = await res.json();
        if (!json.success) {
          alert('No intern found with ID: ' + q);
          return;
        }

        const data = json.data;
        nameEl.textContent = data.fullName;
        detailsEl.textContent = `ID: ${data.id} • ${data.domain} • ${data.institute}`;

        const fullVerifyUrl = `${window.location.origin}/verify?id=${data.id}`;
        linkEl.href = fullVerifyUrl;

        // Render QR Code
        canvasContainer.innerHTML = '';
        new QRCode(canvasContainer, {
          text: fullVerifyUrl,
          width: 180,
          height: 180,
          colorDark: '#0F172A',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.H
        });

        // Wire up badge download
        const btnDlBadge = document.getElementById('btnAdminDownloadQrBadge');
        if (btnDlBadge) {
          btnDlBadge.onclick = () => {
            const qrCanvas = canvasContainer.querySelector('canvas');
            if (window.UzairQrBadge) {
              window.UzairQrBadge.downloadBadge(data, qrCanvas);
            }
          };
        }

        // Wire up copy link
        const btnCopyLink = document.getElementById('btnAdminCopyQrLink');
        if (btnCopyLink) {
          btnCopyLink.onclick = async () => {
            try {
              await navigator.clipboard.writeText(fullVerifyUrl);
              const origText = btnCopyLink.textContent;
              btnCopyLink.textContent = '✓ Copied!';
              setTimeout(() => { btnCopyLink.textContent = origText; }, 2000);
            } catch (e) {
              prompt('Copy verification URL:', fullVerifyUrl);
            }
          };
        }

        previewBox.style.display = 'block';
      } catch (err) {
        alert('Error generating QR Code.');
      }
    });
  }
}

function loadAllAdminData() {
  loadInterns();
  loadSettings();
  loadConsultations();
  renderAnalyticsCharts();
}
