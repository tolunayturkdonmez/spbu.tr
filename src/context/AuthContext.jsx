import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin' | 'guest' | null
    const [loading, setLoading] = useState(true);

    // Admin login function
    const loginAdmin = async (password) => {
        const email = 'admin@envanter.com';
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setUserRole('admin');
            localStorage.setItem('userRole', 'admin');
        } catch (error) {
            console.error("Firebase login failed:", error.code, error.message);
            // If user doesn't exist, try to create it (Auto-Register for Admin)
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
                try {
                    console.log("User not found, attempting to create admin user...");
                    await createUserWithEmailAndPassword(auth, email, password);
                    setUserRole('admin');
                    localStorage.setItem('userRole', 'admin');
                    console.log("Admin user created and logged in!");
                    return;
                } catch (createError) {
                    console.error("Create user failed:", createError);
                    throw createError; // Throw the creation error if that fails too
                }
            }
            throw error;
        }
    };

    // Guest login function
    const loginGuest = async () => {
        const email = 'guest@envanter.com';
        const password = 'GuestUser123!';
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setUserRole('guest');
            localStorage.setItem('userRole', 'guest');
        } catch (error) {
            console.error("Guest login failed:", error.code);
            // Auto-create guest user if not found
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                    setUserRole('guest');
                    localStorage.setItem('userRole', 'guest');
                } catch (createError) {
                    console.error("Create guest failed:", createError);
                    alert("Misafir girişi yapılamadı: " + createError.message);
                }
            } else {
                alert("Misafir girişi hatası: " + error.message);
            }
        }
    };

    const logout = () => {
        signOut(auth).catch(() => { });
        setUserRole(null);
        setCurrentUser(null);
        localStorage.removeItem('userRole');
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                // Check if anonymous OR specific guest email
                if (user.isAnonymous || user.email === 'guest@envanter.com') {
                    setUserRole('guest');
                } else {
                    setUserRole('admin');
                }
            } else {
                // Check if guest or temp admin session exists
                const storedRole = localStorage.getItem('userRole');
                if (storedRole === 'admin') {
                    setUserRole('admin');
                    setCurrentUser({ uid: 'temp-admin-id', email: 'admin@local' });
                } else if (storedRole === 'guest') {
                    setUserRole('guest');
                    setCurrentUser(null);
                } else {
                    setUserRole(null);
                    setCurrentUser(null);
                }
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Session Timeout Logic
    useEffect(() => {
        if (!userRole) return;

        let timeout;
        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                logout();
                alert("Oturum süreniz doldu (5 dakika). Lütfen tekrar giriş yapın.");
            }, 300000); // 300 seconds = 5 minutes
        };

        // Events to listen for
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        resetTimer(); // Start timer

        return () => {
            events.forEach(event => document.removeEventListener(event, resetTimer));
            clearTimeout(timeout);
        };
    }, [userRole]);

    const value = {
        currentUser,
        userRole,
        loginAdmin,
        loginGuest,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
