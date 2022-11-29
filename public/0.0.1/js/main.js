import { teams } from "./teams.js";
import { renderMain, renderNav } from "./views-main.js";

const model = {};

export function init({
    main,
    nav,

    onAuthStateChanged,
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
}) {
    const simpleRender = () => render({ main, nav, GoogleAuthProvider, getAuth, signInWithPopup, signOut });
    handleAuthStateChanged({ onAuthStateChanged, getAuth }, simpleRender);
    simpleRender();
}

function render({ main, nav, GoogleAuthProvider, getAuth, signInWithPopup, signOut }) {
    nav.innerHTML = renderNav(model);
    teams({ container: main, state: model });
    addEventListeners({ main, nav, GoogleAuthProvider, getAuth, signInWithPopup, signOut });
}

function addEventListeners({ nav, GoogleAuthProvider, getAuth, signInWithPopup, signOut }) {
    nav.querySelector("button.google-sign-in")?.addEventListener(
        "click",
        e => handleGoogleSignInClick({ GoogleAuthProvider, getAuth, signInWithPopup })
    );
    nav.querySelector("button.google-sign-out")?.addEventListener(
        "click",
        e => signOut(getAuth())
    );
}

function handleGoogleSignInClick({ GoogleAuthProvider, getAuth, signInWithPopup }) {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider);
}

function handleAuthStateChanged({ onAuthStateChanged, getAuth }, callback) {
    onAuthStateChanged(getAuth(), user => {

        if (user) {
            const { displayName } = user;
            model.user = { displayName };
        } else {
            model.user = null;
        }
        callback();

    });
}
