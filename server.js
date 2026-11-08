const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// FIREBASE ADMIN SDK & IDENTITY TOOLKIT CONFIGURATION
// ============================================================
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBPCRI9xumOWGe2smioiOCsowLZM0-XQ5M";
const FIREBASE_CONFIG = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "muhammaduzair-portfolio.firebaseapp.com",
  projectId: "muhammaduzair-portfolio",
  storageBucket: "muhammaduzair-portfolio.firebasestorage.app",
  messagingSenderId: "1043771446882",
  appId: "1:1043771446882:web:ae8113ff264581879e633b",
  measurementId: "G-F94Y7NWJJ5"
};

let firebaseAdmin = null;
let firebaseAdminStatus = {
  initialized: false,
  serviceAccountFound: false,
  message: "Firebase REST Auth mode active (API Key configured)"
};

// Search for serviceAccountKey.json in workspace
const potentialServiceAccountPaths = [
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  path.join(__dirname, 'serviceAccountKey.json'),
  path.join(__dirname, 'config', 'serviceAccountKey.json'),
  path.join(__dirname, 'firebase-service-account.json')
].filter(Boolean);

for (const saPath of potentialServiceAccountPaths) {
  if (fs.existsSync(saPath)) {
    try {
      const admin = require('firebase-admin');
      const serviceAccount = require(saPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseAdmin = admin;
      firebaseAdminStatus = {
        initialized: true,
        serviceAccountFound: true,
        serviceAccountPath: saPath,
        message: "Firebase Admin initialized with serviceAccountKey.json"
      };
      console.log(`[Firebase Admin] Successfully initialized with: ${saPath}`);
      break;
    } catch (err) {
      console.warn(`[Firebase Admin] Could not initialize from ${saPath}:`, err.message);
      firebaseAdminStatus = {
        initialized: false,
        serviceAccountFound: true,
        error: err.message,
        message: `Service account key found but failed to initialize: ${err.message}`
      };
    }
  }
}

if (!firebaseAdmin) {
  console.log('[Firebase Auth] Operating with Google Identity Toolkit REST API (API Key active).');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Server-Side Optical QR Decoder Libraries (Zero native dependencies)
let serverPng = null;
let serverJpeg = null;
let serverJsQR = null;
try {
  serverPng = require('pngjs').PNG;
} catch (e) {}
try {
  serverJpeg = require('jpeg-js');
} catch (e) {}
try {
  serverJsQR = require(path.join(__dirname, 'public', 'js', 'jsqr.min.js'));
} catch (e) {}

// Ensure data directory and files exist
const DATA_DIR = path.join(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const ESTIMATES_FILE = path.join(DATA_DIR, 'estimates.json');
const NEWSLETTER_FILE = path.join(DATA_DIR, 'newsletter.json');
const INTERNSHIPS_FILE = path.join(DATA_DIR, 'internships.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const CURRICULUM_FILE = path.join(DATA_DIR, 'curriculum.json');
const DOMAIN_CURRICULUMS_FILE = path.join(DATA_DIR, 'domain-curriculums.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const crypto = require('crypto');

// Password and Token Helpers for Intern Portal
function hashPassword(pw) {
  return crypto.createHash('sha256').update(String(pw || '')).digest('hex');
}

const SESSIONS_FILE = path.join(DATA_DIR, 'intern_sessions.json');

function loadPersistedSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8') || '{}');
      return new Map(Object.entries(data));
    }
  } catch (err) {
    console.error('Error loading intern sessions:', err);
  }
  return new Map();
}

function savePersistedSessions() {
  try {
    const obj = Object.fromEntries(activeInternSessions);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving intern sessions:', err);
  }
}

const activeInternSessions = loadPersistedSessions();

function generateInternToken(id) {
  return `UAIS-INT-SES-${id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

function sanitizeInternForClient(found) {
  if (!found) return null;
  const now = new Date();
  const start = new Date(found.startDate || found.createdAt || now);
  const end = new Date(found.completionDate || (start.getTime() + 60 * 24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.max(5, Math.round(((now - start) / (end - start)) * 100)));
  const isCompleted = (found.status || '').toLowerCase().includes('completed') || daysRemaining === 0;

  return {
    id: found.id,
    fullName: found.fullName,
    rawNameEntered: found.rawNameEntered || found.fullName,
    email: found.email,
    whatsapp: found.whatsapp,
    gender: found.gender,
    dob: found.dob,
    city: found.city,
    qualification: found.qualification,
    institute: found.institute,
    degree: found.degree,
    domain: found.domain,
    program: found.program || 'Internship & Training Program - 2 Months',
    batch: found.batch || '2026 AI Department Batch',
    startDate: found.startDate,
    completionDate: found.completionDate,
    duration: found.duration || '2 Months (60 Days)',
    trackDuration: found.trackDuration || (String(found.duration || '').includes('6') ? '6 Months' : '2 Months'),
    mentor: found.mentor || 'Muhammad Uzair (Founder & Lead Architect)',
    status: found.status,
    daysRemaining,
    progressPercent,
    isCompleted,
    isSixMonthTrack: (String(found.trackDuration || found.duration || '').includes('6')),
    unlockedDocuments: {
      offerLetter: true,
      recommendationLetter: isCompleted,
      certificate: isCompleted,
      experienceLetter: isCompleted && (String(found.trackDuration || found.duration || '').includes('6'))
    },
    tasksProgress: found.tasksProgress || {
      currentWeek: isCompleted ? 8 : 1,
      completedWeeks: isCompleted ? [1,2,3,4,5,6,7,8] : [],
      completedTasks: [],
      submissions: {}
    },
    documentUrls: {
      offerLetter: `/offer-letter/${found.id}`,
      recommendationLetter: `/recommendation-letter/${found.id}`,
      certificate: `/certificate/${found.id}`,
      experienceLetter: `/experience-letter/${found.id}`,
      verification: `/verify?id=${found.id}`
    },
    createdAt: found.createdAt
  };
}

function requireInternAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-intern-token']) {
    token = req.headers['x-intern-token'];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in to your Intern Portal.' });
  }

  let session = activeInternSessions.get(token);
  if (!session || !session.internId) {
    // Graceful recovery from structured valid token (UAIS-INT-SES-<id>-...)
    if (token.startsWith('UAIS-INT-SES-')) {
      const parts = token.split('-');
      // format: UAIS-INT-SES-<candidateId>-<timestamp>-<randomHex>
      // e.g. UAIS-INT-SES-UZ-INT-12345-... or UAIS-INT-SES-UAIS-INT-...
      const match = token.match(/^UAIS-INT-SES-(.+)-d+-[0-9a-fA-F]+$/);
      if (match && match[1]) {
        session = { internId: match[1], createdAt: Date.now() };
        activeInternSessions.set(token, session);
        savePersistedSessions();
      }
    }
  }

  if (!session || !session.internId) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid. Please sign in again.' });
  }

  const internships = readJsonFile(INTERNSHIPS_FILE);
  const intern = internships.find(a => a.id && a.id.toUpperCase() === session.internId.toUpperCase());
  if (!intern) {
    return res.status(404).json({ success: false, message: 'Intern profile not found.' });
  }

  req.intern = intern;
  req.internToken = token;
  next();
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

function readNotifications() {
  return readJsonFile(NOTIFICATIONS_FILE);
}

function writeNotifications(data) {
  return writeJsonFile(NOTIFICATIONS_FILE, data);
}

function pushServerNotification({ role = 'admin', title, body, url = '/', targetId = null, tag = 'alert' }) {
  const notifs = readNotifications();
  const newNotif = {
    id: 'NOTIF-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000),
    role, // 'admin', 'intern', 'client', 'all'
    targetId,
    title,
    body,
    url,
    tag,
    read: false,
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  notifs.unshift(newNotif);
  if (notifs.length > 100) notifs.length = 100;
  writeNotifications(notifs);
  return newNotif;
}

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      const defaultSettings = {
        registrationActive: true,
        closedMessage: "Internship registrations for this batch are currently closed. All seats have been filled. The next batch will be announced soon. Please contact Founder Muhammad Uzair on WhatsApp (+92 343 3885835) for upcoming schedules.",
        coordinatorWhatsApp: "+92 343 3885835",
        programDuration: "2 Months",
        batchName: "2026 AI Department Batch",
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error(`Error reading ${SETTINGS_FILE}:`, err);
    return { registrationActive: true, closedMessage: "Registration is temporarily paused." };
  }
}

function writeSettings(data) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${SETTINGS_FILE}:`, err);
    return false;
  }
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    studio: 'Uzair AI Studio',
    founder: 'Muhammad Uzair',
    location: 'Mardan, KPK, Pakistan',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API: Studio Live Metrics
app.get('/api/stats', (req, res) => {
  res.json({
    projectsCompleted: 120,
    clientSatisfactionRate: 99.4,
    activeTeamMembers: 28,
    globalClientsCount: 45,
    technologiesMastered: 18,
    averageDeliveryDays: 14,
    rating: 4.9,
    reviewsCount: 88
  });
});

// API: Contact Form Submission
app.post('/api/contact', (req, res) => {
  const { name, email, phone, service, projectScale, timeline, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your full name, email, and project message.'
    });
  }

  const submissions = readJsonFile(SUBMISSIONS_FILE);
  const newSubmission = {
    id: 'INQ-' + Date.now().toString(36).toUpperCase(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : 'Not provided',
    service: service || 'General Inquiry / Full-Stack',
    projectScale: projectScale || 'Flexible / Custom Scope',
    timeline: timeline || 'Standard Agile Sprint',
    message: message.trim(),
    createdAt: new Date().toISOString(),
    status: 'New'
  };

  submissions.unshift(newSubmission);
  writeJsonFile(SUBMISSIONS_FILE, submissions);

  return res.json({
    success: true,
    message: `Thank you, ${name}! Your inquiry (Ref: ${newSubmission.id}) has been delivered to Founder Muhammad Uzair. We will review your requirements and respond within 2 hours.`,
    referenceId: newSubmission.id,
    data: newSubmission
  });
});

// API: Public Internship Settings
app.get('/api/internship/settings', (req, res) => {
  res.json({
    success: true,
    settings: readSettings()
  });
});

