import { test, expect } from "../../fixtures/index.js";
import { lib } from "../../fixtures/lib.js";
const { describe, beforeEach, afterEach } = test;

describe("Given super admin", () => {

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

        test("Listed teams should include created team", async ({ lib }) => {

            const teams = await lib.listTeams();
            expect(teams.map(t => t.id)).toContain(teamId);

        });

        describe("And I delete the team", () => {

            beforeEach(async ({ lib }) => {

                await lib.deleteTeam({ id: teamId });

            });

            test("Listed teams should not include the team", async ({ lib }) => {

                const teams = await lib.listTeams();
                expect(teams.map(t => t.id)).not.toContain(teamId);

            });

        });

    });


});
