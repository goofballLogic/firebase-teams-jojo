import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { createUserPublic, createAccount, makeAccountAdmin, createTeam, makeTeamAdmin, createInvitation, acceptInvitation } from "../../actions/commands";

export function invitationsSpecs(testEnv) {

    describe("An invitation can only be created by an account or team admin", () => {

        let user, accountAdmin, teamAdmin, account, team;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                accountAdmin = await createUserPublic(db, { name: "Bob", email: "bob@gmail.com" });
                teamAdmin = await createUserPublic(db, { name: "Sally", email: "sally@gmail.com" });
                user = await createUserPublic(db, { name: "Andrew", email: "andrew@gmail.com" });

                account = await createAccount(db, { name: "Account 1", entitlements: { teams: 999 } });
                await makeAccountAdmin(db, { userPublic: accountAdmin, account });

                team = await createTeam(db, { name: "Team 1", account });
                await makeTeamAdmin(db, { userPublic: teamAdmin, team });

            });

        });

        it("DENY create if not authenticated", async () => {

            const unauthedDb = testEnv.unauthenticatedContext().firestore();
            const patch = {
                from: accountAdmin,
                to: { email: "you@gmail.com" },
                team
            };
            await assertFails(
                createInvitation(unauthedDb, patch)
            );

        });

        it("DENY create if not admin", async () => {

            const userDb = testEnv.authenticatedContext(user.id).firestore();
            const patch = {
                from: accountAdmin,
                to: { email: "you@gmail.com" },
                team
            };
            await assertFails(
                createInvitation(userDb, patch)
            );

        });

        it("ALLOW create if team admin", async () => {

            const teamAdminDB = testEnv.authenticatedContext(teamAdmin.id).firestore();
            const patch = {
                from: teamAdmin,
                to: { email: "you@gmail.com" },
                team
            };
            await assertSucceeds(
                createInvitation(teamAdminDB, patch)
            );

        });

        it("ALLOW create if account admin", async () => {

            const accountAdminDB = testEnv.authenticatedContext(accountAdmin.id).firestore();
            const patch = {
                from: accountAdmin,
                to: { email: "you@gmail.com" },
                team
            };
            await assertSucceeds(
                createInvitation(accountAdminDB, patch)
            );

        });

        it("DENY create if from mismatched to current user", async () => {

            const accountAdminDB = testEnv.authenticatedContext(accountAdmin.id).firestore();
            const patch = {
                from: teamAdmin,
                to: { email: "you@gmail.com" },
                team
            };
            await assertFails(
                createInvitation(accountAdminDB, patch)
            );

        });

    });

    describe("Only a logged in user with matching email can accept an invitation", () => {

        let invitee, otherUser, invite, inviteeEmail = "bob@gmail.com", otherTeam;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                invitee = await createUserPublic(db, { name: "Bob", email: inviteeEmail });
                otherUser = await createUserPublic(db, { name: "Sally", email: "sally@gmail.com" });
                const teamAdmin = await createUserPublic(db, { name: "Sean", email: "sean@gmail.com" });

                const account = await createAccount(db, { name: "Account 1", entitlements: { teams: 999 } });
                const team = await createTeam(db, { name: "Team 1", account });
                makeTeamAdmin(db, { userPublic: teamAdmin, team });

                otherTeam = await createTeam(db, { name: "Team 2", account });

                invite = await createInvitation(db, {
                    from: teamAdmin,
                    to: { email: "bob@gmail.com" },
                    team
                });

            });

        });

        it("DENY unauthenticated user to accept invitation", async () => {

            const dbUnauthenticated = testEnv.unauthenticatedContext().firestore();
            await assertFails(
                acceptInvitation(dbUnauthenticated, { userPublic: invitee, invite })
            );

        });

        it("DENY wrong user to accept invitation", async () => {

            const dbAsOtherUser = testEnv.authenticatedContext(otherUser.id).firestore();
            await assertFails(
                acceptInvitation(dbAsOtherUser, { userPublic: otherUser, invite })
            );

        });


        it("DENY wrong user to accept invitation on behalf of right user", async () => {

            const dbAsOtherUser = testEnv.authenticatedContext(otherUser.id).firestore();
            await assertFails(
                acceptInvitation(dbAsOtherUser, { userPublic: invitee, invite })
            );

        });

        it("DENY right user to accept invitation on behalf of wrong user", async () => {

            const dbAsInvitee = testEnv.authenticatedContext(invitee.id).firestore();
            await assertFails(
                acceptInvitation(dbAsInvitee, { userPublic: otherUser, invite })
            );

        });

        it("ALLOW right user to accept invitation", async () => {

            const userToken = { email: inviteeEmail, email_verified: true };
            const dbAsInvitee = testEnv.authenticatedContext(invitee.id, userToken).firestore();
            await assertSucceeds(
                acceptInvitation(dbAsInvitee, { userPublic: invitee, invite })
            );

        });

        it("DENY right user to accept invitation if email is not verified", async () => {

            const userToken = { email: inviteeEmail, email_verified: false };
            const dbAsInvitee = testEnv.authenticatedContext(invitee.id, userToken).firestore();
            await assertFails(
                acceptInvitation(dbAsInvitee, { userPublic: invitee, invite })
            );

        });

        it("DENY right user to update invitation other than accepting it", async () => {

            const userToken = { email: inviteeEmail, email_verified: true };
            const dbAsInvitee = testEnv.authenticatedContext(invitee.id, userToken).firestore();
            await assertFails(
                acceptInvitation(dbAsInvitee, { userPublic: invitee, invite, team: otherTeam })
            );

        });

        it("DENY right user to accept invitation with spurious data", async () => {

            const userToken = { email: inviteeEmail, email_verified: true };
            const dbAsInvitee = testEnv.authenticatedContext(invitee.id, userToken).firestore();
            await assertFails(
                acceptInvitation(dbAsInvitee, { userPublic: invitee, invite, poisonAccept: true })
            );

        });


    });

}