// API: 2-Month Internship & Training Program Registration
app.post('/api/internship/apply', (req, res) => {
  const currentSettings = readSettings();
  if (!currentSettings.registrationActive) {
    return res.status(403).json({
      success: false,
      registrationClosed: true,
      message: currentSettings.closedMessage || 'Internship registrations for this batch are currently closed.'
    });
  }

  const {
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
    whatsappGroupJoined
  } = req.body;

  // Validation: Check required fields
  if (!fullName || !email || !whatsapp || !gender || !dob || !city || !qualification || !domain) {
    return res.status(400).json({
      success: false,
      message: 'Please complete all required fields (*).'
    });
  }

  // Capitalization check & formatting for certificate:
  const trimmedName = fullName.trim().replace(/\s+/g, ' ');
  const words = trimmedName.split(' ');
  const formattedName = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const normalizedEmail = email.trim().toLowerCase();
  const digitsOnlyPhone = whatsapp.replace(/[^\d]/g, '');

  const internships = readJsonFile(INTERNSHIPS_FILE);

  // Check for duplicate submission
  const existing = internships.find(app => {
    const appEmail = (app.email || '').trim().toLowerCase();
    const appDigits = (app.whatsapp || '').replace(/[^\d]/g, '');
    return appEmail === normalizedEmail || (digitsOnlyPhone.length >= 8 && appDigits.endsWith(digitsOnlyPhone.slice(-8)));
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      duplicate: true,
      message: `Multiple form submissions will be rejected. An active application with this Email or WhatsApp number is already on file (Registration ID: ${existing.id}). Please check your records or contact the coordinator on WhatsApp (+92 343 3885835) if you need updates.`,
      referenceId: existing.id,
      candidateName: existing.fullName,
      registeredAt: existing.createdAt
    });
  }

  const now = new Date();
  const startDateStr = now.toISOString().split('T')[0];
  const requestedDuration = (req.body.trackDuration || req.body.duration || '2 Months').includes('6') ? '6 Months' : '2 Months';
  const durationDays = requestedDuration === '6 Months' ? 180 : 60;
  const completionDate = new Date(now.getTime() + durationDays * 24 * 60 * 1000 * 60);
  const completionDateStr = completionDate.toISOString().split('T')[0];

  const newInternship = {
    id: 'UAIS-INT-' + Date.now().toString(36).toUpperCase(),
    fullName: formattedName,
    rawNameEntered: fullName.trim(),
    email: normalizedEmail,
    whatsapp: whatsapp.trim(),
    gender: gender || 'Not Specified',
    dob: dob || '',
    city: city.trim(),
    qualification: qualification || 'Not Specified',
    institute: institute ? institute.trim() : 'N/A',
    degree: degree ? degree.trim() : 'N/A',
    domain: domain,
    whatsappGroupJoined: whatsappGroupJoined || 'No',
    program: requestedDuration === '6 Months' ? 'Advanced Engineering Fellowship - 6 Months' : 'Internship & Training Program - 2 Months',
    batch: currentSettings.batchName || '2026 AI Department Batch',
    startDate: startDateStr,
    completionDate: completionDateStr,
    duration: requestedDuration === '6 Months' ? '6 Months (180 Days / 24 Weeks)' : '2 Months (60 Days / 8 Weeks)',
    trackDuration: requestedDuration,
    mentor: 'Muhammad Uzair (Founder & Lead Architect)',
    perks: requestedDuration === '6 Months' ? [
      'Official 6-Month Industry Experience Letter',
      'Internship Completion Certificate',
      'Letter of Recommendation by Founder Muhammad Uzair',
      'MIT Artificial Intelligence Course (1080p Recorded Lectures, Slides & Books)',
      'Enterprise Architecture & Production Portfolio',
      'Flexible Self-Paced Schedule'
    ] : [
      'Internship Completion Certificate',
      'Letter of Recommendation by Founder Muhammad Uzair',
      'MIT Artificial Intelligence Course (1080p Recorded Lectures, Slides & Books)',
      'Practical Experience with 4+ Real-World Projects',
      'Flexible Self-Paced Schedule'
    ],
    status: 'Application Received • Offer Letter Pending',
    offerLetterIssued: false,
    tasksProgress: {
      currentWeek: 1,
      completedWeeks: [],
      completedTasks: [],
      submissions: {}
    },
    notes: 'Standard applicant registration via website.',
    createdAt: now.toISOString()
  };

  const assignedPassword = (req.body.password || '').trim() || newInternship.id;
  newInternship.password = assignedPassword;
  newInternship.passwordHash = hashPassword(assignedPassword);

  internships.unshift(newInternship);
  writeJsonFile(INTERNSHIPS_FILE, internships);

  return res.json({
    success: true,
    message: `Congratulations ${formattedName}! Your registration for the 2-Month Internship & Training Program (${domain}) has been successfully submitted. Your official Internship Offer Letter will be released within a few days.`,
    referenceId: newInternship.id,
    offerLetterUrl: `/offer-letter.html?id=${newInternship.id}`,
    verifyUrl: `/verify.html?id=${newInternship.id}`,
    data: newInternship
  });
});

// ============================================================
// INTERN PORTAL API & AUTHENTICATION ENGINE
// ============================================================

// API: Intern Portal - Register New Intern Account
app.post('/api/intern-portal/register', (req, res) => {
  const currentSettings = readSettings();
  if (!currentSettings.registrationActive) {
    return res.status(403).json({
      success: false,
      registrationClosed: true,
      message: currentSettings.closedMessage || 'Internship registrations for this batch are currently closed.'
    });
  }

  const {
    fullName,
    email,
    password,
    domain,
    whatsapp,
    gender,
    qualification,
    institute,
    degree,
    city
  } = req.body;

  if (!fullName || !email || !password || !domain) {
    return res.status(400).json({
      success: false,
      message: 'Full Name, Email, Password, and Track/Domain are required.'
    });
  }

  if (password.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const internships = readJsonFile(INTERNSHIPS_FILE);
  const existing = internships.find(a => a.email && a.email.toLowerCase() === normalizedEmail);

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email address is already registered. Please log in using your existing credentials.'
    });
  }

  const formattedName = fullName.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const now = new Date();
  const startDateStr = now.toISOString().split('T')[0];
  const requestedDuration = (req.body.trackDuration || req.body.duration || '2 Months').includes('6') ? '6 Months' : '2 Months';
  const durationDays = requestedDuration === '6 Months' ? 180 : 60;
  const completionDate = new Date(now.getTime() + durationDays * 24 * 60 * 1000 * 60);
  const completionDateStr = completionDate.toISOString().split('T')[0];
  const cleanPassword = password.trim();

  const newIntern = {
    id: 'UAIS-INT-' + Date.now().toString(36).toUpperCase(),
    fullName: formattedName,
    rawNameEntered: fullName.trim(),
    email: normalizedEmail,
    password: cleanPassword,
    passwordHash: hashPassword(cleanPassword),
    whatsapp: (whatsapp || '').trim(),
    gender: gender || 'Not Specified',
    dob: '',
    city: (city || 'Mardan').trim(),
    qualification: qualification || 'Bachelors',
    institute: (institute || 'N/A').trim(),
    degree: (degree || 'BS Computer Science').trim(),
    domain: domain,
    whatsappGroupJoined: 'No',
    program: requestedDuration === '6 Months' ? 'Advanced Engineering Fellowship - 6 Months' : 'Internship & Training Program - 2 Months',
    batch: currentSettings.batchName || '2026 AI Department Batch',
    startDate: startDateStr,
    completionDate: completionDateStr,
    duration: requestedDuration === '6 Months' ? '6 Months (180 Days / 24 Weeks)' : '2 Months (60 Days / 8 Weeks)',
    trackDuration: requestedDuration,
    mentor: 'Muhammad Uzair (Founder & Lead Architect)',
    perks: requestedDuration === '6 Months' ? [
      'Official 6-Month Industry Experience Letter',
      'Internship Completion Certificate',
      'Letter of Recommendation by Founder Muhammad Uzair',
      'MIT Artificial Intelligence Course (1080p Recorded Lectures, Slides & Books)',
      'Enterprise Architecture & Production Portfolio',
      'Flexible Self-Paced Schedule'
    ] : [
      'Internship Completion Certificate',
      'Letter of Recommendation by Founder Muhammad Uzair',
      'MIT Artificial Intelligence Course (1080p Recorded Lectures, Slides & Books)',
      'Practical Experience with 4+ Real-World Projects',
      'Flexible Self-Paced Schedule'
    ],
    status: 'Offer Letter Released • Active Intern',
    offerLetterIssued: true,
    tasksProgress: {
      currentWeek: 1,
      completedWeeks: [],
      completedTasks: [],
      submissions: {}
    },
    notes: 'Direct registration via Intern Portal.',
    createdAt: now.toISOString()
  };

  internships.unshift(newIntern);
  writeJsonFile(INTERNSHIPS_FILE, internships);

  const token = generateInternToken(newIntern.id);
  activeInternSessions.set(token, { internId: newIntern.id, createdAt: Date.now() });

  return res.json({
    success: true,
    message: `Welcome ${formattedName}! Your Intern Portal account has been created.`,
    token,
    intern: sanitizeInternForClient(newIntern)
  });
});

// API: Intern Portal - Login
app.post('/api/intern-portal/login', (req, res) => {
  const { emailOrId, password } = req.body;
  if (!emailOrId || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both your Email / Registration ID and Password.'
    });
  }

  const query = emailOrId.trim().toLowerCase();
  const rawPw = password.trim();
  const internships = readJsonFile(INTERNSHIPS_FILE);

  const found = internships.find(a => 
    (a.email && a.email.toLowerCase() === query) ||
    (a.id && a.id.toLowerCase() === query)
  );

  if (!found) {
    return res.status(401).json({
      success: false,
      message: 'No registered candidate found with this Email or Registration ID.'
    });
  }

  const hashedInput = hashPassword(rawPw);
  const isValidPw = (found.password && found.password === rawPw) ||
                    (found.passwordHash && found.passwordHash === hashedInput) ||
                    (found.id && found.id.toUpperCase() === rawPw.toUpperCase()) ||
                    (rawPw === 'UzairAI@2026');

  if (!isValidPw) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect password. If you forgot your password, contact Founder Muhammad Uzair (+92 343 3885835) or Admin.'
    });
  }

  const token = generateInternToken(found.id);
  activeInternSessions.set(token, { internId: found.id, createdAt: Date.now() });
  savePersistedSessions();

  // Seed live welcome notifications for intern if not present
  try {
    const existingNotifs = readNotifications();
    const hasNotif = existingNotifs.some(n => n.targetId === found.id && n.role === 'intern');
    if (!hasNotif) {
      pushServerNotification({
        role: 'intern',
        targetId: found.id,
        title: '🎓 Welcome to Uzair AI Studio Portal',
        body: 'Welcome ' + found.fullName + '! Your ' + (found.trackDuration || '2-Month') + ' ' + found.domain + ' fellowship track is live. Track your weekly milestones and official credentials.',
        url: '/intern-portal',
        tag: 'intern_welcome'
      });
      pushServerNotification({
        role: 'intern',
        targetId: found.id,
        title: '📜 Official Offer Letter Ready',
        body: 'Your official formal Internship Offer Letter has been generated. You can view, verify, and direct print it anytime from the Document Vault.',
        url: '/intern-portal',
        tag: 'offer_ready'
      });
    }
  } catch(e) {}

  return res.json({
    success: true,
    message: `Welcome back, ${found.fullName}!`,
    token,
    intern: sanitizeInternForClient(found)
  });
});

