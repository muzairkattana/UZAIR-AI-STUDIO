/**
 * Uzair AI Studio • Universal Real-Time Notification & Audio Chime Engine
 * Supported on Website, Admin Hub, and Intern Portal.
 * Features:
 * - Synthesized dual-tone Web Audio chime (zero external audio file dependencies)
 * - PWA native push notification dispatch via Service Worker
 * - In-app floating toast alerts
 * - Persistent notification center dropdown with unread badge counter
 * - Real-time polling & synchronization
 */

(function (window) {
  'use strict';

  const STORAGE_KEY_PREFIX = 'uzair_notifs_';
  const SOUND_PREF_KEY = 'uzair_notif_sound_enabled';

  // Global AudioContext singleton
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Pure Web Audio synthesized 2-tone melodic notification chime
  function playNotificationChime() {
    try {
      const soundEnabled = localStorage.getItem(SOUND_PREF_KEY) !== 'false';
      if (!soundEnabled) return;

      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Primary oscillator: High crisp pleasant ping (D5 = 587.33Hz -> A5 = 880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.28, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Harmonic overtone: adds warm crystalline depth (1760Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain2.gain.setValueAtTime(0.0001, now + 0.04);
      gain2.gain.linearRampToValueAtTime(0.09, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.44);
    } catch (e) {
      console.warn('[Notifications] Audio chime skipped:', e);
    }
  }

  // Request browser notification permission
  async function requestNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (e) {
        return 'default';
      }
    }
    return Notification.permission;
  }

  // Show native system push notification
  function showNativeNotification(title, body, url = '/') {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const options = {
      body: body || 'You have an important update from Uzair AI Studio.',
      icon: '/assets/uzairaistudio.png',
      badge: '/assets/uzairaistudio.png',
      tag: 'uzair-' + Date.now(),
      vibrate: [200, 100, 200],
      data: { url: url || '/' }
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options).catch(() => {
          try { new Notification(title, options); } catch(e) {}
        });
      });
    } else {
      try {
        const n = new Notification(title, options);
        n.onclick = (e) => {
          e.preventDefault();
          window.focus();
          if (url && url !== '/') window.location.href = url;
          n.close();
        };
      } catch (e) {}
    }
  }

  // Floating In-App Toast
  let activeToastTimer = null;
  function showInAppToast(title, body, url = null) {
    let toast = document.getElementById('uzairGlobalNotifToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'uzairGlobalNotifToast';
      toast.className = 'uzair-notif-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div class="notif-toast-icon">
        <img src="/assets/uzairaistudio.png" alt="Uzair AI Studio">
      </div>
      <div class="notif-toast-content">
        <strong class="notif-toast-title">${escapeHtml(title)}</strong>
        <p class="notif-toast-body">${escapeHtml(body)}</p>
      </div>
      <button type="button" class="notif-toast-close" aria-label="Close">&times;</button>
    `;

    toast.querySelector('.notif-toast-close').onclick = (e) => {
      e.stopPropagation();
      toast.classList.remove('show');
    };

    if (url) {
      toast.onclick = () => {
        toast.classList.remove('show');
        if (url.startsWith('#')) {
          const target = document.querySelector(url);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = url;
        }
      };
      toast.style.cursor = 'pointer';
    } else {
      toast.style.cursor = 'default';
    }

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    if (activeToastTimer) clearTimeout(activeToastTimer);
    activeToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 6000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // Local storage notifications list manager
  function getStoredNotifications(role = 'general') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFIX + role);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredNotifications(list, role = 'general') {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + role, JSON.stringify(list.slice(0, 30)));
    } catch (e) {}
  }

  // Main Public Engine
  const UzairNotifications = {
    // Play standalone sound chime
    playChime() {
      playNotificationChime();
    },

    // Request OS permission
    requestPermission: requestNotificationPermission,

    // Dispatch a complete notification (sound + toast + native OS + storage)
    notify({ title, body, url, role = 'general', id = null, save = true }) {
      // 1. Play sound chime
      playNotificationChime();

      // 2. In-app floating toast
      showInAppToast(title, body, url);

      // 3. Native system push notification
      showNativeNotification(title, body, url);

      // 4. Save to list
      if (save) {
        const notifs = getStoredNotifications(role);
        const notifItem = {
          id: id || 'NOTIF-' + Date.now(),
          title,
          body,
          url: url || '#',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString(),
          read: false,
          timestamp: Date.now()
        };

        // Prepend and dedup
        const filtered = notifs.filter(n => n.id !== notifItem.id);
        filtered.unshift(notifItem);
        saveStoredNotifications(filtered, role);

        // Update UI bells if present
        this.updateBellUI(role);
      }
    },

    // Initialize Bell & Dropdown on any page
    initBell({ bellBtnId, badgeId, dropdownId, role = 'general' }) {
      const bellBtn = document.getElementById(bellBtnId);
      const badge = document.getElementById(badgeId);
      const dropdown = document.getElementById(dropdownId);

      if (!bellBtn || !dropdown) return;

      // Request permission on first bell interaction
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        requestNotificationPermission();
        dropdown.classList.toggle('open');
        this.renderDropdownContent(dropdown, badge, role);
      });

      // Auto close when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });

      // Initial render & count update
      this.updateBellUI(role, badge);
    },

    updateBellUI(role = 'general', badgeElement = null) {
      const badges = badgeElement ? [badgeElement] : document.querySelectorAll(`[data-notif-badge="${role}"], #notifBadgeCount, #notifBadgeAdmin, #notifBadgeIntern`);
      const notifs = getStoredNotifications(role);
      const unreadCount = notifs.filter(n => !n.read).length;

      badges.forEach(b => {
        if (unreadCount > 0) {
          b.textContent = unreadCount > 9 ? '9+' : unreadCount;
          b.style.display = 'inline-flex';
        } else {
          b.style.display = 'none';
        }
      });
    },

    renderDropdownContent(dropdown, badge, role = 'general') {
      const notifs = getStoredNotifications(role);
      const soundEnabled = localStorage.getItem(SOUND_PREF_KEY) !== 'false';

      let itemsHtml = '';
      if (notifs.length === 0) {
        itemsHtml = `
          <div class="notif-empty-state">
            <span style="font-size:1.8rem; display:block; margin-bottom:6px;">🔔</span>
            <strong style="color:#0F172A; font-size:0.875rem;">All caught up!</strong>
            <p style="color:#64748B; font-size:0.75rem; margin-top:2px;">You will receive real-time alerts with audio chimes here.</p>
          </div>
        `;
      } else {
        itemsHtml = notifs.map(n => `
          <div class="notif-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
            <div class="notif-item-top">
              <span class="notif-item-title">${escapeHtml(n.title)}</span>
              <span class="notif-item-time">${escapeHtml(n.time || '')}</span>
            </div>
            <p class="notif-item-body">${escapeHtml(n.body)}</p>
            ${n.url && n.url !== '#' ? `<a href="${n.url}" class="notif-item-link">View Details &rarr;</a>` : ''}
          </div>
        `).join('');
      }

      dropdown.innerHTML = `
        <div class="notif-dropdown-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="font-size:0.95rem; color:#0F172A;">Notifications</strong>
            <span class="notif-count-pill">${notifs.filter(n => !n.read).length} New</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <button type="button" class="btn-notif-action" id="btnToggleNotifSound" title="Toggle Sound">
              ${soundEnabled ? '🔊 Sound ON' : '🔇 Muted'}
            </button>
            <button type="button" class="btn-notif-action" id="btnMarkAllNotifsRead">
              Mark Read
            </button>
          </div>
        </div>

        <div class="notif-dropdown-list">
          ${itemsHtml}
        </div>

        <div class="notif-dropdown-footer">
          <button type="button" class="btn-test-chime" id="btnTestChimeSound">
            <span>🔔 Test Audio Chime</span>
          </button>
        </div>
      `;

      // Event: Toggle Sound
      const btnSound = dropdown.querySelector('#btnToggleNotifSound');
      if (btnSound) {
        btnSound.onclick = (e) => {
          e.stopPropagation();
          const curr = localStorage.getItem(SOUND_PREF_KEY) !== 'false';
          localStorage.setItem(SOUND_PREF_KEY, curr ? 'false' : 'true');
          btnSound.textContent = curr ? '🔇 Muted' : '🔊 Sound ON';
          if (!curr) playNotificationChime();
        };
      }

      // Event: Mark all as read
      const btnMark = dropdown.querySelector('#btnMarkAllNotifsRead');
      if (btnMark) {
        btnMark.onclick = (e) => {
          e.stopPropagation();
          const updated = notifs.map(n => ({ ...n, read: true }));
          saveStoredNotifications(updated, role);
          this.renderDropdownContent(dropdown, badge, role);
          this.updateBellUI(role, badge);
        };
      }

      // Event: Test Chime
      const btnTest = dropdown.querySelector('#btnTestChimeSound');
      if (btnTest) {
        btnTest.onclick = (e) => {
          e.stopPropagation();
          playNotificationChime();
        };
      }

      // Event: Click item to mark as read
      dropdown.querySelectorAll('.notif-item').forEach(el => {
        el.onclick = () => {
          const id = el.dataset.id;
          const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
          saveStoredNotifications(updated, role);
          el.classList.remove('unread');
          el.classList.add('read');
          this.updateBellUI(role, badge);
        };
      });
    },

    // Background polling for server notifications
    startPolling(role = 'client', targetId = null, intervalMs = 8000) {
      let lastTimestamp = Date.now() - 60000;

      const poll = async () => {
        try {
          const query = new URLSearchParams({ role });
          if (targetId) query.set('targetId', targetId);
          query.set('since', lastTimestamp);

          const res = await fetch(`/api/notifications?${query.toString()}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.notifications)) {
              data.notifications.forEach(n => {
                this.notify({
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  url: n.url,
                  role: role,
                  save: true
                });
                if (n.timestamp > lastTimestamp) {
                  lastTimestamp = n.timestamp;
                }
              });
            }
          }
        } catch (e) {
          // Silent network offline fallback
        }
      };

      // Poll periodically
      setInterval(poll, intervalMs);
      // Run once after slight delay
      setTimeout(poll, 1500);
    }
  };

  // Expose to window
  window.UzairNotifications = UzairNotifications;

})(window);
