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

const accountsCollection = firestore.collection("teams-accounts");
const usersCollection = firestore.collection("teams-users");
const usersPrivateCollection = firestore.collection("teams-users-private");
const teamsCollection = firestore.collection("teams-teams");
const invitesCollection = firestore.collection("teams-invites");

export async function setup({ }, use) {

    await use({

        async createSuperAdmin() {

            const n = nonce();
            const name = `Super Admin ${n}`;
            const email = `super.admin.${n}@example.com`;
            const userLogin = await this.createUserLogin({ name, email });
            await auth.setCustomUserClaims(userLogin.uid, { superAdmin: true });
            await usersPrivateCollection.doc(userLogin.uid).set(
                { name, email }
            );
            return userLogin;

        },

        async createAccountAdmin(accountId) {

            const n = nonce();
            const name = `Account Admin ${n}`;
            const email = `account.admin.${n}@example.com`;
            const userLogin = await this.createUserLogin({ name, email });
            const usersRef = usersCollection.doc(userLogin.uid);
            await accountsCollection.doc(accountId).set(
                { admins: { [userLogin.uid]: usersRef } },
                { merge: true }
            );
            return userLogin;

        },

        async createAccount({ entitlements_teams = 9999 } = {}) {

            const accountId = nonce();
            await accountsCollection.doc(accountId).set({
                name: `Account ${accountId}`,
                entitlements: {
                    teams: entitlements_teams
                }
            });
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
            await this.createUserPrivate({ uid: userId, name, email });
            const userRef = usersCollection.doc(userId);
            await accountsCollection.doc(accountId).set(
                { members: { [userId]: userRef } },
                { merge: true }
            );

            if (waitForPublic) {

                const result = await poll(() => userRef.get(), 100);
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

        },

        async createUserPrivate({ uid, name, email }) {

            const usersPrivateRef = usersPrivateCollection.doc(uid);
            await usersPrivateRef.set({ name, email });
            return usersPrivateRef;

        },

        async listTeams() {
            const snap = await teamsCollection.get();
            return snap.docs;
        }

    });

}