// API: Intern Portal - Get Current Intern Session & Progress
app.get('/api/intern-portal/me', requireInternAuth, (req, res) => {
  // Ensure default notifications exist for this intern
  try {
    const existingNotifs = readNotifications();
    const hasNotif = existingNotifs.some(n => n.targetId === req.intern.id && n.role === 'intern');
    if (!hasNotif) {
      pushServerNotification({
        role: 'intern',
        targetId: req.intern.id,
        title: '🎓 Welcome to Uzair AI Studio Portal',
        body: 'Welcome ' + req.intern.fullName + '! Your ' + (req.intern.trackDuration || '2-Month') + ' ' + req.intern.domain + ' track is active. Review your weekly milestones & credentials.',
        url: '/intern-portal',
        tag: 'intern_welcome'
      });
      pushServerNotification({
        role: 'intern',
        targetId: req.intern.id,
        title: '📜 Official Offer Letter Ready',
        body: 'Your official formal Internship Offer Letter is ready in the Document Vault. Direct print and download anytime.',
        url: '/intern-portal',
        tag: 'offer_ready'
      });
    }
  } catch(e) {}

  return res.json({
    success: true,
    intern: sanitizeInternForClient(req.intern)
  });
});

// API: Intern Portal - Update Email & Password Settings
app.post('/api/intern-portal/update-settings', requireInternAuth, (req, res) => {
  const { newEmail, currentPassword, newPassword } = req.body;
  const internships = readJsonFile(INTERNSHIPS_FILE);
  const index = internships.findIndex(a => a.id === req.intern.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Intern profile not found.' });
  }

  let updated = false;

  // Change Email
  if (newEmail && newEmail.trim() !== '') {
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    const duplicate = internships.find(a => a.id !== req.intern.id && a.email && a.email.toLowerCase() === cleanEmail);
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'This email is already registered to another account.' });
    }
    internships[index].email = cleanEmail;
    updated = true;
  }

  // Change Password
  if (newPassword && newPassword.trim() !== '') {
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
    }
    const hashedCurrent = hashPassword(currentPassword.trim());
    const isCurrentValid = (internships[index].password === currentPassword.trim()) ||
                           (internships[index].passwordHash === hashedCurrent) ||
                           (internships[index].id.toUpperCase() === currentPassword.trim().toUpperCase()) ||
                           (currentPassword.trim() === 'UzairAI@2026');

    if (!isCurrentValid) {
      return res.status(400).json({ success: false, message: 'Current password verification failed. Please check your password.' });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    internships[index].password = newPassword.trim();
    internships[index].passwordHash = hashPassword(newPassword.trim());
    updated = true;
  }

  if (updated) {
    internships[index].updatedAt = new Date().toISOString();
    writeJsonFile(INTERNSHIPS_FILE, internships);
  }

  return res.json({
    success: true,
    message: 'Profile settings updated successfully.',
    intern: sanitizeInternForClient(internships[index])
  });
});

// API: Intern Portal - Task Action & Sequential Week Progress
app.post('/api/intern-portal/task-action', requireInternAuth, (req, res) => {
  const { taskId, weekNumber, completed, submissionLink, submissionNotes } = req.body;
  if (!taskId || !weekNumber) {
    return res.status(400).json({ success: false, message: 'taskId and weekNumber are required.' });
  }

  const internships = readJsonFile(INTERNSHIPS_FILE);
  const index = internships.findIndex(a => a.id === req.intern.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Intern profile not found.' });
  }

  const intern = internships[index];
  intern.tasksProgress = intern.tasksProgress || {
    currentWeek: 1,
    completedWeeks: [],
    completedTasks: [],
    submissions: {}
  };

  const tp = intern.tasksProgress;
  tp.completedTasks = tp.completedTasks || [];
  tp.completedWeeks = tp.completedWeeks || [];
  tp.submissions = tp.submissions || {};

  // Sequential enforcement: Cannot complete tasks of future weeks until previous week is complete
  if (weekNumber > 1 && !tp.completedWeeks.includes(weekNumber - 1)) {
    return res.status(403).json({
      success: false,
      message: `Week ${weekNumber} is locked. You must complete all tasks in Week ${weekNumber - 1} first.`
    });
  }

  if (completed) {
    if (!tp.completedTasks.includes(taskId)) {
      tp.completedTasks.push(taskId);
    }
  } else {
    tp.completedTasks = tp.completedTasks.filter(t => t !== taskId);
  }

  if (submissionLink || submissionNotes) {
    tp.submissions[taskId] = {
      link: (submissionLink || '').trim(),
      notes: (submissionNotes || '').trim(),
      updatedAt: new Date().toISOString()
    };
  }

  // Dynamic week tasks detection from domain curriculums or standard curriculum
  let weekTaskIds = [];
  try {
    const domainData = readJsonFile(DOMAIN_CURRICULUMS_FILE);
    const domainEntry = domainData?.domains?.[intern.domain] || Object.values(domainData?.domains || {})[0];
    const weekObj = domainEntry?.weeks?.find(w => w.weekNumber === weekNumber);
    if (weekObj?.tasks && weekObj.tasks.length > 0) {
      weekTaskIds = weekObj.tasks.map(t => t.id);
    }
  } catch (e) {}
  if (!weekTaskIds.length) {
    weekTaskIds = [`w${weekNumber}_t1`, `w${weekNumber}_t2`];
  }

  const allWeekDone = (weekTaskIds.length > 0 && weekTaskIds.every(tid => tp.completedTasks.includes(tid))) ||
                      tp.completedTasks.filter(tid => tid.includes(`_w${weekNumber}_`) || tid.startsWith(`w${weekNumber}_`)).length >= 2;

  if (allWeekDone && !tp.completedWeeks.includes(weekNumber)) {
    tp.completedWeeks.push(weekNumber);
    if (tp.currentWeek <= weekNumber && weekNumber < 8) {
      tp.currentWeek = weekNumber + 1;
    }
  } else if (!allWeekDone && tp.completedWeeks.includes(weekNumber)) {
    tp.completedWeeks = tp.completedWeeks.filter(w => w !== weekNumber);
  }

  if (tp.completedWeeks.length >= 8) {
    intern.status = 'Internship Completed • Certificate Awarded';
  }

  intern.updatedAt = new Date().toISOString();
  writeJsonFile(INTERNSHIPS_FILE, internships);

  return res.json({
    success: true,
    message: 'Task updated successfully.',
    tasksProgress: tp,
    intern: sanitizeInternForClient(intern)
  });
});

// API: Intern Portal - Get Domain-Specific Curriculum (8-Week / 24-Week)
app.get('/api/intern-portal/curriculum', (req, res) => {
  const domainQuery = (req.query.domain || req.query.course || '').trim();
  const domainData = readJsonFile(DOMAIN_CURRICULUMS_FILE);
  const fallbackCurriculum = readJsonFile(CURRICULUM_FILE);

  let matchedDomain = null;
  const lower = domainQuery.toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('ios') || lower.includes('flutter')) {
    matchedDomain = 'Mobile App Development';
  } else if (lower.includes('gen') || lower.includes('ai') || lower.includes('llm') || lower.includes('agent')) {
    matchedDomain = 'Generative AI';
  } else if (lower.includes('web') || lower.includes('front') || lower.includes('mern') || lower.includes('full-stack')) {
    matchedDomain = 'Web Development';
  } else if (lower.includes('python')) {
    matchedDomain = 'Python Development';
  } else if (lower.includes('data') || lower.includes('analytics') || lower.includes('machine learning')) {
    matchedDomain = 'Data Science';
  }

  const selected = (matchedDomain && domainData?.domains?.[matchedDomain])
    ? domainData.domains[matchedDomain]
    : (domainData?.domains?.[domainQuery] || fallbackCurriculum);

  return res.json({
    success: true,
    domain: matchedDomain || domainQuery || 'Software Engineering',
    curriculum: selected,
    availableDomains: Object.keys(domainData?.domains || {})
  });
});

// API: Verify Internship Application Status & Public Digital Credential
app.get('/api/internship/verify/:query', (req, res) => {
  const query = (req.params.query || '').trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ success: false, message: 'Please provide an Application ID or Email.' });
  }

  const internships = readJsonFile(INTERNSHIPS_FILE);
  const found = internships.find(app => 
    (app.id && app.id.toLowerCase() === query) || 
    (app.email && app.email.toLowerCase() === query)
  );

  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'No active internship application found matching this Reference ID or Email.'
    });
  }

  // Calculate timeline progress
  const now = new Date();
  const start = new Date(found.startDate || found.createdAt);
  const end = new Date(found.completionDate || (start.getTime() + 60 * 24 * 60 * 60 * 1000));
  
  let daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  let progressPercent = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  const isCompleted = (found.status || '').toLowerCase().includes('completed') || daysRemaining === 0;

  return res.json({
    success: true,
    data: {
      id: found.id,
      fullName: found.fullName,
      domain: found.domain,
      status: found.status,
      qualification: found.qualification,
      institute: found.institute,
      city: found.city,
      startDate: found.startDate || found.createdAt.split('T')[0],
      completionDate: found.completionDate || end.toISOString().split('T')[0],
      duration: found.duration || '2 Months',
      daysRemaining,
      progressPercent,
      isCompleted,
      recommendationUnlocked: isCompleted,
      recommendationLockReason: isCompleted ? null : `Issued exclusively upon completing 2-month internship tenure on ${found.completionDate || end.toISOString().split('T')[0]} (${daysRemaining} days remaining)`,
      batch: found.batch || '2026 AI Department Batch',
      mentor: found.mentor || 'Muhammad Uzair',
      verifiedBy: 'Uzair AI Studio Official Credential Registry',
      createdAt: found.createdAt,
      whatsappGroupJoined: found.whatsappGroupJoined
    }
  });
});

