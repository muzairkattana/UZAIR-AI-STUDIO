/**
 * Uzair AI Studio - Unified IndexedDB Local Database & Offline Sync Engine
 * Enables 100% offline access to candidate registry, profiles, and documents.
 * 
 * Works seamlessly across Admin Portal and Intern Portal.
 */
(function(window) {
  'use strict';

  const DB_NAME = 'UzairStudioLocalDB';
  const DB_VERSION = 1;

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // 1. Interns / Candidates Store
        if (!db.objectStoreNames.contains('interns')) {
          const store = db.createObjectStore('interns', { keyPath: 'id' });
          store.createIndex('email', 'email', { unique: false });
          store.createIndex('domain', 'domain', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 2. Settings Store (registration status, coordinator, batch, duration)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 3. Consultations / Leads Store
        if (!db.objectStoreNames.contains('consultations')) {
          db.createObjectStore('consultations', { keyPath: 'id' });
        }

        // 4. Session Store (Admin & Intern authentication & offline profiles)
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'type' });
        }

        // 5. Meta Store (Sync logs, offline sync queues, timestamps)
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => {
        console.error('[UzairLocalDB] Failed to open IndexedDB:', e.target.error);
        reject(e.target.error);
      };
    });
    return dbPromise;
  }

  // Transaction execution helper
  async function tx(storeName, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let result;
      try {
        result = fn(store);
      } catch (err) {
        reject(err);
        return;
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  const UzairLocalDB = {
    init: openDB,

    isOnline: function() {
      return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    },

    // -------------------------------------------------------------
    // INTERNS / CANDIDATES REPOSITORY
    // -------------------------------------------------------------
    saveInterns: async function(internsList) {
      if (!Array.isArray(internsList)) return 0;
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['interns', 'meta'], 'readwrite');
        const store = transaction.objectStore('interns');
        const metaStore = transaction.objectStore('meta');

        for (const item of internsList) {
          if (item && item.id) {
            store.put(item);
          }
        }

        metaStore.put({
          key: 'interns_last_sync',
          timestamp: new Date().toISOString(),
          count: internsList.length
        });

        transaction.oncomplete = () => {
          console.log(`[UzairLocalDB] Cached ${internsList.length} candidates in local database.`);
          resolve(internsList.length);
        };
        transaction.onerror = () => reject(transaction.error);
      });
    },

    saveIntern: async function(intern) {
      if (!intern || !intern.id) return null;
      return tx('interns', 'readwrite', (store) => {
        store.put(intern);
        return intern;
      });
    },

    getInterns: async function() {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('interns', 'readonly');
        const store = transaction.objectStore('interns');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },

    getInternById: async function(id) {
      if (!id) return null;
      const cleanId = String(id).trim();
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('interns', 'readonly');
        const store = transaction.objectStore('interns');
        const req = store.get(cleanId);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
            return;
          }
          // Fallback scan: check case-insensitive ID or email
          const allReq = store.getAll();
          allReq.onsuccess = () => {
            const list = allReq.result || [];
            const found = list.find(i => 
              (i.id && i.id.toLowerCase() === cleanId.toLowerCase()) ||
              (i.email && i.email.toLowerCase() === cleanId.toLowerCase())
            );
            resolve(found || null);
          };
          allReq.onerror = () => resolve(null);
        };
        req.onerror = () => reject(req.error);
      });
    },

    // -------------------------------------------------------------
    // SETTINGS REPOSITORY
    // -------------------------------------------------------------
    saveSettings: async function(settings) {
      if (!settings) return null;
      return tx('settings', 'readwrite', (store) => {
        store.put({ key: 'general', ...settings, cachedAt: new Date().toISOString() });
        return settings;
      });
    },

    getSettings: async function() {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('settings', 'readonly');
        const store = transaction.objectStore('settings');
        const req = store.get('general');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    },

    // -------------------------------------------------------------
    // CONSULTATIONS REPOSITORY
    // -------------------------------------------------------------
    saveConsultations: async function(list) {
      if (!Array.isArray(list)) return 0;
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('consultations', 'readwrite');
        const store = transaction.objectStore('consultations');
        for (const c of list) {
          if (c && (c.id || c.timestamp)) {
            store.put({ id: c.id || String(c.timestamp), ...c });
          }
        }
        transaction.oncomplete = () => resolve(list.length);
        transaction.onerror = () => reject(transaction.error);
      });
    },

    getConsultations: async function() {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('consultations', 'readonly');
        const store = transaction.objectStore('consultations');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    },

    // -------------------------------------------------------------
    // SESSIONS (ADMIN & INTERN)
    // -------------------------------------------------------------
    saveAdminSession: async function(sessionData) {
      return tx('sessions', 'readwrite', (store) => {
        store.put({ type: 'admin', ...sessionData, savedAt: new Date().toISOString() });
      });
    },

    getAdminSession: async function() {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('sessions', 'readonly');
        const store = transaction.objectStore('sessions');
        const req = store.get('admin');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    },

    clearAdminSession: async function() {
      return tx('sessions', 'readwrite', (store) => {
        store.delete('admin');
      });
    },

    saveInternSession: async function(profile, token) {
      if (!profile) return null;
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions', 'interns'], 'readwrite');
        const sessStore = transaction.objectStore('sessions');
        const internStore = transaction.objectStore('interns');

        sessStore.put({
          type: 'intern',
          token: token || null,
          internId: profile.id,
          profile,
          savedAt: new Date().toISOString()
        });

        if (profile.id) {
          internStore.put(profile);
        }

        transaction.oncomplete = () => {
          console.log('[UzairLocalDB] Intern profile and session saved locally.');
          resolve(profile);
        };
        transaction.onerror = () => reject(transaction.error);
      });
    },

    getInternSession: async function() {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('sessions', 'readonly');
        const store = transaction.objectStore('sessions');
        const req = store.get('intern');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    },

    clearInternSession: async function() {
      return tx('sessions', 'readwrite', (store) => {
        store.delete('intern');
      });
    },

    // -------------------------------------------------------------
    // META & SYNC STATUS
    // -------------------------------------------------------------
    getSyncMeta: async function() {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('meta', 'readonly');
        const store = transaction.objectStore('meta');
        const req = store.get('interns_last_sync');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    },

    // -------------------------------------------------------------
    // OFFLINE DOCUMENT DATA GENERATOR HELPERS
    // -------------------------------------------------------------
    buildDocumentData: function(intern, type = 'offer') {
      if (!intern) return null;
      const origin = window.location.origin;
      const verifyUrl = `${origin}/verify?id=${encodeURIComponent(intern.id)}`;
      
      const perks = Array.isArray(intern.perks) && intern.perks.length > 0 
        ? intern.perks 
        : [
            "Internship Completion Certificate",
            "Letter of Recommendation by Founder Muhammad Uzair",
            "MIT Artificial Intelligence Course (1080p Recorded Lectures, Slides & Books)",
            "Practical Experience with 4+ Real-World Projects",
            "Flexible Self-Paced Schedule"
          ];

      return {
        id: intern.id,
        name: intern.fullName || intern.rawNameEntered || 'Candidate',
        father: intern.fatherName || 'Muhammad Khan',
        domain: intern.domain || 'Generative AI',
        qualification: intern.qualification || 'Bachelors',
        institute: intern.institute || 'University Institute',
        city: intern.city || 'Mardan',
        email: intern.email || '',
        whatsapp: intern.whatsapp || '',
        program: intern.program || 'Internship & Training Program - 2 Months',
        batch: intern.batch || '2026 AI Department Batch',
        startDate: intern.startDate || 'October 1, 2026',
        completionDate: intern.completionDate || 'November 30, 2026',
        duration: intern.duration || '2 Months (60 Days)',
        stipend: intern.stipend || 'Unpaid / Performance-Based Training & Portfolio Sprint',
        mentor: intern.mentor || 'Muhammad Uzair (Founder & Lead Architect)',
        status: intern.status || 'Active',
        perks: perks,
        verify: verifyUrl,
        date: new Date(intern.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        ref: intern.id
      };
    }
  };

  // Expose globally
  window.UzairLocalDB = UzairLocalDB;

  // Auto-init on script load
  UzairLocalDB.init().catch(err => {
    console.warn('[UzairLocalDB] Local DB init deferred:', err);
  });

})(window);
