import { initTeams } from "./teams.js";
import { renderNav } from "./views-main.js";

const model = {};

export function init({
    main,
    nav,

    auth,

    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,

    users,
    teams,
    invites,

    doc,
    getDoc,
    setDoc,
    deleteField

}) {
    const simpleRender = () => render({ main, nav, GoogleAuthProvider, auth, signInWithPopup, signOut, users, teams, invites, doc, getDoc, setDoc, deleteField });
    handleAuthStateChanged({ onAuthStateChanged, auth }, simpleRender);
    simpleRender();
}

function render({ main, nav, GoogleAuthProvider, auth, signInWithPopup, signOut, users, teams, invites, doc, getDoc, setDoc, deleteField }) {
    nav.innerHTML = renderNav(model);
    initTeams({ container: main, state: model, users, teams, invites, doc, getDoc, setDoc, deleteField });
    addEventListeners({ main, nav, GoogleAuthProvider, auth, signInWithPopup, signOut });
}

function addEventListeners({ nav, GoogleAuthProvider, auth, signInWithPopup, signOut }) {
    nav.querySelector("button.google-sign-in")?.addEventListener(
        "click",
        e => handleGoogleSignInClick({ GoogleAuthProvider, auth, signInWithPopup })
    );
    nav.querySelector("button.google-sign-out")?.addEventListener(
        "click",
        e => signOut(auth)
    );
}

function handleGoogleSignInClick({ GoogleAuthProvider, auth, signInWithPopup }) {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
}

function handleAuthStateChanged({ onAuthStateChanged, auth }, callback) {
    onAuthStateChanged(auth, user => {

        if (user) {
            const { displayName, uid, email } = user;
            model.user = { displayName, uid, email };
        } else {
            model.user = null;
        }
        callback();

    });
}
