import { test, expect } from "../../fixtures/index.js";
import { lib } from "../../fixtures/lib.js";
const { describe, beforeEach, afterEach } = test;

describe("Given logged in as a super admin", () => {

    beforeEach(async ({ app }) => {

        await app.loginAsSuperAdmin();

    });

    describe("When I create a team", () => {

        const teamName = `Team ${Math.random()}`;
        let teamId;
        beforeEach(async ({ lib }) => {

            teamId = await lib.createTeam({ name: teamName });
            lib.teardown(() => lib.deleteTeam({ id: teamId }));

        });

        test("When I list my teams, it should include the newly created one", async ({ lib }) => {

            const teams = await lib.listTeams();
            expect(teams.map(t => t.id)).toContain(teamId);

        });

    });

});
