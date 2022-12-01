import { acceptInvitation, createAccount, createInvitation, createTeam, createUserPublic } from "../../actions/commands";
import { readTeam } from "../../actions/queries";
import { poll } from "./poll";

export function acceptInvitations(testEnv) {

    describe("Team membership can be updated by the server in respons to invitation acceptance", () => {

        describe("When a user accepts an invitation", () => {

            let invite, team, user;
            beforeEach(async () => {

                await testEnv.withSecurityRulesDisabled(async (context) => {

                    const db = context.firestore();
                    const admin = await createUserPublic(db, { name: "Mr. Admin", email: "admin@gmail.com" });
                    const account = await createAccount(db, { name: "The account" });
                    team = await createTeam(db, { name: "Team 1", account });
                    invite = await createInvitation(db, {
                        from: admin,
                        to: { email: "horatio@gmail.com" },
                        team
                    });
                    user = await createUserPublic(db, { name: "Horatio", email: "horatio@gmail.com" });
                    await acceptInvitation(db, { invite, userPublic: user, team });

                });

            });

            it("Then they become a member of the team", async () => {

                const teamData = await poll(() => findTeamWithMember(testEnv, team, user));
                expect(teamData?.members).toHaveProperty(user.id);

            });

        });

    });

}

async function findTeamWithMember(testEnv, team, user) {

    let found;
    await testEnv.withSecurityRulesDisabled(async (context) => {

        const db = context.firestore();
        const updatedTeam = await readTeam(db, { team });
        const teamData = updatedTeam?.data();
        if (teamData && teamData.members && teamData.members[user.id])
            found = teamData;

    });
    return found;

}
