import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// 這裡填入你在 Firebase Console 取得的資訊

const firebaseConfig = {
    apiKey: "AIzaSyAiZ-P7P5lIvb0-bKZgkntvQ5ovWCH117s",
    authDomain: "ptttracker-e40bd.firebaseapp.com",
    projectId: "ptttracker-e40bd",
    storageBucket: "ptttracker-e40bd.firebasestorage.app",
    messagingSenderId: "38678262749",
    appId: "1:38678262749:web:bf379f43ec38e3078dbc34",
    measurementId: "G-7VRVC8R0SK"
};


// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務並匯出
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager() // 完美支援多個分頁同時運作
    })
});
export const auth = getAuth(app);
