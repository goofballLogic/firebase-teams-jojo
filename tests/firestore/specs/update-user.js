import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { createUserPublic, updateUserPrivate, createUserPrivate, updateUserPublic } from "../../actions/commands";
import { readUserPrivate, readUserPublic } from "../../actions/queries";

export function updatingUsers(testEnv) {

    describe("Only a user can update their own private user record", () => {

        let userPublic, user2Public;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                userPublic = await createUserPrivate(db, { name: "Joe", email: "joe@gmail.com" });
                user2Public = await createUserPrivate(db, { name: "Bloggs", email: "bloggs@gmail.com" });

            });

        });

        it("ALLOW user to update their own private user record", async () => {

            const dbAsUser = testEnv.authenticatedContext(userPublic.id).firestore();
            const details = { "hello": "world" };
            await assertSucceeds(
                updateUserPrivate(dbAsUser, { user: userPublic, details })
            );

        });

        it("DENY user to update another user's private user record", async () => {

            const dbAsUser2 = testEnv.authenticatedContext(user2Public.id).firestore();
            const details = { "hello": "world" };
            await assertFails(
                updateUserPrivate(dbAsUser2, { user: userPublic, details })
            );

        });

        it("DENY user to read another user's private user record", async () => {

            const dbAsUser2 = testEnv.authenticatedContext(user2Public.id).firestore();
            await assertFails(
                readUserPrivate(dbAsUser2, { user: userPublic })
            );

        });

        it("ALLOW user to read their own private user record", async () => {

            const dbAsUser = testEnv.authenticatedContext(userPublic.id).firestore();
            await assertSucceeds(
                readUserPrivate(dbAsUser, { user: userPublic })
            );

        });

    });

    describe("Nobody can update public user directly", () => {

        let user, user2;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                user = await createUserPublic(db, { name: "Joe", email: "joe@gmail.com" });
                user2 = await createUserPublic(db, { name: "Fran", email: "fran@gmail.com" });
            });

        });

        it("DENY user update public record", async () => {

            const dbAsUser = testEnv.authenticatedContext(user.id).firestore();
            await assertFails(
                updateUserPublic(dbAsUser, { user, details: { name: "Pooh bear", email: "pooh@google.com" } })
            );

        });

        it("ALLOW read if authenticated", async () => {

            const db = testEnv.authenticatedContext(user2.id).firestore();
            await assertSucceeds(
                readUserPublic(db, { user })
            );

        });

    });

}
