export { initializeApp }
    from "firebase/app";
export { signInWithEmailAndPassword, getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, connectAuthEmulator }
    from "firebase/auth";
export { getFirestore, collection, doc, getDoc, setDoc, deleteDoc, connectFirestoreEmulator, deleteField, where, query, getDocs, serverTimestamp }
    from "firebase/firestore";