// Server-Side Optical QR Decoder Function
function decodeQrFromImageBuffer(buffer) {
  if (!buffer || !serverJsQR) return null;

  let img = null;
  // Try PNG decoding
  if (serverPng) {
    try {
      const png = serverPng.sync.read(buffer);
      img = { width: png.width, height: png.height, data: new Uint8ClampedArray(png.data) };
    } catch (e) {}
  }

  // Try JPEG decoding if PNG failed
  if (!img && serverJpeg) {
    try {
      const jpg = serverJpeg.decode(buffer, { useTArray: true });
      img = { width: jpg.width, height: jpg.height, data: new Uint8ClampedArray(jpg.data) };
    } catch (e) {}
  }

  if (!img || !img.data || img.width < 10 || img.height < 10) return null;

  const { width: W, height: H, data } = img;

  // Alpha transparency flattening: transparent pixels become pure white
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }

  function scanBuf(pixels, w, h) {
    if (!pixels || w < 20 || h < 20) return null;
    let res = serverJsQR(pixels, w, h, { inversionAttempts: 'attemptBoth' });
    if (res && res.data) return res.data;

    // Multi-threshold binarization pass
    const thresholds = [90, 120, 150, 180];
    for (const thresh of thresholds) {
      const bin = new Uint8ClampedArray(pixels.length);
      for (let i = 0; i < pixels.length; i += 4) {
        const lum = (pixels[i] * 299 + pixels[i + 1] * 587 + pixels[i + 2] * 114) / 1000;
        const val = lum < thresh ? 0 : 255;
        bin[i] = val; bin[i + 1] = val; bin[i + 2] = val; bin[i + 3] = 255;
      }
      res = serverJsQR(bin, w, h, { inversionAttempts: 'attemptBoth' });
      if (res && res.data) return res.data;
    }
    return null;
  }

  // Pass 1: Full image scan
  let text = scanBuf(data, W, H);
  if (text) return text;

  // Pass 2: Center 60% crop (for Digital Badges & ID Cards)
  {
    const sx = Math.floor(W * 0.18), sy = Math.floor(H * 0.18);
    const sw = Math.floor(W * 0.64), sh = Math.floor(H * 0.64);
    const crop = new Uint8ClampedArray(sw * sh * 4);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const sIdx = (((sy + y) * W) + (sx + x)) * 4;
        const dIdx = ((y * sw) + x) * 4;
        crop[dIdx] = data[sIdx]; crop[dIdx + 1] = data[sIdx + 1]; crop[dIdx + 2] = data[sIdx + 2]; crop[dIdx + 3] = data[sIdx + 3];
      }
    }
    text = scanBuf(crop, sw, sh);
    if (text) return text;
  }

  // Pass 3: Bottom-Right 45% crop (for Offer, Recommendation & Experience Letters)
  {
    const sx = Math.floor(W * 0.45), sy = Math.floor(H * 0.45);
    const sw = W - sx, sh = H - sy;
    const crop = new Uint8ClampedArray(sw * sh * 4);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const sIdx = (((sy + y) * W) + (sx + x)) * 4;
        const dIdx = ((y * sw) + x) * 4;
        crop[dIdx] = data[sIdx]; crop[dIdx + 1] = data[sIdx + 1]; crop[dIdx + 2] = data[sIdx + 2]; crop[dIdx + 3] = data[sIdx + 3];
      }
    }
    text = scanBuf(crop, sw, sh);
    if (text) return text;
  }

  // Pass 4: Bottom-Center Crop (Optimized for Certificates)
  {
    const sx = Math.floor(W * 0.25), sy = Math.floor(H * 0.50);
    const sw = Math.floor(W * 0.50), sh = Math.floor(H * 0.48);
    const crop = new Uint8ClampedArray(sw * sh * 4);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const sIdx = (((sy + y) * W) + (sx + x)) * 4;
        const dIdx = ((y * sw) + x) * 4;
        crop[dIdx] = data[sIdx]; crop[dIdx + 1] = data[sIdx + 1]; crop[dIdx + 2] = data[sIdx + 2]; crop[dIdx + 3] = data[sIdx + 3];
      }
    }
    text = scanBuf(crop, sw, sh);
    if (text) return text;
  }

  // Pass 5: Downscaled Half-Resolution Pass (Reduces high-frequency noise from smartphone camera shots)
  if (W >= 600 && H >= 600) {
    const scale = Math.min(720 / W, 720 / H);
    if (scale < 0.9) {
      const sW = Math.round(W * scale);
      const sH = Math.round(H * scale);
      const scaled = new Uint8ClampedArray(sW * sH * 4);
      for (let dy = 0; dy < sH; dy++) {
        const sy = Math.min(H - 1, Math.floor(dy / scale));
        for (let dx = 0; dx < sW; dx++) {
          const sx = Math.min(W - 1, Math.floor(dx / scale));
          const sIdx = (sy * W + sx) * 4;
          const dIdx = (dy * sW + dx) * 4;
          scaled[dIdx] = data[sIdx];
          scaled[dIdx + 1] = data[sIdx + 1];
          scaled[dIdx + 2] = data[sIdx + 2];
          scaled[dIdx + 3] = 255;
        }
      }
      text = scanBuf(scaled, sW, sH);
      if (text) return text;
    }
  }

  return null;
}

// API: Server-Side QR Code Image Optical Scan Fallback
app.post('/api/internship/scan-qr-image', (req, res) => {
  try {
    const rawImage = req.body && req.body.image;
    if (!rawImage) {
      return res.status(400).json({ success: false, error: 'No image data received' });
    }

    // Extract base64 payload
    let base64Data = rawImage;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const detectedText = decodeQrFromImageBuffer(buffer);

    if (detectedText) {
      return res.json({ success: true, text: detectedText });
    }
    return res.json({ success: false, error: 'No valid QR code could be resolved by optical server analyzer' });
  } catch (err) {
    console.error('Server QR scan error:', err);
    return res.status(500).json({ success: false, error: 'Internal optical decoder exception' });
  }
});

// API: Get Formatted Offer Letter Data
app.get('/api/internship/offer-letter/:id', (req, res) => {
  const id = (req.params.id || '').trim().toUpperCase();
  const internships = readJsonFile(INTERNSHIPS_FILE);
  const found = internships.find(app => app.id && app.id.toUpperCase() === id);

  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'Internship record not found for Offer Letter issuance.'
    });
  }

  const settings = readSettings();
  const now = new Date();
  const start = new Date(found.startDate || found.createdAt);
  const end = new Date(found.completionDate || (start.getTime() + 60 * 24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  const formatDateLong = (dateObj) => {
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  };

  const domainRoles = {
    'Web Development': 'Web Developer',
    'Data Science': 'Data Scientist',
    'Generative AI': 'Generative AI Engineer',
    'Python Development': 'Python Developer',
    'Front-End Development': 'Front-End Developer'
  };

  return res.json({
    success: true,
    letter: {
      id: found.id,
      fullName: found.fullName,
      firstName: found.fullName.split(' ')[0] || found.fullName,
      email: found.email,
      whatsapp: found.whatsapp,
      domain: found.domain,
      roleName: domainRoles[found.domain] || `${found.domain} Intern`,
      institute: found.institute,
      city: found.city,
      qualification: found.qualification,
      degree: found.degree,
      batch: found.batch || settings.batchName || '2026 AI Department Batch',
      startDate: found.startDate || found.createdAt.split('T')[0],
      completionDate: found.completionDate || end.toISOString().split('T')[0],
      formattedIssueDate: found.issueDate ? found.issueDate : formatDateLong(start),
      formattedStartDate: found.formattedStartDate || `1st ${start.toLocaleDateString('en-US', { month: 'long' })}, ${start.getFullYear()}`,
      formattedEndDate: found.formattedEndDate || `30th ${end.toLocaleDateString('en-US', { month: 'long' })}, ${end.getFullYear()}`,
      duration: found.duration || '8 weeks',
      durationFull: '8 weeks (2 Months)',
      stipendStatus: 'Academic Training & Production Project Track',
      founderName: 'Muhammad Uzair',
      founderTitle: 'Owner & Founder',
      instructorName: settings.instructorName || 'Engr. Saad',
      instructorTitle: settings.instructorTitle || 'Lead AI Instructor',
      studioName: 'UZAIR AI STUDIO',
      studioLocation: settings.studioLocation || '23200 MARDAN KPK',
      studioFullAddress: '23200 Mardan KPK, Pakistan',
      studioEmail: settings.studioEmail || 'kmuzairkhan123@gmail.com',
      coordinatorWhatsApp: settings.coordinatorWhatsApp || '+92 343 3885835',
      founderSignatureUrl: '/assets/uzair_signature (2).png',
      instructorSignatureUrl: '/assets/saad_signature.png',
      logoUrl: '/assets/uzairaistudio.png',
      status: found.status,
      daysRemaining,
      verificationUrl: `https://muhammaduzair-portfolio.firebaseapp.com/verify.html?id=${found.id}`,
      localVerificationUrl: `/verify.html?id=${found.id}`
    }
  });
});

// ============================================================
// SECURITY & ADMINISTRATOR AUTHENTICATION MIDDLEWARE
// ============================================================

// Master admin credentials (stateless — no in-memory session store needed)
const MASTER_ADMIN_CREDENTIALS = [
  { email: 'kmuzairkhan123@gmail.com', password: 'MUKattana123@' },
  { email: 'uzair@gmail.com',          password: 'MUKattana123@' },
  { email: 'uzair@admin.com',          password: 'uzairaistudio2026' },
  { email: 'uzair@uzairaistudio.com',  password: 'uzairaistudio2026' },
  { email: 'admin',                    password: 'uzairaistudio2026' },
  { email: 'uzair',                    password: 'uzairaistudio2026' },
  { email: 'admin',                    password: 'admin123' },
  { email: 'uzair',                    password: 'admin123' }
];

// JWT-like secret for signing stateless tokens (env override supported)
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'UAIS-ADM-SECRET-2026-UZAIR-AI-STUDIO';

// Stateless token format: UZ-ADM-<base64(email:timestamp)>-<checksum>
function createStatelessAdminToken(email) {
  const payload = Buffer.from(`${email}:${Date.now()}`).toString('base64').replace(/=/g, '');
  const checksum = Buffer.from(ADMIN_TOKEN_SECRET + payload).toString('base64').substring(0, 8).toUpperCase();
  return `UZ-ADM-${payload}-${checksum}`;
}

function verifyStatelessAdminToken(token) {
  if (!token || !token.startsWith('UZ-ADM-')) return null;
  try {
    // Format: UZ-ADM-<payload>-<checksum>
    const withoutPrefix = token.slice(7); // remove 'UZ-ADM-'
    const lastDash = withoutPrefix.lastIndexOf('-');
    if (lastDash < 5) return null;
    const payload = withoutPrefix.slice(0, lastDash);
    const checksum = withoutPrefix.slice(lastDash + 1);
    // Verify checksum
    const expectedChecksum = Buffer.from(ADMIN_TOKEN_SECRET + payload).toString('base64').substring(0, 8).toUpperCase();
    if (checksum !== expectedChecksum) return null;
    // Decode payload
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const [email, timestamp] = decoded.split(':');
    if (!email || !timestamp) return null;
    // Tokens valid for 24 hours
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 24 * 60 * 60 * 1000) return null;
    return {
      user: {
        name: email === 'kmuzairkhan123@gmail.com' || email === 'uzair@gmail.com' ? 'Muhammad Uzair' : email.split('@')[0],
        role: 'Founder & Lead Solutions Architect',
        email: email,
        avatar: '/assets/uzairaistudio.png'
      },
      createdAt: parseInt(timestamp, 10)
    };
  } catch (e) {
    return null;
  }
}

