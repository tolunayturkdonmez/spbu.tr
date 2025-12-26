import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDH56wo30DUKKpxrpn2seeRIZ8g2CmI4uI",
    authDomain: "inventorydb-f343b.firebaseapp.com",
    databaseURL: "https://inventorydb-f343b-default-rtdb.firebaseio.com",
    projectId: "inventorydb-f343b",
    storageBucket: "inventorydb-f343b.firebasestorage.app",
    messagingSenderId: "796483249218",
    appId: "1:796483249218:web:8a951a81c69ccf2cfd79db",
    measurementId: "G-2H9R8GH9MR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
