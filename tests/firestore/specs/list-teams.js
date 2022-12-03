import { createAccount, createTeam, createUserPublic } from "../../actions/commands.js";
import { listTeams } from "../../actions/queries.js";

export function listTeamsSpec(testEnv) {

    describe("A user should be able to list their teams", () => {

        let user, team1, team2, team3;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();

                user = await createUserPublic(db, { name: "Joe Bloggs", email: "joe@gmail.com" });

                const account = await createAccount(db, { name: "Account" });
                team1 = await createTeam(db, { name: "Team 1", account, members: { [user.id]: user } });
                team2 = await createTeam(db, { name: "Team 2", account, members: { [user.id]: user } });
                team3 = await createTeam(db, { name: "Team 3", account, members: {} });

            });

        });

        it("ALLOW only their teams", async () => {

            const dbAsUser = testEnv.authenticatedContext(user.id).firestore();
            const found = await listTeams(dbAsUser, { userPublic: user });
            const foundData = found.docs.map(d => d.id);
            expect(foundData).toContainEqual(team1.id);
            expect(foundData).toContainEqual(team2.id);
            expect(foundData).not.toContainEqual(team3.id);

        });

    });

}
