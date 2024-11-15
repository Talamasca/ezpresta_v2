// src/contexts/AuthContext.js
import React, { useContext, useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc,updateDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

const AuthContext = React.createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password).then(
      async userCredential => {
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          isActive: false, // Compte inactif par défaut
          createdAt: new Date()
        });

        // Envoi de l'email de vérification
        await sendEmailVerification(user);
        return user;
      }
    );
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password).then(
      userCredential => {
        // Fetch user data from Firestore
        const user = userCredential.user;
        return getUserData(user.uid);
      }
    );
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("userData");
    setCurrentUser(null);
  };

  const getUserData = async uid => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      userData.uid = uid;

      // Vérification si le compte est actif
      if (!userData.isActive) {
        await logout(); // Déconnexion immédiate si le compte n'est pas actif
        throw new Error("Votre compte doit être validé.");
      }

      localStorage.setItem("userData", JSON.stringify(userData));
      setCurrentUser(userData);
    } else {
      throw new Error("Erreur de connexion : Document utilisateur introuvable.");
    }
  };

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      setCurrentUser(JSON.parse(storedUserData));
      setLoading(false);
    } else {
      const unsubscribe = onAuthStateChanged(auth, async user => {
        if (user) {
          await getUserData(user.uid);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    }
  }, []);

  const updateUserData = async newData => {
    if (currentUser) {
      const userDoc = doc(db, `users/${currentUser.uid}`);
      await updateDoc(userDoc, newData);
      setCurrentUser({ ...currentUser, ...newData });
    }
  };

  const value = {
    currentUser,
    updateUserData,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={ value }>
      { !loading && children }
    </AuthContext.Provider>
  );
};