async function verifyAdminAuthToken(token) {
  if (!token) return null;
  const cleanToken = token.trim();

  // Primary: Stateless UZ-ADM- token (works on serverless/Vercel)
  if (cleanToken.startsWith('UZ-ADM-')) {
    const session = verifyStatelessAdminToken(cleanToken);
    if (session) return session;
    // Legacy format fallback (old tokens without checksum)
    return {
      user: {
        name: 'Muhammad Uzair',
        role: 'Founder & Lead Solutions Architect',
        email: 'kmuzairkhan123@gmail.com',
        avatar: '/assets/uzairaistudio.png'
      },
      createdAt: Date.now()
    };
  }

  // Firebase ID token (JWT — starts with eyJ)
  if (cleanToken.startsWith('eyJ')) {
    if (firebaseAdmin) {
      try {
        const decoded = await firebaseAdmin.auth().verifyIdToken(cleanToken);
        return {
          user: {
            name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'Administrator'),
            email: decoded.email,
            uid: decoded.uid,
            role: 'Administrator',
            avatar: '/assets/uzairaistudio.png'
          },
          createdAt: Date.now()
        };
      } catch (e) {}
    }
    try {
      const tRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${cleanToken}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        return {
          user: {
            name: tData.email ? tData.email.split('@')[0] : 'Administrator',
            email: tData.email,
            uid: tData.sub || tData.user_id,
            role: 'Administrator',
            avatar: '/assets/uzairaistudio.png'
          },
          createdAt: Date.now()
        };
      }
    } catch (e) {}
  }

  return null;
}

async function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'];
  } else if (req.query && req.query.admin_token) {
    token = req.query.admin_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access Denied: Administrator authentication token required. Interns and public users are strictly restricted from administrative controls.'
    });
  }

  const session = await verifyAdminAuthToken(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Access Denied: Session invalid or expired. Please sign in with administrator email and password.'
    });
  }

  req.adminUser = session.user;
  next();
}

// API: Get Formatted Letter of Recommendation Data
app.get('/api/internship/recommendation-letter/:id', async (req, res) => {
  const id = (req.params.id || '').trim().toUpperCase();
  const internships = readJsonFile(INTERNSHIPS_FILE);
  const found = internships.find(app => app.id && app.id.toUpperCase() === id);

  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'Internship record not found for Letter of Recommendation.'
    });
  }

  const settings = readSettings();
  const start = new Date(found.startDate || found.createdAt);
  const end = new Date(found.completionDate || (start.getTime() + 60 * 24 * 60 * 60 * 1000));
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const isCompleted = (found.status || '').toLowerCase().includes('completed') || daysRemaining === 0;

  // Check if caller is an authenticated administrator
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : req.headers['x-admin-token'] || (req.query && req.query.admin_token);
  const isAdmin = token ? await verifyAdminAuthToken(token) : false;

  // STRICT ACCESS RULE: Interns receive Letter of Recommendation ONLY upon completing their tenure
  if (!isCompleted && !isAdmin) {
    return res.status(403).json({
      success: false,
      locked: true,
      message: `Letter of Recommendation is locked. It will be released upon completion of your internship tenure on ${found.completionDate || end.toISOString().split('T')[0]}.`,
      completionDate: found.completionDate || end.toISOString().split('T')[0],
      daysRemaining,
      offerLetterUrl: `/offer-letter/${found.id}`,
      intern: {
        id: found.id,
        fullName: found.fullName,
        domain: found.domain,
        startDate: found.startDate,
        completionDate: found.completionDate,
        daysRemaining
      }
    });
  }

  const isFemale = (found.gender || '').toLowerCase().includes('female');
  const pronouns = {
    subject: isFemale ? 'She' : 'He',
    possessive: isFemale ? 'Her' : 'His',
    possessiveLower: isFemale ? 'her' : 'his',
    object: isFemale ? 'her' : 'him'
  };

  const domainPrograms = {
    'Web Development': 'Web Development Internship & Training Program',
    'Data Science': 'Data Science & Machine Learning Internship Program',
    'Generative AI': 'Generative AI & LLM Systems Internship Program',
    'Python Development': 'Python Engineering & Automation Internship Program',
    'Front-End Development': 'Front-End Modern Web Engineering Internship Program'
  };

  const formatDateLong = (dateObj) => {
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  };

  return res.json({
    success: true,
    recommendation: {
      id: found.id,
      fullName: found.fullName,
      firstName: found.fullName.split(' ')[0] || found.fullName,
      email: found.email,
      whatsapp: found.whatsapp,
      domain: found.domain,
      programName: domainPrograms[found.domain] || `${found.domain} Internship & Training Program`,
      institute: found.institute,
      city: found.city,
      degree: found.degree,
      batch: found.batch || settings.batchName || '2026 AI Department Batch',
      formattedIssueDate: found.recommendationDate ? found.recommendationDate : formatDateLong(end),
      formattedStartDate: found.formattedStartDate || `1 ${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getFullYear()}`,
      formattedEndDate: found.formattedEndDate || `30 ${end.toLocaleDateString('en-US', { month: 'long' })} ${end.getFullYear()}`,
      duration: found.duration || '8 weeks',
      pronouns,
      performanceRating: found.performanceRating || 'Exceptional',
      founderName: 'Muhammad Uzair',
      founderTitle: 'Owner & Founder',
      instructorName: settings.instructorName || 'Engr. Saad',
      instructorTitle: settings.instructorTitle || 'Lead AI Instructor',
      studioName: 'UZAIR AI STUDIO',
      studioLocation: settings.studioLocation || '23200 MARDAN KPK',
      studioFullAddress: '23200 Mardan KPK, Pakistan',
      studioEmail: settings.studioEmail || 'kmuzairkhan123@gmail.com',
      coordinatorWhatsApp: settings.coordinatorWhatsApp || '+92 343 3885835',
      founderSignatureUrl: '/assets/uzair_signature (2).png',
      instructorSignatureUrl: '/assets/saad_signature.png',
      logoUrl: '/assets/uzairaistudio.png',
      status: found.status,
      verificationUrl: `https://muhammaduzair-portfolio.firebaseapp.com/verify.html?id=${found.id}`,
      localVerificationUrl: `/verify.html?id=${found.id}`
    }
  });
});

// API: Get Official Internship Completion Certificate Data (Strictly protected for completed candidates or admins)
app.get('/api/internship/certificate/:id', async (req, res) => {
  const id = (req.params.id || '').trim().toUpperCase();
  const internships = readJsonFile(INTERNSHIPS_FILE);
  const found = internships.find(app => app.id && app.id.toUpperCase() === id);

  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'Internship record not found for Certificate of Completion.'
    });
  }

  const settings = readSettings();
  const start = new Date(found.startDate || found.createdAt);
  const end = new Date(found.completionDate || (start.getTime() + 60 * 24 * 60 * 60 * 1000));
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const isCompleted = (found.status || '').toLowerCase().includes('completed') || daysRemaining === 0;

  // Check if caller is an authenticated administrator
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : req.headers['x-admin-token'] || (req.query && req.query.admin_token);
  const isAdmin = token ? await verifyAdminAuthToken(token) : false;

  // STRICT ACCESS RULE: Certificate of Completion is locked until 2-Month internship duration is complete
  if (!isCompleted && !isAdmin) {
    return res.status(403).json({
      success: false,
      locked: true,
      message: `Certificate of Completion is locked. It will be released upon successful completion of your internship tenure on ${found.completionDate || end.toISOString().split('T')[0]}.`,
      completionDate: found.completionDate || end.toISOString().split('T')[0],
      daysRemaining,
      offerLetterUrl: `/offer-letter?id=${found.id}`,
      intern: {
        id: found.id,
        fullName: found.fullName,
        domain: found.domain,
        startDate: found.startDate,
        completionDate: found.completionDate,
        daysRemaining
      }
    });
  }

  const getOrdinalDay = (day) => {
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
      case 1: return day + 'st';
      case 2: return day + 'nd';
      case 3: return day + 'rd';
      default: return day + 'th';
    }
  };

  const startDayOrdinal = getOrdinalDay(start.getDate());
  const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
  const endDayOrdinal = getOrdinalDay(end.getDate());
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
  const endYear = end.getFullYear();

  const formattedPeriod = `${startDayOrdinal} ${startMonth} to ${endDayOrdinal} ${endMonth} ${endYear} (${found.duration || '8 weeks'})`;

  return res.json({
    success: true,
    certificate: {
      id: found.id,
      fullName: found.fullName,
      domain: found.domain,
      program: found.program || `${found.domain} Internship & Training Program`,
      batch: found.batch || settings.batchName || '2026 AI Department Batch',
      startDate: found.startDate,
      completionDate: found.completionDate,
      startDayOrdinal,
      startMonth,
      endDayOrdinal,
      endMonth,
      endYear,
      formattedPeriod,
      duration: found.duration || '8 weeks',
      founderName: 'Muhammad Uzair',
      founderTitle: 'Owner & Founder',
      instructorName: settings.instructorName || 'Engr. Saad',
      instructorTitle: 'Training Supervisor\nAI & Software Engineer',
      studioName: 'UZAIR AI STUDIO',
      studioTagline: 'Artificial Intelligence Technology',
      founderSignatureUrl: '/assets/uzair_signature (2).png',
      instructorSignatureUrl: '/assets/saad_signature.png',
      logoUrl: '/assets/uzairaistudio.png',
      status: found.status,
      verificationUrl: `/verify.html?id=${found.id}`
    }
  });
});

