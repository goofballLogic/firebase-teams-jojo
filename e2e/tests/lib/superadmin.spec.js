import { test, expect } from "../../fixtures/index.js";
import { printPageConsoleMessages } from "./printPageConsoleMessages.js";
import { refPathFromJSON } from "./refPathFromJSON.js";
const { describe, beforeEach } = test;

describe("SUPER ADMIN", () => {

    let adminId, adminEmail, accountId;
    beforeEach(async ({ app, context, setup }) => {

        const admin = await setup.createSuperAdmin();
        accountId = await setup.createAccount();
        await app.loginWithEmailAndAccount(admin.email, accountId);
        adminId = admin.uid;
        adminEmail = admin.email;
        printPageConsoleMessages(context);

    });

    // entitlements

    test("can fetch my entitlements", async ({ lib }) => {

        const entitlements = await lib.getEntitlements();
        expect(entitlements.createAccount).toEqual(true);
        expect(entitlements.createTeam).toEqual(true);
        expect(entitlements.userAdmin).toEqual(true);

    });

    // USER

    test("can fetch my user record", async ({ lib }) => {

        const record = await lib.getMyUserRecord();
        expect(record.data?.name).not.toBeFalsy();

    });

    test("can fetch another user's user record", async ({ setup, lib }) => {

        const accountId = await setup.createAccount();
        const userId = await setup.createUser({ accountId });
        const record = await lib.getUserRecord({ id: userId });
        expect(record.data.name).toEqual(`User ${userId}`);

    });

    test("can update my user record", async ({ lib }) => {

        await lib.updateMyUserRecord({ name: "Peppa Pig", email: "peppa@whitehouse.gov" });
        const updated = await lib.getMyUserRecord();
        expect(updated.data).toMatchObject({ name: "Peppa Pig", email: "peppa@whitehouse.gov" });

    });

    test("can update another user's record", async ({ setup, lib }) => {

        const accountId = await setup.createAccount();
        const userId = await setup.createUser({ accountId });
        await lib.updateUserRecord({ id: userId, name: "Barbara" });
        const updated = await lib.getUserRecord({ id: userId });
        expect(updated.data).toMatchObject({ name: "Barbara", email: `user.${userId}@example.com` });

    });

    // ACCOUNT
    test("can create an account", async ({ lib }) => {

        const accountId = await lib.createAccount({ name: "TEST account" });
        const account = await lib.getAccount({ id: accountId });
        expect(account).toMatchObject({ id: accountId, data: { name: "TEST account" } });

    });

    test("can list accounts", async ({ lib }) => {

        const accountId = await lib.createAccount({ name: "TEST account" });
        const accounts = await lib.listAccounts();
        expect(accounts.map(a => a.id)).toContainEqual(accountId);

    });

    test("can get an acount", async ({ lib }) => {

        const accountId = await lib.createAccount({ name: "TEST account" });
        const account = await lib.getAccount({ id: accountId });
        expect(account).toMatchObject({ id: accountId, data: { name: "TEST account" } });

    });

    test("can delete an account", async ({ lib }) => {

        const accountId = await lib.createAccount({ name: "TEST account" });
        await lib.deleteAccount({ id: accountId });
        const account = await lib.getAccount({ id: accountId });
        expect(account.data).toEqual(undefined);

    });

    test.only("can list users for an account", async ({ app, setup, lib }) => {

        const account2Id = await setup.createAccount();

        const user1Id = await setup.createUser({ accountId });
        const user2Id = await setup.createUser({ accountId });
        const user3Id = await setup.createUser({ accountId: account2Id });

        const users = await lib.getUsers();
        const userIds = users.map(u => u.id);
        expect(userIds).toEqual(expect.arrayContaining([user1Id, user2Id]));
        expect(userIds).not.toEqual(expect.arrayContaining([user3Id]));

    });

    test("can make an account admin", async ({ setup, lib }) => {

        const accountId = await lib.createAccount({ name: "TEST account" });
        const user = await setup.createUser({ accountId, waitForPublic: true, withLogin: true });
        await lib.makeAccountAdmin({});

    });

    // TEAM
    test("can create a team", async ({ lib }) => {

        await lib.createTeam({ name: "TEST team" });

    });

    test("can list teams", async ({ lib }) => {

        const teamId = await lib.createTeam({ name: "TEST team" });
        const teams = await lib.listTeams();
        expect(teams.map(t => t.id)).toContain(teamId);

    });

    test("can delete a team", async ({ lib }) => {

        const teamId = await lib.createTeam({ name: "TEST team" });
        await lib.deleteTeam({ id: teamId });
        const teams = await lib.listTeams();
        expect(teams.map(t => t.id)).not.toContain(teamId);

    });

    test("can rename a team", async ({ lib }) => {

        const teamId = await lib.createTeam({ name: "TEST team" });
        const newTeamName = `Team ${Math.random()}`;
        await lib.renameTeam({ id: teamId, name: newTeamName });
        const team = await lib.getTeam({ id: teamId });
        expect(team.data.name).toEqual(newTeamName);

    });

    test("can add a team member", async ({ setup, lib }) => {

        const accountId = await setup.createAccount();
        const userId = await setup.createUser({ accountId, waitForPublic: true });
        const teamId = await lib.createTeam({ name: "TEST team" });
        await lib.addTeamMember({ id: teamId, userId });
        const members = await lib.getTeamMembers({ id: teamId });
        expect(members.map(m => m.id)).toEqual([userId]);
        expect(members.map(m => m.data.name)).toEqual([`User ${userId}`]);

    });

    // INVITE
    test("can invite a new user to a team, can read the invite", async ({ lib }) => {

        const teamId = await lib.createTeam({ name: "TEST team" });
        const inviteId = await lib.inviteTeamMember({
            teamId: teamId,
            email: "bright.eyes@example.com",
            name: "Bright Eyes"
        });
        const invite = await lib.getInvite({ id: inviteId });
        expect(refPathFromJSON(invite.data.from)).toMatch(new RegExp(`/teams-users-public/${adminId}$`));
        expect(refPathFromJSON(invite.data.team)).toMatch(new RegExp(`/teams-teams/${teamId}`));

    });

    test("can't accept the invitation myself", async ({ lib }) => {

        const teamId = await lib.createTeam({ name: "TEST team" });
        const inviteId = await lib.inviteTeamMember({
            teamId: teamId,
            email: "bright.eyes@example.com",
            name: "Bright Eyes"
        });
        try {

            await lib.acceptInvitation({ id: inviteId });
            throw new Error("Expected an error");

        } catch (err) {

            expect(err.message).toMatch("PERMISSION_DENIED");

        }

    });

    test("can create invite which other person can accept", async ({ app, lib, setup }) => {

        const teamId = await lib.createTeam({ name: "TEST team" });
        const email = `bright.eyes.${Math.random()}@example.com`;
        const name = "Bright Eyes";
        const inviteId = await lib.inviteTeamMember({ teamId: teamId, email, name, });
        const inviteeLogin = await setup.createUserLogin({ name, email });
        await app.loginWithEmail(email);
        await lib.acceptInvitation({ id: inviteId, waitForMembership: true });
        const team = await lib.getTeam({ id: teamId });
        expect(team.data.members).toHaveProperty(inviteeLogin.uid);

    });

});


