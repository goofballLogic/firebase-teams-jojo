import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { createAccount, makeAccountAdmin, createTeam, createUserPublic, makeTeamAdmin, makeTeamMember, removeTeamMember } from "../../actions/commands";

export function removingTeamMembersSpec(testEnv) {

    describe("Team members can only be removed by team or account admin", () => {

        let member, user2, teamAdmin, accountAdmin, account, team;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                member = await createUserPublic(db, { name: "Joe", email: "joe@gmail.com" });
                user2 = await createUserPublic(db, { name: "Bloggs", email: "bloggs@gmail.com" });
                teamAdmin = await createUserPublic(db, { name: "Sally", email: "sally@gmail.com" });
                accountAdmin = await createUserPublic(db, { name: "Bob", email: "bob@gmail.com" });
                account = await createAccount(db, { name: "Account 1" });
                await makeAccountAdmin(db, { userPublic: accountAdmin, account });
                team = await createTeam(db, { name: "Team 1", account });
                await makeTeamAdmin(db, { userPublic: teamAdmin, team });
                await makeTeamMember(db, { userPublic: member, team });

            });

        });

        it("ALLOW user remove themselves from team", async () => {

            const dbAsMember = testEnv.authenticatedContext(member.id).firestore();
            await assertSucceeds(
                removeTeamMember(dbAsMember, { userPublic: member, team })
            );

        });

        it("ALLOW team admin remove user from team", async () => {

            const dbAsTeamAdmin = testEnv.authenticatedContext(teamAdmin.id).firestore();
            await assertSucceeds(
                removeTeamMember(dbAsTeamAdmin, { userPublic: member, team })
            );

        });

        it("ALLOW account admin remove user from team", async () => {

            const dbAsAccountAdmin = testEnv.authenticatedContext(accountAdmin.id).firestore();
            await assertSucceeds(
                removeTeamMember(dbAsAccountAdmin, { userPublic: member, team })
            );

        });

        it("DENY non admin remove someone else from team", async () => {

            const dbAsUser2 = testEnv.authenticatedContext(user2.id).firestore();
            await assertFails(
                removeTeamMember(dbAsUser2, { userPublic: member, team })
            );

        });

    });

}
