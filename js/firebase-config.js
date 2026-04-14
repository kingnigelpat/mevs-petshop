// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8HZZNWDegO9c-A9lyscmgYTvzSrdCOnA",
  authDomain: "mevs-35552.firebaseapp.com",
  projectId: "mevs-35552",
  storageBucket: "mevs-35552.firebasestorage.app",
  messagingSenderId: "681643425046",
  appId: "1:681643425046:web:6047536bc116d9b57a2437",
  measurementId: "G-RLLLRRTDNE"
};

// Cloudinary Configuration
export const cloudinaryConfig = {
    cloudName: "dohfg4cin", // e.g., 'dxyxxxxxx'
    uploadPreset: "mevstore" // Your unsigned upload preset
};

// Check if configured
export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

// Initialize Firebase only if configured (to avoid console errors for placeholder)
let app, db, auth;
if (isConfigured) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}

export { db, auth };
