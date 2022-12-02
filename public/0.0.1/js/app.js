import { initializeApp }
    from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, connectAuthEmulator }
    from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, connectFirestoreEmulator, deleteField }
    from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";
import { initTeams }
    from "./teams.js";
import { renderNav }
    from "./views-main.js";

const app = initializeApp({
    apiKey: "AIzaSyCMcpGSofrm7Y1asK73iBoqfmFbn8uqiVA",
    authDomain: "fir-teams-jojo.firebaseapp.com",
    projectId: "firebase-teams-jojo",
    storageBucket: "firebase-teams-jojo.appspot.com",
    messagingSenderId: "855916786925",
    appId: "1:855916786925:web:6d1e28d067629d80f808e4"
});


const db = getFirestore(app);
connectFirestoreEmulator(db, location.hostname, 8080);
const auth = getAuth(app);
connectAuthEmulator(auth, `http://${location.hostname}:9099`);
const nav = document.querySelector("nav");
const authModel = {};

const integration = {

    doc,
    getDoc,
    setDoc,
    deleteField,

    users: collection(db, "teams-users"),
    teams: collection(db, "teams-teams"),
    invites: collection(db, "teams-invites"),
    usersPublic: collection(db, "teams-users-public"),

};

handleAuthStateChanged({ onAuthStateChanged, auth }, render);
render();

function render() {

    nav.innerHTML = renderNav(authModel);
    nav.querySelector("button.google-sign-in")?.addEventListener(
        "click",
        () => handleGoogleSignInClick({ GoogleAuthProvider, auth, signInWithPopup })
    );
    nav.querySelector("button.google-sign-out")?.addEventListener(
        "click",
        () => signOut(auth)
    );
    const container = document.querySelector("main");
    const teamsModel = {};
    initTeams({ container, model: teamsModel, ...integration });

}

function handleGoogleSignInClick({ GoogleAuthProvider, auth, signInWithPopup }) {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
}

function handleAuthStateChanged({ onAuthStateChanged, auth }, callback) {
    onAuthStateChanged(auth, user => {

        if (user) {
            const { displayName, uid, email } = user;
            authModel.user = { displayName, uid, email };
        } else {
            authModel.user = null;
        }
        callback();

    });
}
