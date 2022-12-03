import { createAccount, createTeam, createUserPrivate, makeTeamMember, removeTeamMember } from "../../actions/commands.js";
import { readUserPrivate, readUserPublic } from "../../actions/queries.js";
import { poll } from "./poll.js";

export function listMyTeams(testEnv) {

    describe("I should be able to list my teams", () => {

        describe("When a user is added to two teams", () => {

            let user, team1, team2;
            beforeEach(async () => {

                await testEnv.withSecurityRulesDisabled(async (context) => {

                    const db = context.firestore();
                    user = await createUserPrivate(db, { name: "Horatio", email: "horatio@gmail.com", extras: { secret: 42 } });
                    const account = await createAccount(db, { name: "The account" });
                    team1 = await createTeam(db, { name: "Team 1", account });
                    team2 = await createTeam(db, { name: "Team 2", account });

                    await makeTeamMember(db, { userPublic: user, team: team1 });
                    await makeTeamMember(db, { userPublic: user, team: team2 });

                });

            });

            it("Then the user should be able to see their team memberships", async () => {

                const privateUserData = await poll(() => findPrivateUserRecordWithTeams(testEnv, { user, teams: [team1, team2] }));
                expect(privateUserData?.teams).toHaveProperty(team1.id);
                expect(privateUserData?.teams).toHaveProperty(team2.id);

            });

            describe("And when a user leaves a team", () => {

                beforeEach(async () => {

                    await testEnv.withSecurityRulesDisabled(async (context) => {

                        const db = context.firestore();
                        await removeTeamMember(db, { userPublic: user, team: team1 });

                    });

                });

                it("Then the user should be able to see their remaining teams only", async () => {

                    const privateUserData = await poll(() => findPrivateUserRecordWithTeams(testEnv, { user, teams: [team2] }));
                    expect(privateUserData?.teams).not.toHaveProperty(team1.id);
                    expect(privateUserData?.teams).toHaveProperty(team2.id);

                });

            });

        });

    });

}

async function findPrivateUserRecordWithTeams(testEnv, { user, teams }) {

    const dbAsUser = testEnv.authenticatedContext(user.id).firestore();
    const publicUser = await readUserPrivate(dbAsUser, { user });
    if (publicUser.exists()) {
        const data = publicUser.data();
        const isMatch = data.teams
            && (Object.keys(data.teams).length === teams.length)
            && teams.every(t => t.id in data.teams);
        if (isMatch)
            return data;
    }
}
