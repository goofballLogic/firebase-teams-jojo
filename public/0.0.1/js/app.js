import { initializeApp }
    from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { signInWithEmailAndPassword, getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, connectAuthEmulator }
    from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, connectFirestoreEmulator, deleteField, where, query, getDocs }
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
const auth = getAuth(app);
const nav = document.querySelector("nav");
const authModel = {};
const teamsModel = {};

if (["localhost", "127.0.0.1"].includes(location.hostname)) {

    connectAuthEmulator(auth, `http://${location.hostname}:9099`);
    connectFirestoreEmulator(db, location.hostname, 8080);

}

const integration = {

    doc,
    getDoc,
    setDoc,
    deleteField,
    getDocs,
    query,
    where,

    users: collection(db, "teams-users"),
    teams: collection(db, "teams-teams"),
    invites: collection(db, "teams-invites"),
    usersPublic: collection(db, "teams-users-public"),
    accounts: collection(db, "teams-accounts")

};

handleAuthStateChanged({ onAuthStateChanged, auth }, render);
render();

const url = new URL(location.href);
const testLogin = url.searchParams.get("test-login");
if (testLogin === "BobAccountAdmin") {
    signInWithEmailAndPassword(auth, "bob.accountadmin@gmail.com", "Password1!");
} else if (testLogin === "SallyNewUser") {
    signInWithEmailAndPassword(auth, "sally.newuser@gmail.com", "Password1!");
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
    initTeams({ container, model: teamsModel, ...integration });

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
        } else {
            authModel.user = null;
        }
        callback();

    });

}

async function accountForUser(uid) {
    try {
        const accounts = await getDocs(
            query(
                collection(db, "teams-accounts"),
                where(`members.${uid}`, "!=", null)
            )
        );
        return accounts.docs[0]?.id;
    } catch (err) {
        console.warn("[AFU-1]", { uid }, err);
    }
}

