import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, connectFirestoreEmulator, deleteField } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";
import { init } from "./main.js";

const app = initializeApp({
    apiKey: "AIzaSyCMcpGSofrm7Y1asK73iBoqfmFbn8uqiVA",
    authDomain: "fir-teams-jojo.firebaseapp.com",
    projectId: "firebase-teams-jojo",
    storageBucket: "firebase-teams-jojo.appspot.com",
    messagingSenderId: "855916786925",
    appId: "1:855916786925:web:6d1e28d067629d80f808e4"
});

const db = getFirestore(app);
const auth = getAuth(app);

connectFirestoreEmulator(db, location.hostname, 8080);

init({

    nav: document.querySelector("nav"),
    main: document.querySelector("main"),

    auth,

    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,

    doc,
    getDoc,
    setDoc,
    deleteField,

    users: collection(db, "teams-users"),
    teams: collection(db, "teams-teams"),
    invites: collection(db, "teams-invites"),
    usersPublic: collection(db, "teams-users-public"),

});
