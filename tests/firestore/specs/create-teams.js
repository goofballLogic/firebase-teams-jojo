import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { createUserPublic, createAccount, makeAccountAdmin, createTeam } from "../../actions/commands";

export function createTeamsSpec(testEnv) {

    describe("A team can only be created by an account admnin", () => {

        let bobAccountAdmin, account, sally;

        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                bobAccountAdmin = await createUserPublic(db, { name: "Bob", email: "bob@gmail.com" });
                sally = await createUserPublic(db, { name: "Sally", email: "sally@gmail.com" });
                account = await createAccount(db, { name: "Account 1", entitlements: { teams: 999 } });
                await makeAccountAdmin(db, { userPublic: bobAccountAdmin, account });

            });

        });

        it("DENY create if not authenticated", async () => {

            const unauthedDb = testEnv.unauthenticatedContext().firestore();
            await assertFails(createTeam(unauthedDb, { name: "Team 1", account }));

        });

        it("DENY create if authenticated by a non-account admin", async () => {

            const sallyDb = testEnv.authenticatedContext(sally.id).firestore();
            await assertFails(createTeam(sallyDb, { name: "Team 1", account }));

        });

        it("ALLOW create by an account admin", async () => {

            const bobDb = testEnv.authenticatedContext(bobAccountAdmin.id).firestore();
            await assertSucceeds(createTeam(bobDb, { name: "Team 1", account }));

        });


    });

    describe("A team can only be created if the account has entitlements to create a team", () => {

        let user, accountWithoutTeams, accountWithTeams;

        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                user = await createUserPublic(db, { name: "Bob", email: "bob@gmail.com" });
                accountWithoutTeams = await createAccount(db, { name: "Account 1", entitlements: { teams: 0 } });
                accountWithTeams = await createAccount(db, { name: "Account 2", entitlements: { teams: 1 } });
                await makeAccountAdmin(db, { userPublic: user, account: accountWithoutTeams });
                await makeAccountAdmin(db, { userPublic: user, account: accountWithTeams });

            });

        });

        it("DENY create if account lacks teams", async () => {

            const db = testEnv.authenticatedContext(user.id).firestore();
            await assertFails(createTeam(db, { name: "Team 1", account: accountWithoutTeams }));

        });

        it("ALLOW create if account has teams", async () => {

            const db = testEnv.authenticatedContext(user.id).firestore();
            await assertSucceeds(createTeam(db, { name: "Team 1", account: accountWithTeams }));

        });

    });

}
