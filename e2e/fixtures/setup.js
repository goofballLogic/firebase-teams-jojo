import admin from "firebase-admin";
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

export async function setup({ }, use) {

    const teardowns = [];

    await use({

        async createSuperAdmin() {

            const n = nonce();
            const auth = admin.auth();
            const name = `Super Admin ${n}`;
            const email = `super.admin.${n}@example.com`;
            const userRecord = await auth.createUser({
                email,
                displayName: name,
                emailVerified: true,
                password: "Password1!",
                disabled: false
            });
            teardowns.push(() => auth.deleteUser(userRecord.uid))

            await auth.setCustomUserClaims(userRecord.uid, { superAdmin: true });

            const userRecordRef = firestore.collection("teams-users").doc(userRecord.uid);
            await userRecordRef.set({ name, email });
            teardowns.push(() => userRecordRef.delete());

            return userRecord;

        },

        async createAccount() {

            const accountId = nonce();
            const accountRef = firestore.collection("teams-accounts").doc(accountId);
            await accountRef.set({ name: `Account ${accountId}` });
            teardowns.push(() => accountRef.delete());

            return accountId;

        },

        async createUser({ accountId }) {

            if (!accountId) throw new RangeError("accountId");
            const userId = nonce();
            const userRef = firestore.collection("teams-users").doc(userId);
            await userRef.set({
                name: `User ${userId}`,
                email: `user.${userId}@example.com`
            });
            teardowns.push(() => userRef.delete());

            await firestore.collection("teams-accounts").doc(accountId).set({ members: { [userId]: userRef } }, { merge: true });
            return userId;

        }

    });

    while (teardowns.length)
        await teardowns.pop();

}
