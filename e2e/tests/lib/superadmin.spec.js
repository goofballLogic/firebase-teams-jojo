import { test, expect } from "../../fixtures/index.js";
const { describe, beforeEach } = test;

describe("Given super admin", () => {

    let adminId, accountId, otherUserId, otherMutableUserId;
    beforeEach(async ({ app, page, setup }) => {

        const admin = await setup.createSuperAdmin();
        await app.loginWithEmail(admin.email);
        adminId = admin.uid;
        printPageConsoleMessages(page);
        accountId = await setup.createAccount();
        otherUserId = await setup.createUser({ accountId });
        otherMutableUserId = await setup.createUser({ accountId });

    });

    test("I can fetch my entitlements", async ({ lib }) => {

        const entitlements = await lib.getEntitlements();
        expect(entitlements.createAccount).toEqual(true);
        expect(entitlements.createTeam).toEqual(true);
        expect(entitlements.userAdmin).toEqual(true);

    });

    test("I can fetch my user record", async ({ lib }) => {

        const record = await lib.getMyUserRecord();
        expect(record.data?.name).not.toBeFalsy();

    });

    test("I can fetch another user's user record", async ({ lib }) => {

        const record = await lib.getUserRecord({ id: otherUserId });
        expect(record.data.name).toEqual(`User ${otherUserId}`);

    });

    test("I can update my user record", async ({ lib }) => {

        await lib.updateMyUserRecord({ name: "Peppa Pig", email: "peppa@whitehouse.gov" });
        const updated = await lib.getMyUserRecord();
        expect(updated.data).toMatchObject({ name: "Peppa Pig", email: "peppa@whitehouse.gov" });

    });

    test("I can update another user's record", async ({ lib }) => {

        await lib.updateUserRecord({ id: otherMutableUserId, name: "Barbara" });
        const updated = await lib.getUserRecord({ id: otherMutableUserId });
        expect(updated.data).toMatchObject({ name: "Barbara", email: `user.${otherMutableUserId}@example.com` });

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

        test("I can get the account", async ({ lib }) => {

            const account = await lib.getAccount({ id: accountId });
            expect(account).toMatchObject({ id: accountId, data: { name: accountName } });

        });

        test("I can delete it again", async ({ lib }) => {

            await lib.deleteAccount({ id: accountId });
            const account = await lib.getAccount({ id: accountId });
            expect(account.data).toEqual(undefined);

        });

    });

    describe("When I create a team", () => {

        const teamName = `Team ${Math.random()}`;
        let teamId;
        beforeEach(async ({ lib }) => {

            teamId = await lib.createTeam({ name: teamName });
            lib.teardown(() => lib.deleteTeam({ id: teamId }));

        });

        test("I can list the teams including the new one", async ({ lib }) => {

            const teams = await lib.listTeams();
            expect(teams.map(t => t.id)).toContain(teamId);

        });

        test("Then I can delete the team", async ({ lib }) => {

            await lib.deleteTeam({ id: teamId });
            const teams = await lib.listTeams();
            expect(teams.map(t => t.id)).not.toContain(teamId);

        });

        test("I can rename the team", async ({ lib }) => {

            let newTeamName = `Team ${Math.random()}`;
            await lib.renameTeam({ id: teamId, name: newTeamName });
            const team = await lib.getTeam({ id: teamId });
            expect(team.data.name).toEqual(newTeamName);

        });

        test("I can add a team member", async ({ lib }) => {

            await lib.addTeamMember({ id: teamId, userId: otherUserId });

            const members = await lib.getTeamMembers({ id: teamId });
            expect(members.map(m => m.id)).toEqual([otherUserId]);
            expect(members.map(m => m.data.name)).toEqual([`User ${otherUserId}`]);

        });

        describe("And I invite a new user to the team", () => {

            let inviteId;
            beforeEach(async ({ lib }) => {

                inviteId = await lib.inviteTeamMember({
                    teamId: teamId,
                    email: "bright.eyes@example.com",
                    name: "Bright Eyes"
                });

            });

            test("I can get the invite", async ({ lib }) => {

                const invite = await lib.getInvite({ id: inviteId });
                expect(refPathFromJSON(invite.data.from))
                    .toMatch(new RegExp(`/teams-users-public/${adminId}$`));
                expect(refPathFromJSON(invite.data.team))
                    .toMatch(new RegExp(`/teams-teams/${teamId}`));

            });

            test("I can't accept the invitation myself", (async ({ lib }) => {

                try {

                    await lib.acceptInvitation({ id: inviteId });
                    throw new Error("Expected an error");

                } catch (err) {

                    expect(err.message).toMatch("PERMISSION_DENIED");

                }

            }));

        });

    });

});

function printPageConsoleMessages(page) {

    const blackListMessages = ["Auth Emulator"];
    page.on("console", message => {
        if (!blackListMessages.some(x => message.text().indexOf(x)))
            console.log(message);
    });

}

function refPathFromJSON(ref) {

    return ref._key.path.segments.join("/");

}

