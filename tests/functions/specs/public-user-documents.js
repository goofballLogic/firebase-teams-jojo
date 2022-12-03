import { createUserPrivate } from "../../actions/commands.js";
import { readUserPublic } from "../../actions/queries.js";
import { poll } from "./poll.js";

export function publicUserDocuments(testEnv) {

    describe("A public user is created by the server in response to user writes", () => {

        describe("When a user is created", () => {

            let user;
            beforeEach(async () => {

                await testEnv.withSecurityRulesDisabled(async (context) => {

                    const db = context.firestore();
                    user = await createUserPrivate(db, { name: "Horatio", email: "horatio@gmail.com", extras: { secret: 42 } });

                });

            });

            it("Then a public user record is also created", async () => {

                const publicUserData = await poll(() => findPublicUserRecord(testEnv, user));
                expect(publicUserData).toEqual({ name: "Horatio", email: "horatio@gmail.com" });
                expect(publicUserData).not.toHaveProperty("secret");

            });

        });

    });

}

async function findPublicUserRecord(testEnv, user) {

    let found;
    await testEnv.withSecurityRulesDisabled(async (context) => {

        const db = context.firestore();
        const publicUser = await readUserPublic(db, { user });
        if (publicUser.exists()) found = publicUser.data();

    });
    return found;

}
