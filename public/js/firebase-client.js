/**
 * Uzair AI Studio - Unified Firebase Client & Real-Time Sync Engine
 * Connects to Firebase project: muhammaduzair-portfolio
 */

const firebaseConfig = {
  apiKey: "AIzaSyBPCRI9xumOWGe2smioiOCsowLZM0-XQ5M",
  authDomain: "muhammaduzair-portfolio.firebaseapp.com",
  projectId: "muhammaduzair-portfolio",
  storageBucket: "muhammaduzair-portfolio.firebasestorage.app",
  messagingSenderId: "1043771446882",
  appId: "1:1043771446882:web:ae8113ff264581879e633b",
  measurementId: "G-F94Y7NWJJ5"
};

// Global container for Firebase state
window.UzairFirebase = {
  config: firebaseConfig,
  isInitialized: false,
  analytics: null,
  app: null,
  db: null,
  auth: null,
  signInWithEmailAndPassword: null,
  signOut: null,
  onAuthStateChanged: null
};

// Asynchronously load Firebase SDK from official Google CDN
(async function initFirebaseSDK() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js");
    const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js");
    const { getFirestore, collection, addDoc, doc, setDoc, getDocs, onSnapshot } = await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js");
    const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js");

    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const db = getFirestore(app);
    const auth = getAuth(app);

    window.UzairFirebase.app = app;
    window.UzairFirebase.analytics = analytics;
    window.UzairFirebase.db = db;
    window.UzairFirebase.auth = auth;
    window.UzairFirebase.signInWithEmailAndPassword = signInWithEmailAndPassword;
    window.UzairFirebase.signOut = signOut;
    window.UzairFirebase.onAuthStateChanged = onAuthStateChanged;
    window.UzairFirebase.isInitialized = true;
    window.UzairFirebase.firestore = { collection, addDoc, doc, setDoc, getDocs, onSnapshot };

    console.log("⚡ Uzair AI Studio: Cloud Data Engine initialized successfully.");
    
    // Dispatch custom event so listeners can react
    window.dispatchEvent(new CustomEvent('cloud-ready', { detail: { app, db, auth, analytics } }));
  } catch (err) {
    console.warn("Cloud CDN load note (operating in hybrid local mode):", err.message);
  }
})();

// Cloud sync helper for intern applications
window.saveInternToCloud = async function(internData) {
  // Always save to backend first
  try {
    if (window.UzairFirebase.isInitialized && window.UzairFirebase.db) {
      const { doc, setDoc } = window.UzairFirebase.firestore;
      const ref = doc(window.UzairFirebase.db, "interns", internData.id);
      await setDoc(ref, {
        ...internData,
        syncedToCloudAt: new Date().toISOString()
      }, { merge: true });
      console.log("☁️ Intern synced to Firestore:", internData.id);
    }
  } catch (cloudErr) {
    console.warn("Firestore sync deferred:", cloudErr.message);
  }
};
