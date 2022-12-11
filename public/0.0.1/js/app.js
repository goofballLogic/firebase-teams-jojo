import {
    initializeApp,
    // auth
    signInWithEmailAndPassword, getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, connectAuthEmulator,
    // firestore
    getFirestore, collection, doc, getDoc, setDoc, deleteDoc, connectFirestoreEmulator, deleteField, where, query, getDocs, serverTimestamp
} from "/js/firebase.js";

import { initTeams }
    from "./firebase-teams-integration/teams.js";
import { getTeams }
    from "./firebase-teams-integration/lib.js";
import { renderNav }
    from "./views.js";

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
const nav = document.querySelector("nav");
const authModel = {};
const teamsModel = {};
const integration = {

    doc,
    getDoc,
    setDoc,
    deleteField,
    deleteDoc,
    getDocs,
    query,
    where,
    serverTimestamp,

    collections: {
        usersPrivate: collection(db, "teams-users-private"),
        teams: collection(db, "teams-teams"),
        invites: collection(db, "teams-invites"),
        users: collection(db, "teams-users"),
        accounts: collection(db, "teams-accounts")
    }

};

const isTest = ["localhost", "127.0.0.1"].includes(location.hostname);
if (isTest) {

    connectAuthEmulator(auth, `http://${location.hostname}:9099`);
    connectFirestoreEmulator(db, location.hostname, 8080);

}

handleAuthStateChanged({ onAuthStateChanged, auth }, render);
render();

if (isTest) {

    const url = new URL(location.href);
    const testLogin = url.searchParams.get("test-login");
    if (testLogin) {

        signInWithEmailAndPassword(auth, testLogin, "Password1!");

    }

}

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
    if (!authModel.user) {
        teamsModel.user = null;
    } else {
        if (!teamsModel.user) teamsModel.user = {};
        Object.assign(teamsModel.user, authModel.user);
    }
    const teams = getTeams({ user: teamsModel.user, ...integration });
    if (isTest) window.__ftj = teams;
    initTeams({ container, model: teamsModel, teams, ...integration });

}

function handleGoogleSignInClick({ GoogleAuthProvider, auth, signInWithPopup }) {

    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);

}

function handleAuthStateChanged({ onAuthStateChanged, auth }, callback) {


    onAuthStateChanged(auth, async user => {

        if (user) {

            const { displayName, uid, email } = user;
            authModel.user = { displayName, uid, email };
            authModel.user.account = await accountForUser(uid);
            const claims = (await user.getIdTokenResult()).claims;
            authModel.user.superAdmin = !!claims.superAdmin;

        } else {

            authModel.user = null;

        }
        callback();

    });

}

async function accountForUser(uid) {
    try {

        const testAccountId = isTest && new URL(location.href).searchParams.get("test-account");
        if (testAccountId) return testAccountId;

        const accounts = await getDocs(
            query(
                collection(db, "teams-accounts"),
                where(`members.${uid}`, "!=", null)
            )
        );
        return accounts.docs[0]?.id || uid;

    } catch (err) {
        console.warn("[AFU-10]", { uid }, err);
    }
}

