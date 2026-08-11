/**
 * BCA III Hub — Firebase Realtime Database & Authentication Config
 * Project: bca2nd-5c622
 * Section: /bca3  (all BCA III data lives here — existing data untouched)
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAM8tcsYAnJoLzY6ZUxp6M5h2z-M6AJzDI",
  authDomain: "bca2nd-5c622.firebaseapp.com",
  databaseURL: "https://bca2nd-5c622-default-rtdb.firebaseio.com",
  projectId: "bca2nd-5c622",
  storageBucket: "bca2nd-5c622.appspot.com",
  messagingSenderId: "165637906529",
  appId: "1:165637906529:web:bca3hub"
};

const FIREBASE = {
  rtdbUrl: 'https://bca2nd-5c622-default-rtdb.firebaseio.com',
  section: '/bca3',

  // Registered Admin Emails for automatic Admin privilege assignment
  adminEmails: [
    'baljotchohan23@gmail.com',
    'mehakpreetkaur@gmail.com'
  ],

  // Full REST API URL builder
  url: (path) =>
    `https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/${path}.json`,
};

// Initialize Firebase SDK if available
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }
    if (firebase.auth) {
      firebaseAuth = firebase.auth();
    }
    if (firebase.database) {
      firebaseDb = firebase.database();
    }
  }
} catch (err) {
  console.warn('Firebase SDK init notice:', err);
}

