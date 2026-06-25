import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection } from "firebase/firestore";
import { KidProfile, Message } from "../types";

// Dynamic loading of Firebase configuration if present
let firebaseApp: any = null;
let db: any = null;

// Since we are in AI Studio, sometimes the environment variables or config files are populated dynamically
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || ""
};

const isFirebaseConfigured = !!firebaseConfig.projectId;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(firebaseApp);
    console.log("Firebase Firestore initialized successfully for cloud synchronization! 🚀");
  } catch (e) {
    console.warn("Firebase initialization failed, falling back to local database engine.", e);
  }
}

// Generates a whimsical "Magic Code" for the kid, e.g. "Sunny-Panda-495"
export function generateMagicCode(): string {
  const adjectives = [
    "Happy", "Super", "Sunny", "Magic", "Shiny", "Clever", "Brave", "Jolly", 
    "Speedy", "Fluffy", "Dinky", "Zigzag", "Lucky", "Chubby", "Cosmic", "Sparkly"
  ];
  const animals = [
    "Dino", "Panda", "Owl", "Koala", "Lion", "Tiger", "Puppy", "Kitten", 
    "Rabbit", "Monkey", "Fox", "Penguin", "Dolphin", "Robot", "Dragon", "Bear"
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const anim = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100 to 999
  
  return `${adj}-${anim}-${num}`;
}

// Local storage keys
const PROFILE_KEY = "kids_ai_profile_data_v1";
const CHAT_PREFIX = "kids_ai_chat_history_";

/**
 * Saves profile to local cache and attempts background cloud sync to Firebase
 */
export async function saveProfileToCloudAndLocal(profile: KidProfile): Promise<void> {
  // Always write locally first for instantaneous speed
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  
  if (db && profile.magicCode) {
    try {
      const docRef = doc(db, "profiles", profile.magicCode.toUpperCase());
      await setDoc(docRef, {
        ...profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore save failed (offline or unconfigured):", e);
    }
  }
}

/**
 * Loads a profile from local storage or cloud using a Magic Code
 */
export async function fetchProfileByMagicCode(code: string): Promise<KidProfile | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  // Try to load from Cloud first if available
  if (db) {
    try {
      const docRef = doc(db, "profiles", cleanCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as KidProfile;
        // Cache locally
        localStorage.setItem(PROFILE_KEY, JSON.stringify(cloudData));
        return cloudData;
      }
    } catch (e) {
      console.warn("Firestore fetch failed, checking local fallback:", e);
    }
  }

  // Fallback to local storage if codes match
  const localStr = localStorage.getItem(PROFILE_KEY);
  if (localStr) {
    try {
      const localProfile = JSON.parse(localStr) as KidProfile;
      if (localProfile.magicCode?.toUpperCase() === cleanCode) {
        return localProfile;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return null;
}

/**
 * Saves a buddy chat history locally and in cloud
 */
export async function saveChatHistory(buddyId: string, magicCode: string, messages: Message[]): Promise<void> {
  const historyKey = `${CHAT_PREFIX}${buddyId}`;
  localStorage.setItem(historyKey, JSON.stringify(messages));

  if (db && magicCode) {
    try {
      // Save messages collection
      const docRef = doc(db, "chats", `${magicCode.toUpperCase()}_${buddyId}`);
      await setDoc(docRef, {
        profileId: magicCode.toUpperCase(),
        buddyId,
        messages,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore chat save failed:", e);
    }
  }
}

/**
 * Fetches chat history for a buddy
 */
export async function fetchChatHistory(buddyId: string, magicCode: string): Promise<Message[] | null> {
  if (db && magicCode) {
    try {
      const docRef = doc(db, "chats", `${magicCode.toUpperCase()}_${buddyId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.messages)) {
          // Cache locally
          localStorage.setItem(`${CHAT_PREFIX}${buddyId}`, JSON.stringify(data.messages));
          return data.messages;
        }
      }
    } catch (e) {
      console.warn("Firestore chat fetch failed:", e);
    }
  }

  // Local fallback
  const localStr = localStorage.getItem(`${CHAT_PREFIX}${buddyId}`);
  if (localStr) {
    try {
      return JSON.parse(localStr);
    } catch (e) {
      console.error(e);
    }
  }

  return null;
}