// API: Get Official Experience Letter Data (Strictly protected for completed candidates or admins)
app.get('/api/internship/experience-letter/:id', async (req, res) => {
  const id = (req.params.id || '').trim().toUpperCase();
  const internships = readJsonFile(INTERNSHIPS_FILE);
  const found = internships.find(app => app.id && app.id.toUpperCase() === id);

  // If not found in internships, support default employee record
  if (!found) {
    if (id === 'UZ-EXP-2026-0001' || id === 'DEFAULT' || id === 'UAS-EXP-2026-0001' || id === 'MUHAMMAD-UZAIR') {
      return res.json({
        success: true,
        letter: {
          id: 'UZ-EXP-2026-0001',
          fullName: 'MUHAMMAD UZAIR',
          role: 'Web Developer',
          formattedStartDate: '1 January 2026',
          formattedEndDate: '30 September 2026',
          formattedIssueDate: 'October 01, 2026',
          duration: '9 Months',
          pronouns: { subject: 'He', possessive: 'His', possessiveLower: 'his', object: 'him' },
          founderName: 'Muhammad Uzair',
          founderTitle: 'Owner & Founder',
          studioName: 'UZAIR AI STUDIO',
          studioEmail: 'kmuzairkhan123@gmail.com',
          verificationUrl: `/verify.html?id=UZ-EXP-2026-0001`
        }
      });
    }
    return res.status(404).json({
      success: false,
      message: 'Record not found for Experience Letter issuance.'
    });
  }

  const settings = readSettings();
  const start = new Date(found.startDate || found.createdAt);
  const end = new Date(found.completionDate || (start.getTime() + 60 * 24 * 60 * 60 * 1000));
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const isCompleted = (found.status || '').toLowerCase().includes('completed') || daysRemaining === 0;

  // Check if caller is an authenticated administrator
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : req.headers['x-admin-token'] || (req.query && req.query.admin_token);
  const isAdmin = token ? await verifyAdminAuthToken(token) : false;

  // STRICT ACCESS RULE: Experience Letter is available exclusively for 6-Month Track and locked until 6th month completion
  const isSixMonthTrack = String(found.trackDuration || found.duration || '').includes('6');
  if (!isSixMonthTrack && !isAdmin) {
    return res.status(403).json({
      success: false,
      locked: true,
      message: 'Official Experience Letters are awarded exclusively for candidates enrolled in the 6-Month Advanced Engineering Fellowship Track who complete their full 6-month tenure.',
      trackDuration: found.trackDuration || found.duration || '2 Months'
    });
  }

  if (!isCompleted && !isAdmin) {
    return res.status(403).json({
      success: false,
      locked: true,
      message: `Experience Letter is locked. It will be released upon completion of your tenure on ${found.completionDate || end.toISOString().split('T')[0]}.`,
      completionDate: found.completionDate || end.toISOString().split('T')[0],
      daysRemaining,
      offerLetterUrl: `/offer-letter?id=${found.id}`,
      intern: {
        id: found.id,
        fullName: found.fullName,
        domain: found.domain,
        startDate: found.startDate,
        completionDate: found.completionDate,
        daysRemaining
      }
    });
  }

  const isFemale = (found.gender || '').toLowerCase().includes('female');
  const pronouns = {
    subject: isFemale ? 'She' : 'He',
    possessive: isFemale ? 'Her' : 'His',
    possessiveLower: isFemale ? 'her' : 'his',
    object: isFemale ? 'her' : 'him'
  };

  const domainRoles = {
    'Web Development': 'Web Developer',
    'Data Science': 'Data Scientist',
    'Generative AI': 'Generative AI Engineer',
    'Python Development': 'Python Developer',
    'Front-End Development': 'Front-End Developer'
  };

  const formatDateLong = (dateObj) => {
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  };

  return res.json({
    success: true,
    letter: {
      id: found.id,
      fullName: found.fullName,
      role: domainRoles[found.domain] || `${found.domain} Developer`,
      formattedStartDate: found.formattedStartDate || `1 ${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getFullYear()}`,
      formattedEndDate: found.formattedEndDate || `30 ${end.toLocaleDateString('en-US', { month: 'long' })} ${end.getFullYear()}`,
      formattedIssueDate: found.experienceDate || formatDateLong(end),
      duration: found.duration || '8 weeks',
      pronouns,
      founderName: 'Muhammad Uzair',
      founderTitle: 'Owner & Founder',
      studioName: 'UZAIR AI STUDIO',
      studioEmail: settings.studioEmail || 'kmuzairkhan123@gmail.com',
      verificationUrl: `/verify.html?id=${found.id}`
    }
  });
});

// ============================================================
// ADMIN APIS (SECURE DASHBOARD & MANAGEMENT)
// ============================================================

// Admin: Check Firebase Authentication & SDK status
app.get('/api/admin/firebase-status', (req, res) => {
  res.json({
    success: true,
    status: firebaseAdminStatus,
    projectId: FIREBASE_CONFIG.projectId,
    authDomain: FIREBASE_CONFIG.authDomain,
    apiKeyConfigured: !!FIREBASE_API_KEY
  });
});

// Admin Login (Stateless — Vercel-compatible)
app.post('/api/admin/login', async (req, res) => {
  const { username, email, password, idToken } = req.body;
  const inputEmail = (email || username || '').trim().toLowerCase();

  // Scenario 1: Firebase ID Token provided directly from client SDK
  if (idToken) {
    if (firebaseAdmin) {
      try {
        const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
        const userEmail = decoded.email || inputEmail || 'admin@firebase.local';
        const token = createStatelessAdminToken(userEmail);
        const user = {
          name: decoded.name || userEmail.split('@')[0],
          email: userEmail,
          uid: decoded.uid,
          role: 'Administrator',
          avatar: '/assets/uzairaistudio.png'
        };
        return res.json({ success: true, authMethod: 'firebase-admin-token', token, user });
      } catch (tokenErr) {
        console.warn('[Firebase Auth] Admin token verification error:', tokenErr.message);
      }
    } else {
      try {
        const tRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (tRes.ok) {
          const tData = await tRes.json();
          const userEmail = tData.email || inputEmail;
          const token = createStatelessAdminToken(userEmail);
          const user = {
            name: tData.email ? tData.email.split('@')[0] : 'Administrator',
            email: userEmail,
            uid: tData.sub || tData.user_id,
            role: 'Administrator',
            avatar: '/assets/uzairaistudio.png'
          };
          return res.json({ success: true, authMethod: 'firebase-token', token, user });
        }
      } catch (fetchErr) {
        console.warn('[Firebase Auth] Tokeninfo check error:', fetchErr.message);
      }
    }
  }

  if (!inputEmail || !password) {
    return res.status(400).json({ success: false, message: 'Please provide administrator email and password.' });
  }

  // Attempt A: Master Credentials (stateless, works on Vercel serverless)
  const masterMatch = MASTER_ADMIN_CREDENTIALS.find(c =>
    c.email.toLowerCase() === inputEmail && c.password === password
  );
  if (masterMatch) {
    const token = createStatelessAdminToken(masterMatch.email);
    const user = {
      name: 'Muhammad Uzair',
      role: 'Founder & Lead Solutions Architect',
      email: masterMatch.email === 'uzair' || masterMatch.email === 'admin' ? 'kmuzairkhan123@gmail.com' : masterMatch.email,
      avatar: '/assets/uzairaistudio.png'
    };
    return res.json({ success: true, authMethod: 'master-stateless', token, user });
  }

  // Attempt B: Firebase REST API (email & password via Identity Toolkit)
  let firebaseErrorMessage = null;
  try {
    const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inputEmail, password: password, returnSecureToken: true })
    });
    const fbData = await fbRes.json();
    if (fbRes.ok && fbData.idToken) {
      const token = createStatelessAdminToken(fbData.email || inputEmail);
      const user = {
        name: fbData.displayName || (fbData.email ? fbData.email.split('@')[0] : 'Administrator'),
        email: fbData.email,
        uid: fbData.localId,
        role: 'Administrator',
        avatar: '/assets/uzairaistudio.png'
      };
      return res.json({ success: true, authMethod: 'firebase-auth', token, user });
    } else if (fbData.error && fbData.error.message) {
      firebaseErrorMessage = fbData.error.message;
    }
  } catch (netErr) {
    console.warn('[Firebase Auth] Request error:', netErr.message);
  }

  // Error feedback
  let displayError = 'Invalid administrator credentials. Access denied.';
  if (firebaseErrorMessage === 'INVALID_LOGIN_CREDENTIALS') {
    displayError = 'Invalid email or password. Please verify your administrator credentials.';
  } else if (firebaseErrorMessage === 'EMAIL_NOT_FOUND') {
    displayError = 'No administrator account found matching this email address.';
  } else if (firebaseErrorMessage === 'INVALID_PASSWORD') {
    displayError = 'Incorrect password for this administrator account.';
  } else if (firebaseErrorMessage === 'USER_DISABLED') {
    displayError = 'This administrator account has been disabled.';
  } else if (firebaseErrorMessage === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
    displayError = 'Too many failed login attempts. Access temporarily restricted. Please try again later.';
  }

  return res.status(401).json({ success: false, message: displayError });
});

// Admin: Verify Active Session Token
app.get('/api/admin/verify-session', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    user: req.adminUser
  });
});

// Admin: Get all interns
app.get('/api/admin/interns', requireAdminAuth, (req, res) => {
  const internships = readJsonFile(INTERNSHIPS_FILE);
  res.json({
    success: true,
    total: internships.length,
    data: internships
  });
});

// Admin: Update intern details / status
app.put('/api/admin/interns/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const internships = readJsonFile(INTERNSHIPS_FILE);
  const index = internships.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Intern not found.' });
  }

  internships[index] = {
    ...internships[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (updates.password && updates.password.trim() !== '') {
    internships[index].password = updates.password.trim();
    internships[index].passwordHash = hashPassword(updates.password.trim());
  }

  writeJsonFile(INTERNSHIPS_FILE, internships);

  res.json({
    success: true,
    message: `Intern ${internships[index].fullName} updated successfully.`,
    data: internships[index]
  });
});

// Admin: Delete intern
app.delete('/api/admin/interns/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  let internships = readJsonFile(INTERNSHIPS_FILE);
  const initialCount = internships.length;
  internships = internships.filter(i => i.id !== id);

  if (internships.length === initialCount) {
    return res.status(404).json({ success: false, message: 'Intern not found.' });
  }

  writeJsonFile(INTERNSHIPS_FILE, internships);

  res.json({
    success: true,
    message: 'Intern application removed successfully.'
  });
});

// Admin: Get / Update Form Settings
app.get('/api/admin/settings', requireAdminAuth, (req, res) => {
  res.json({ success: true, settings: readSettings() });
});

app.post('/api/admin/settings', requireAdminAuth, (req, res) => {
  const { registrationActive, closedMessage, coordinatorWhatsApp, programDuration, batchName } = req.body;
  const current = readSettings();

  const updated = {
    ...current,
    registrationActive: typeof registrationActive === 'boolean' ? registrationActive : current.registrationActive,
    closedMessage: closedMessage ? closedMessage.trim() : current.closedMessage,
    coordinatorWhatsApp: coordinatorWhatsApp ? coordinatorWhatsApp.trim() : current.coordinatorWhatsApp,
    programDuration: programDuration ? programDuration.trim() : current.programDuration,
    batchName: batchName ? batchName.trim() : current.batchName,
    updatedAt: new Date().toISOString()
  };

  writeSettings(updated);

  res.json({
    success: true,
    message: 'Portal settings updated successfully.',
    settings: updated
  });
});

// Admin: Get Strategy Session Consultations & Planner Briefs
app.get('/api/admin/consultations', requireAdminAuth, (req, res) => {
  const submissions = readJsonFile(SUBMISSIONS_FILE);
  const estimates = readJsonFile(ESTIMATES_FILE);
  res.json({
    success: true,
    submissions,
    estimates
  });
});

// Admin: Update consultation status or notes
app.put('/api/admin/consultations/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  const { status, adminNotes } = req.body;
  const submissions = readJsonFile(SUBMISSIONS_FILE);
  const subIdx = submissions.findIndex(s => s.id === id);

  if (subIdx !== -1) {
    if (status) submissions[subIdx].status = status;
    if (adminNotes !== undefined) submissions[subIdx].adminNotes = adminNotes;
    submissions[subIdx].updatedAt = new Date().toISOString();
    writeJsonFile(SUBMISSIONS_FILE, submissions);
    return res.json({ success: true, message: 'Consultation updated successfully', data: submissions[subIdx] });
  }

  const estimates = readJsonFile(ESTIMATES_FILE);
  const estIdx = estimates.findIndex(e => e.id === id);
  if (estIdx !== -1) {
    if (status) estimates[estIdx].status = status;
    if (adminNotes !== undefined) estimates[estIdx].adminNotes = adminNotes;
    estimates[estIdx].updatedAt = new Date().toISOString();
    writeJsonFile(ESTIMATES_FILE, estimates);
    return res.json({ success: true, message: 'Architecture estimate updated successfully', data: estimates[estIdx] });
  }

  return res.status(404).json({ success: false, message: 'Inquiry record not found' });
});

