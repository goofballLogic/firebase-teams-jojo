import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { createAccount, makeAccountAdmin, createTeam, createUserPublic, makeTeamAdmin } from "../../actions/commands";

export function createTeamAdminsSpec(testEnv) {

    describe("A user can be made admin of a team only by an account admin or another team admin", () => {

        let user, user2, teamAdmin, accountAdmin, account, team;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                user = await createUserPublic(db, { name: "Joe", email: "joe@gmail.com" });
                user2 = await createUserPublic(db, { name: "Bloggs", email: "bloggs@gmail.com" });
                teamAdmin = await createUserPublic(db, { name: "Sally", email: "sally@gmail.com" });
                accountAdmin = await createUserPublic(db, { name: "Bob", email: "bob@gmail.com" });
                account = await createAccount(db, { name: "Account 1" });
                await makeAccountAdmin(db, { userPublic: accountAdmin, account });
                team = await createTeam(db, { name: "Team 1", account });
                await makeTeamAdmin(db, { userPublic: teamAdmin, team });

            });

        });

        it("DENY user make themselves team admin", async () => {

            const dbAsUser = testEnv.authenticatedContext(user.id).firestore();
            await assertFails(
                makeTeamAdmin(dbAsUser, { userPublic: user, team })
            );

        });

        it("ALLOW team admin make user team admin", async () => {

            const dbAsTeamAdmin = testEnv.authenticatedContext(teamAdmin.id).firestore();
            await assertSucceeds(
                makeTeamAdmin(dbAsTeamAdmin, { userPublic: user, team })
            );

        });

        it("ALLOW account admin make user team admin", async () => {

            const dbAsAccountAdmin = testEnv.authenticatedContext(accountAdmin.id).firestore();
            await assertSucceeds(
                makeTeamAdmin(dbAsAccountAdmin, { userPublic: user, team })
            );

        });

        it("ALLOW account admin to make themselves team admin", async () => {

            const dbAsAccountAdmin = testEnv.authenticatedContext(accountAdmin.id).firestore();
            await assertSucceeds(
                makeTeamAdmin(dbAsAccountAdmin, { userPublic: accountAdmin, team })
            );

        });

        it("DENY non admin makes someone else team admin", async () => {

            const dbAsUser2 = testEnv.authenticatedContext(user2.id).firestore();
            await assertFails(
                makeTeamAdmin(dbAsUser2, { userPublic: user, team })
            );

        });

    });

}
