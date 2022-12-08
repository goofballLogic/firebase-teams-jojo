import admin from "firebase-admin";
import { poll } from "./poll.js";
if (!("FIRESTORE_EMULATOR_HOST" in process.env))
    process.env['FIRESTORE_EMULATOR_HOST'] = "localhost:8080";
if (!("FIREBASE_AUTH_EMULATOR_HOST" in process.env))
    process.env["FIREBASE_AUTH_EMULATOR_HOST"] = "localhost:9099"

admin.initializeApp({
    apiKey: "AIzaSyCMcpGSofrm7Y1asK73iBoqfmFbn8uqiVA",
    authDomain: "fir-teams-jojo.firebaseapp.com",
    projectId: "firebase-teams-jojo",
    torageBucket: "firebase-teams-jojo.appspot.com",
    messagingSenderId: "855916786925",
    appId: "1:855916786925:web:6d1e28d067629d80f808e4"
});

const nonce = () => (Date.now() * Math.random()).toString().replace(".", "");
const firestore = admin.firestore();
const auth = admin.auth();

export async function setup({ }, use) {

    await use({

        async createSuperAdmin() {

            const n = nonce();
            const name = `Super Admin ${n}`;
            const email = `super.admin.${n}@example.com`;
            const userRecord = await this.createUserLogin({ name, email });
            await auth.setCustomUserClaims(userRecord.uid, { superAdmin: true });
            await firestore.collection("teams-users").doc(userRecord.uid).set({ name, email });
            return userRecord;

        },

        async createAccount() {

            const accountId = nonce();
            await firestore.collection("teams-accounts").doc(accountId).set({ name: `Account ${accountId}` });
            return accountId;

        },

        async createUser({ accountId, withLogin, waitForPublic }) {

            if (!accountId) throw new RangeError("accountId");
            const n = nonce();
            const email = `user.${n}@example.com`;
            const name = `User ${n}`;
            let userRecord;
            if (withLogin) {

                userRecord = await this.createUserLogin({ name, email });

            }
            const userId = userRecord?.uid || n;
            const userRef = firestore.collection("teams-users").doc(userId);
            await userRef.set({ name, email });
            await firestore.collection("teams-accounts").doc(accountId).set({ members: { [userId]: userRef } }, { merge: true });

            if (waitForPublic) {

                const result = await poll(() => firestore.collection("teams-users-public").doc(userId).get(), 100);
                if (!result)
                    throw new Error("Public record was not detected");

            }
            return userId;

        },

        async createUserLogin({ name, email }) {

            return await auth.createUser({
                email,
                displayName: name,
                emailVerified: true,
                password: "Password1!",
                disabled: false
            });

        }

    });

}