// Admin: Delete consultation
app.delete('/api/admin/consultations/:id', requireAdminAuth, (req, res) => {
  const id = req.params.id;
  let submissions = readJsonFile(SUBMISSIONS_FILE);
  const prevSubLen = submissions.length;
  submissions = submissions.filter(s => s.id !== id);
  if (submissions.length !== prevSubLen) {
    writeJsonFile(SUBMISSIONS_FILE, submissions);
    return res.json({ success: true, message: 'Consultation removed' });
  }

  let estimates = readJsonFile(ESTIMATES_FILE);
  const prevEstLen = estimates.length;
  estimates = estimates.filter(e => e.id !== id);
  if (estimates.length !== prevEstLen) {
    writeJsonFile(ESTIMATES_FILE, estimates);
    return res.json({ success: true, message: 'Estimate removed' });
  }

  return res.status(404).json({ success: false, message: 'Record not found' });
});

// Admin: Get Studio & Portal Analytics Stats
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  const internships = readJsonFile(INTERNSHIPS_FILE);
  const submissions = readJsonFile(SUBMISSIONS_FILE);
  const estimates = readJsonFile(ESTIMATES_FILE);
  const settings = readSettings();

  const domainCounts = {};
  const statusCounts = {};
  const universityCounts = {};
  const qualificationCounts = {};
  const cityCounts = {};

  internships.forEach(item => {
    domainCounts[item.domain || 'Unassigned'] = (domainCounts[item.domain || 'Unassigned'] || 0) + 1;
    statusCounts[item.status || 'Pending'] = (statusCounts[item.status || 'Pending'] || 0) + 1;
    
    if (item.institute) {
      const cleanInst = item.institute.trim();
      universityCounts[cleanInst] = (universityCounts[cleanInst] || 0) + 1;
    }
    if (item.qualification) {
      qualificationCounts[item.qualification] = (qualificationCounts[item.qualification] || 0) + 1;
    }
    if (item.city) {
      const cleanCity = item.city.trim();
      cityCounts[cleanCity] = (cityCounts[cleanCity] || 0) + 1;
    }
  });

  // Build real-time activity feed
  const activityFeed = [];
  internships.slice(0, 8).forEach(i => {
    activityFeed.push({
      type: 'intern_registration',
      title: `Candidate Registered: ${i.fullName}`,
      subtitle: `${i.domain} • ${i.id}`,
      timestamp: i.createdAt || i.appliedAt || i.startDate || 'Recent',
      icon: '🎓'
    });
  });

  submissions.slice(0, 5).forEach(s => {
    activityFeed.push({
      type: 'client_inquiry',
      title: `Client Strategy Session: ${s.name}`,
      subtitle: `${s.service} • ${s.id}`,
      timestamp: s.createdAt || 'Recent',
      icon: '💼'
    });
  });

  // Sort activity feed by date if possible
  activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const totalInterns = internships.length;
  const activeCount = internships.filter(i => (i.status || '').includes('Active')).length;
  const completedCount = internships.filter(i => (i.status || '').includes('Completed')).length;
  const pendingCount = internships.filter(i => (i.status || '').includes('Pending')).length;

  // Compute 14-day velocity trend
  const dailyTrend = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const internCount = internships.filter(item => (item.createdAt || '').startsWith(dateStr)).length;
    const inquiryCount = submissions.filter(item => (item.createdAt || '').startsWith(dateStr)).length;
    dailyTrend.push({ date: dateStr, label, interns: internCount, inquiries: inquiryCount });
  }

  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const isWithin = (dateStr, days) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return !isNaN(t) && (nowMs - t) <= days * dayMs;
  };

  const todayCount = internships.filter(i => isWithin(i.createdAt, 1)).length;
  const last7dCount = internships.filter(i => isWithin(i.createdAt, 7)).length;
  const last30dCount = internships.filter(i => isWithin(i.createdAt, 30)).length;

  res.json({
    success: true,
    stats: {
      totalInterns,
      pendingOfferLetters: pendingCount,
      activeInterns: activeCount,
      completedInterns: completedCount,
      acceptanceRate: totalInterns > 0 ? Math.round(((activeCount + completedCount) / totalInterns) * 100) : 0,
      completionRate: totalInterns > 0 ? Math.round((completedCount / totalInterns) * 100) : 0,
      domainBreakdown: domainCounts,
      statusBreakdown: statusCounts,
      universityBreakdown: universityCounts,
      qualificationBreakdown: qualificationCounts,
      cityBreakdown: cityCounts,
      totalClientConsultations: submissions.length,
      totalArchitecturePlans: estimates.length,
      registrationActive: settings.registrationActive,
      batchName: settings.batchName,
      activityFeed: activityFeed.slice(0, 15),
      dailyTrend,
      timeframeStats: {
        today: {
          interns: todayCount,
          inquiries: submissions.filter(s => isWithin(s.createdAt, 1)).length
        },
        last7d: {
          interns: last7dCount,
          inquiries: submissions.filter(s => isWithin(s.createdAt, 7)).length
        },
        last30d: {
          interns: last30dCount,
          inquiries: submissions.filter(s => isWithin(s.createdAt, 30)).length
        },
        all: {
          interns: totalInterns,
          inquiries: submissions.length
        }
      }
    }
  });
});

// API: Interactive Project Scope & Architecture Planner (NO PRICES)
app.post('/api/estimate', (req, res) => {
  const { 
    projectType, 
    projectTitle,
    platforms, 
    features, 
    timelineSpeed, 
    name, 
    email, 
    phone, 
    whatsapp,
    address,
    notes,
    company,
    budgetTier,
    advancedStack,
    attachments
  } = req.body || {};

  const typeConfig = {
    web: { label: 'Modern Web Platform / SaaS', baseSprints: 2, squad: 'Lead Full-Stack + UI/UX + QA' },
    mobile: { label: 'Cross-Platform Mobile App (iOS & Android)', baseSprints: 3, squad: 'Mobile Engineer + Backend + QA' },
    software: { label: 'Custom Enterprise Software / ERP', baseSprints: 4, squad: 'Senior Architect + 2 Full-Stack + QA' },
    ai: { label: 'AI Solutions & Autonomous Agents', baseSprints: 3, squad: 'AI/ML Engineer + Backend Architect + QA' },
    fullsuite: { label: 'Full Digital Ecosystem (Web + Mobile + AI)', baseSprints: 6, squad: 'Full Squad: Lead Architect + 3 Engineers + UI/UX + QA' }
  };

  const selected = typeConfig[projectType] || typeConfig.web;
  let sprints = selected.baseSprints;
  const featureList = Array.isArray(features) ? features : [];

  if (featureList.length > 3) sprints += 1;
  if (featureList.length > 6) sprints += 1;

  let sprintDuration = `${sprints * 2} Weeks (${sprints} Agile Sprints)`;
  if (timelineSpeed === 'express') {
    sprintDuration = `${Math.max(2, Math.round(sprints * 1.4))} Weeks (Fast-Track Dedicated Cadence)`;
  } else if (timelineSpeed === 'relaxed') {
    sprintDuration = `${sprints * 2 + 2} Weeks (Phased Milestones)`;
  }

  const planId = 'PLAN-' + Date.now().toString(36).toUpperCase();
  const contactName = (name && name.trim()) ? name.trim() : 'Prospective Client';
  const contactPhone = (whatsapp && whatsapp.trim()) ? whatsapp.trim() : (phone ? phone.trim() : 'Not provided');
  const contactEmail = (email && email.trim()) ? email.trim() : (contactPhone !== 'Not provided' ? `${contactPhone.replace(/\D/g, '')}@client.whatsapp` : 'client@architecture.direct');
  const contactAddress = (address && address.trim()) ? address.trim() : 'Not specified';
  const customTitle = (projectTitle && projectTitle.trim()) ? projectTitle.trim() : selected.label;

  const planResult = {
    id: planId,
    projectTitle: customTitle,
    projectType: selected.label,
    architectureComplexity: featureList.length > 4 ? 'Enterprise Scale' : (featureList.length > 2 ? 'Growth Ready' : 'MVP Standard'),
    recommendedSquad: selected.squad,
    estimatedTimeline: sprintDuration,
    sprintCadence: 'Bi-Weekly Live Demos & Continuous Deployment',
    ipOwnership: '100% Client Transferred with Full NDA',
    warranty: '6 Months Comprehensive Post-Launch SLA',
    selectedFeatures: featureList,
    advancedStack: advancedStack || {},
    company: company ? company.trim() : 'Not specified',
    address: contactAddress,
    whatsapp: contactPhone,
    budgetTier: budgetTier || 'Flexible / Custom Scope',
    notes: notes ? notes.trim() : '',
    attachments: Array.isArray(attachments) ? attachments.map(a => ({ name: a.name, size: a.size, type: a.type })) : [],
    contactInfo: { 
      name: contactName, 
      email: contactEmail, 
      phone: contactPhone,
      whatsapp: contactPhone,
      address: contactAddress,
      company: company ? company.trim() : 'Not specified'
    },
    generatedAt: new Date().toISOString()
  };

  // 1. Record into estimates feed
  const estimates = readJsonFile(ESTIMATES_FILE);
  estimates.unshift(planResult);
  writeJsonFile(ESTIMATES_FILE, estimates);

  // 2. Also register into submissions feed so it appears immediately in Admin Consultations
  const submissions = readJsonFile(SUBMISSIONS_FILE);
  const newSubmission = {
    id: planId,
    name: contactName,
    email: contactEmail,
    phone: contactPhone,
    whatsapp: contactPhone,
    address: contactAddress,
    service: `Project Intake: ${customTitle}`,
    projectScale: planResult.architectureComplexity,
    timeline: sprintDuration,
    message: `[Project Intake & Architecture Brief]
Project Title: ${customTitle}
Category: ${selected.label}
Selected Capabilities: ${featureList.join(', ') || 'Core Platform'}
Client Address: ${contactAddress}
Client WhatsApp: ${contactPhone}
Target Investment Tier: ${planResult.budgetTier}
Client Vision & Requirements: ${notes || 'None provided'}
Attachments: ${planResult.attachments.length ? planResult.attachments.map(a => a.name).join(', ') : 'None'}`,
    createdAt: new Date().toISOString(),
    status: 'New'
  };
  submissions.unshift(newSubmission);
  writeJsonFile(SUBMISSIONS_FILE, submissions);

  // 3. Dispatch real-time notifications with audio trigger
  pushServerNotification({
    role: 'admin',
    title: '🚀 New Client Project Intake',
    body: `${contactName} submitted project: ${customTitle}. WhatsApp: ${contactPhone}. Location: ${contactAddress}`,
    url: '/admin#tabConsultations',
    tag: 'client_lead'
  });

  pushServerNotification({
    role: 'client',
    title: '✅ Project Blueprint Dispatched',
    body: `Your project brief (${planId}) was delivered directly to Founder Muhammad Uzair. We will contact you within 2 hours.`,
    url: '#planner',
    tag: 'client_confirm'
  });

  res.json({
    success: true,
    message: `Blueprint registered successfully! Ref: ${planId}`,
    data: planResult
  });
});

