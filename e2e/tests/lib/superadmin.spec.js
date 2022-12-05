import { test, expect } from "../../fixtures/index.js";
import { JOE_OLDUSER, SALLY_NEWUSER, SUPER_ADMIN } from "./wellknown.js";
const { describe, beforeEach, afterEach } = test;

describe("Given super admin", () => {

    beforeEach(async ({ app }) => {

        await app.loginAsSuperAdmin();

    });

    test("Then I can fetch my user record", async ({ lib }) => {

        const record = await lib.getMyUserRecord();
        expect(record.data.name).toEqual("Sue Superadmin");

    });

    test("Then I can fetch another user's user record", async ({ lib }) => {

        const record = await lib.getUserRecord({ id: JOE_OLDUSER.id });
        expect(record.data.name).toEqual("Joe Olduser");

    });

    describe("When I create an account", () => {

        const accountName = `Account ${Math.random()}`;
        let accountId;
        beforeEach(async ({ lib }) => {

            accountId = await lib.createAccount({ name: accountName });
            lib.teardown(() => lib.deleteAccount({ id: accountId }));

        });

        test("Listed accounts should include created account", async ({ lib }) => {

            const accounts = await lib.listAccounts();
            expect(accounts.map(a => a.id)).toContain(accountId);

        });

        test("Get account should return account", async ({ lib }) => {

            const account = await lib.getAccount({ id: accountId });
            expect(account).toMatchObject({ id: accountId, data: { name: accountName } });

        });

        describe("And I delete it again", () => {

            beforeEach(async ({ lib }) => {

                await lib.deleteAccount({ id: accountId });

            });

            test("Get account should return null", async ({ lib }) => {

                const account = await lib.getAccount({ id: accountId });
                expect(account.data).toEqual(undefined);

            });

        });

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

        describe("And I rename the team", () => {

            let newTeamName = `Team ${Math.random()}`;
            beforeEach(async ({ lib }) => {

                await lib.renameTeam({ id: teamId, name: newTeamName });

            });

            test("Get team should reflect the new name", async ({ lib }) => {

                const team = await lib.getTeam({ id: teamId });
                expect(team.data.name).toEqual(newTeamName);

            });

        });

        describe("And I add a team member", () => {

            beforeEach(async ({ lib }) => {

                await lib.addTeamMember({ id: teamId, userId: JOE_OLDUSER.id });

            });

            test("Get team members should reflect the added member", async ({ lib }) => {

                const members = await lib.getTeamMembers({ id: teamId });
                expect(members.map(m => m.id)).toEqual([JOE_OLDUSER.id]);
                expect(members.map(m => m.data.name)).toEqual(["Joe Olduser"]);

            });

        });

        describe("And I invite a new user to the team", () => {

            let inviteId;
            beforeEach(async ({ lib }) => {

                inviteId = await lib.inviteTeamMember({
                    teamId: teamId,
                    email: SALLY_NEWUSER.email,
                    name: "Sally"
                });

            });

            test("Get invite should return the invite", async ({ lib }) => {

                const invite = await lib.getInvite({ id: inviteId });
                expect(refPathFromJSON(invite.data.from))
                    .toMatch(new RegExp(`/teams-users-public/${SUPER_ADMIN.id}$`));
                expect(refPathFromJSON(invite.data.team))
                    .toMatch(new RegExp(`/teams-teams/${teamId}`));

            });

            describe("And I try to accept the invitation myself", () => {

                let caught;
                beforeEach(async ({ lib }) => {

                    try {

                        await lib.acceptInvitation({ id: inviteId });

                    } catch (err) {

                        caught = err;

                    }

                });

                test("The attempt fails", () => {

                    expect(caught?.message).toMatch("PERMISSION_DENIED");

                });

            });

        });

    });


});
function refPathFromJSON(ref) {
    return ref._key.path.segments.join("/");
}