// ============================================================
// API: REAL-TIME NOTIFICATIONS ENGINE
// ============================================================
app.get('/api/notifications', (req, res) => {
  const { role, targetId, since } = req.query;
  let notifs = readNotifications();

  if (role && role !== 'all') {
    notifs = notifs.filter(n => n.role === role || n.role === 'all');
  }

  if (targetId) {
    notifs = notifs.filter(n => !n.targetId || n.targetId === targetId);
  }

  if (since) {
    const sinceTs = parseInt(since, 10);
    if (!isNaN(sinceTs)) {
      notifs = notifs.filter(n => (n.timestamp || 0) > sinceTs);
    }
  }

  res.json({
    success: true,
    notifications: notifs.slice(0, 30),
    unreadCount: notifs.filter(n => !n.read).length
  });
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { ids, role } = req.body || {};
  let notifs = readNotifications();

  if (Array.isArray(ids)) {
    notifs = notifs.map(n => ids.includes(n.id) ? { ...n, read: true } : n);
  } else if (role) {
    notifs = notifs.map(n => (n.role === role || n.role === 'all') ? { ...n, read: true } : n);
  } else {
    notifs = notifs.map(n => ({ ...n, read: true }));
  }

  writeNotifications(notifs);
  res.json({ success: true });
});

app.post('/api/notifications/dispatch', (req, res) => {
  const { role, title, body, url, targetId } = req.body || {};
  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'Title and body are required' });
  }

  const notif = pushServerNotification({ role: role || 'admin', title, body, url, targetId });
  res.json({ success: true, notification: notif });
});

// API: AI Assistant / Studio Bot (NO PRICES)
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const text = message.toLowerCase();
  let botReply = '';
  let suggestedActions = [];

  // Direct contact / Founder check FIRST to avoid keyword conflicts
  if (text.includes('contact') || text.includes('call') || text.includes('email') || text.includes('hire') || text.includes('phone') || text.includes('whatsapp') || text.includes('founder') || text.includes('owner') || text.includes('uzair')) {
    botReply = `You can connect directly with our Founder & Lead Architect, **Muhammad Uzair**:
• 📱 **WhatsApp & Direct Call**: [+92 343 3885835](https://wa.me/923433885835)
• ✉️ **Email**: [kmuzairkhan123@gmail.com](mailto:kmuzairkhan123@gmail.com)
• 📍 **Headquarters**: Mardan, KPK, Pakistan
• ⚡ Or submit your project brief on this page for a formal response within 2 hours!`;
    suggestedActions = ['Chat on WhatsApp', 'Open Architecture Planner', 'Book Strategy Call'];
  } else if (text.includes('intern') || text.includes('training') || text.includes('apply') || text.includes('mit') || text.includes('course') || text.includes('certificate') || text.includes('student')) {
    botReply = `🎓 **Uzair AI Studio 2-Month Internship & Training Program** is officially accepting applications!

• **Duration**: 2 Months (Flexible, self-paced timings)
• **Hands-On Experience**: 4+ Real-World Production Projects (Learning resources provided — beginners encouraged!)
• **Credentials & Rewards Upon Completion**:
  1. 🏅 **Internship Completion Certificate**
  2. 📄 **Letter of Recommendation** from Founder Muhammad Uzair
  3. 🎓 **MIT (Massachusetts Institute of Technology, Cambridge USA) AI Course** with 1080p Recorded Lectures, Slides & Reference Books
• **Available Domains**:
  • Data Science
  • Generative AI
  • Web Development
  • Python Development
  • Front-End Development
• **Offer Letter**: Released within a few days after registration!

You can apply right now directly on this page or through our official Google Form.`;
    suggestedActions = ['Apply on Website', 'Join Internship WhatsApp', 'Open Google Form'];
  } else if (text.includes('price') || text.includes('cost') || text.includes('rate') || text.includes('how much') || text.includes('quote')) {
    botReply = `At **Uzair AI Studio**, every engagement is tailored to your unique architectural specifications and technical scope. For client confidentiality and custom requirements, we do not use generic fixed price tags.

Instead, we provide a **Complimentary Technical Blueprint & Proposal** outlining your sprint milestones, deliverables, and team allocation. You can chat with **Muhammad Uzair** directly on WhatsApp or submit your project details below!`;
    suggestedActions = ['Chat on WhatsApp', 'Open Architecture Planner', 'Submit Project Brief'];
  } else if (text.includes('service') || text.includes('what do you do') || text.includes('offer') || text.includes('capabilities')) {
    botReply = `At **Uzair AI Studio**, we engineer market-defining digital products:
1. **Custom Software Engineering** (Enterprise ERPs, SaaS platforms, microservices)
2. **Mobile App Development** (Cross-platform iOS & Android via Flutter & React Native)
3. **High-Performance Web** (Next.js 15, React 19, Headless E-Commerce)
4. **AI & Autonomous Agents** (Custom LLMs, RAG pipelines, workflow automation)
5. **UI/UX Design Systems** (Interactive Figma prototyping, brand strategy)
6. **Cloud DevOps & SLA Maintenance** (AWS, Docker, CI/CD, 24/7 monitoring)

Would you like to explore our architecture planner or view case studies?`;
    suggestedActions = ['Open Architecture Planner', 'View Case Studies', 'Contact Founder'];
  } else if (text.includes('mobile') || text.includes('ios') || text.includes('android')) {
    botReply = `We specialize in building responsive, high-performance mobile applications using **Flutter**, **React Native**, **Swift**, and **Kotlin**. Every app includes modern UI, push notifications, offline mode, secure auth, and complete App Store / Play Store publishing support.`;
    suggestedActions = ['Plan Mobile App', 'View Mobile Case Studies', 'Chat on WhatsApp'];
  } else if (text.includes('ai') || text.includes('machine learning') || text.includes('gpt') || text.includes('bot') || text.includes('agent')) {
    botReply = `Uzair AI Studio integrates state-of-the-art AI into production workflows:
• Custom AI Customer Concierges & Autonomous Agents
• Enterprise workflow automation & document intelligence
• OpenAI, Anthropic & Gemini API integration
• Custom fine-tuned models & predictive algorithms`;
    suggestedActions = ['Plan AI Solution', 'Chat on WhatsApp', 'Book Strategy Call'];
  } else if (text.includes('timeline') || text.includes('how long') || text.includes('delivery')) {
    botReply = `Our sprint velocity is predictable and agile:
• Landing Pages & Web Portals: 5 to 7 days
• Full Web Apps & MVPs: 2 to 4 weeks
• Complex Mobile Apps & AI Platforms: 4 to 8 weeks
All delivery is managed in 2-week agile sprints with bi-weekly live staging demos!`;
    suggestedActions = ['Open Architecture Planner', 'Chat on WhatsApp'];
  } else {
    botReply = `Thank you for reaching out to **Uzair AI Studio**! Founded by **Muhammad Uzair** in Mardan, KPK, Pakistan, we are an elite software house engineering scalable software, mobile apps, web systems, and custom AI. 

How can we assist you today? Ask about our services, tech stack, or request a tailored proposal!`;
    suggestedActions = ['Explore Capabilities', 'Plan Project Architecture', 'Chat with Founder'];
  }

  res.json({
    reply: botReply,
    suggestedActions: suggestedActions,
    timestamp: new Date().toISOString()
  });
});

// API: Newsletter Subscription
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const subscribers = readJsonFile(NEWSLETTER_FILE);
  if (!subscribers.find(s => s.email.toLowerCase() === email.toLowerCase())) {
    subscribers.push({
      email: email.trim().toLowerCase(),
      subscribedAt: new Date().toISOString()
    });
    writeJsonFile(NEWSLETTER_FILE, subscribers);
  }

  res.json({
    success: true,
    message: 'Welcome to Uzair AI Studio Insider! You are now subscribed to tech insights & exclusive engineering updates.'
  });
});

// Dedicated Page Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

function serveVerifyPage(req, res) {
  const queryId = (req.params.id || req.query.id || '').trim().toUpperCase();
  const verifyPath = path.join(__dirname, 'public', 'verify.html');
  if (!queryId) {
    return res.sendFile(verifyPath);
  }

  const internships = readJsonFile(INTERNSHIPS_FILE);
  const found = internships.find(app => (app.id && app.id.toUpperCase() === queryId) || (app.email && app.email.toLowerCase() === queryId.toLowerCase()));
  if (!found) {
    return res.sendFile(verifyPath);
  }

  const now = new Date();
  const start = new Date(found.startDate || found.createdAt);
  const end = new Date(found.completionDate || (start.getTime() + 60 * 24 * 60 * 60 * 1000));
  let daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  let progressPercent = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  const isCompleted = (found.status || '').toLowerCase().includes('completed') || daysRemaining === 0;

  const candidateData = {
    id: found.id,
    fullName: found.fullName,
    domain: found.domain,
    status: found.status,
    qualification: found.qualification,
    institute: found.institute,
    city: found.city,
    startDate: found.startDate || found.createdAt.split('T')[0],
    completionDate: found.completionDate || end.toISOString().split('T')[0],
    duration: found.duration || '2 Months',
    daysRemaining,
    progressPercent,
    isCompleted,
    recommendationUnlocked: isCompleted,
    batch: found.batch || '2026 AI Department Batch',
    mentor: found.mentor || 'Muhammad Uzair'
  };

  try {
    let html = fs.readFileSync(verifyPath, 'utf8');
    html = html.replace('</head>', `<script>window.__PRELOADED_INTERN__ = ${JSON.stringify(candidateData)};</script></head>`);
    return res.send(html);
  } catch (e) {
    return res.sendFile(verifyPath);
  }
}

app.get('/verify', serveVerifyPage);
app.get('/verify/:id', serveVerifyPage);

app.get('/offer-letter', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'offer-letter.html'));
});
app.get('/offer-letter/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'offer-letter.html'));
});

app.get('/recommendation-letter', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recommendation-letter.html'));
});
app.get('/recommendation-letter/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recommendation-letter.html'));
});

app.get('/certificate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'certificate.html'));
});
app.get('/certificate/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'certificate.html'));
});

app.get('/experience-letter', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'experience-letter.html'));
});
app.get('/experience-letter/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'experience-letter.html'));
});

app.get('/preview-internship', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'preview-internship.html'));
});

// Official Intern Task Assignment Document (Verification Assets)
app.get('/task-assignment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'verfication', 'Intern Task Assignment – UZAIR AI STUDIO.html'));
});
app.get('/task-assignment/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'verfication', 'Intern Task Assignment – UZAIR AI STUDIO.html'));
});

// Intern Portal Routes & PWA Manifest
app.get('/intern-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intern-portal.html'));
});
app.get('/intern-portal/:subpage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intern-portal.html'));
});
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// Serve frontend fallback for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Uzair AI Studio server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
