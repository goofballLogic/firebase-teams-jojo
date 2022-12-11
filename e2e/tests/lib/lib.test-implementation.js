import { refPathFromJSON } from "./refPathFromJSON.js";
import { test, expect } from "../../fixtures/index.js";

export default function (spec) {

    const { state } = spec;
    let testName;
    test(`${spec.role} can calculate my entitlements`, async ({ lib }) => {

        const { calculateEntitlements } = spec;
        const entitlements = await lib.getEntitlements();
        expect(entitlements).toEqual(calculateEntitlements);

    });

    // USER

    test(`${spec.role} can fetch my user record`, async ({ setup, lib }) => {

        if (!spec.fetchMyUserRecord) throw new Error("Test not implemented");
        // A
        await setup.createUserRecord({
            uid: state.adminId,
            name: "Elvis",
            email: "elvis@example.com"
        });
        // A
        const record = await lib.getMyUserRecord();
        expect(record.data?.name).toEqual("Elvis");

    });

    test(`${spec.role} can ${spec.fetchAnotherUsersUserRecord ? "" : "NOT "}fetch another user's user record`, async ({ setup, lib }) => {

        // A
        const accountId = state.currentAccountId;
        const userId = await setup.createUser({ accountId });

        try {
            // A
            const record = await lib.getUserRecord({ id: userId });
            if (!spec.fetchAnotherUsersUserRecord)
                // A
                throw new Error("Expected error getting user record");
            else
                // A
                expect(record.data.name).toEqual(`User ${userId}`);

        } catch (err) {

            if (spec.fetchAnotherUsersUserRecord)
                throw err;
            else
                expect(err.message).toContain("permission-denied");

        }

    });

    test(`${spec.role} can update my user record`, async ({ lib }) => {

        if (!spec.updateMyUserRecord)
            throw new Error("Test not implemented");
        await lib.updateMyUserRecord({ name: "Peppa Pig", email: "peppa@whitehouse.gov" });
        const updated = await lib.getMyUserRecord();
        expect(updated.data).toMatchObject({ name: "Peppa Pig", email: "peppa@whitehouse.gov" });

    });

    testName = spec.updateAnotherUsersRecord
        ? `${spec.role} can update another user's record`
        : `${spec.role} can NOT update another user's record`;
    test(testName, async ({ setup, lib }) => {

        const isAllowed = spec.updateAnotherUsersRecord;
        // A
        const accountId = state.currentAccountId;
        const userId = await setup.createUser({ accountId });
        // A
        try {

            await lib.updateUserRecord({ id: userId, name: "Barbara" });
            if (isAllowed) {
                const updated = await lib.getUserRecord({ id: userId });
                expect(updated.data).toMatchObject({ name: "Barbara", email: `user.${userId}@example.com` });
            } else
                throw new Error("Expected an error to be thrown");

        } catch (err) {

            if (isAllowed)
                throw err;
            else
                expect(err.message).toContain("permission-denied");

        }

    });

    // ACCOUNT
    testName = spec.createAnAccont
        ? `${spec.role} can create an account`
        : `${spec.role} can NOT create an account`;
    test(testName, async ({ lib }) => {

        const isAllowed = spec.createAnAccount;
        try {

            // Act
            const accountId = await lib.createAccount({ name: "TEST account" });

            // A
            if (!isAllowed)
                throw new Error("Expected permission denied");
            const account = await lib.getAccount({ id: accountId });
            expect(account).toMatchObject({ id: accountId, data: { name: "TEST account" } });

        } catch (err) {

            // A
            if (isAllowed) throw err;
            expect(err.message).toContain("permission-denied");

        }

    });

    testName = spec.listAccounts
        ? `${spec.role} can list accounts`
        : `${spec.role} can NOT list accounts`;
    test(testName, async ({ lib }) => {

        const isAllowed = spec.listAccounts;
        try {

            const accounts = await lib.listAccounts();
            if (!isAllowed) throw new Error("Expected permission denied");
            expect(accounts.map(a => a.id)).toContainEqual(state.currentAccountId);

        } catch (err) {

            if (isAllowed) throw err;
            expect(err.message).toContain("permission-denied");

        }

    });

    test(`${spec.role} can get an account`, async ({ lib }) => {

        if (!spec.getAnAccount)
            throw new Error("Test not implemented");
        const id = state.currentAccountId;
        const account = await lib.getAccount({ id });
        expect(account).toMatchObject({ id, data: { name: `Account ${id}` } });

    });

    testName = spec.deleteAnAccount
        ? `${spec.role} can delete an account`
        : `${spec.role} can NOT delete an account`;
    test(testName, async ({ lib, setup }) => {

        const isAllowed = spec.deleteAnAccount;
        // A
        const newAccountId = await setup.createAccount();
        try {

            // A
            await lib.deleteAccount({ id: newAccountId });
            // A
            if (!isAllowed) throw new Error("Expected permission denied");
            const account = await lib.getAccount({ id: newAccountId });
            expect(account.data).toEqual(undefined);

        } catch (err) {

            if (isAllowed) throw err;
            expect(err.message).toContain("permission-denied");

        }

    });

    test(`${spec.role} can list users for an account`, async ({ app, setup, lib }) => {

        if (!spec.listUsersForAnAccount)
            throw new Error("Test not implemented");

        const accountId = state.currentAccountId;
        const user1Id = await setup.createUser({ accountId, waitForPublic: true });
        const user2Id = await setup.createUser({ accountId, waitForPublic: true });
        const user3Id = await setup.createUser({ accountId: "Not a real account", waitForPublic: true });

        const users = await lib.getUsers();
        const userIds = users.map(u => u.id);
        expect(userIds).toEqual(expect.arrayContaining([user1Id, user2Id]));
        expect(userIds).not.toEqual(expect.arrayContaining([user3Id]));

    });

    test(`${spec.role} can make an account admin`, async ({ setup, app, lib }) => {

        if (!spec.makeAnAccountAdmin)
            throw new Error("Test not implemented");

        // A
        const accountId = state.currentAccountId;
        const userId = await setup.createUser({
            accountId, waitForPublic: true, withLogin: true
        });
        // A
        await lib.makeAccountAdmin({ id: accountId, userId });

        // A
        const user = await lib.getUser({ id: userId });
        await app.loginWithEmailAndAccount(user.data.email, accountId);
        const entitlements = await lib.getEntitlements();
        expect(entitlements).toMatchObject({ isSuperAdmin: false, isAccountAdmin: true });

    });

    // TEAM
    test(`${spec.role} can create a team`, async ({ lib }) => {

        if (!spec.createATeam)
            throw new Error("Test not implemented");
        await lib.createTeam({ name: "TEST team" });

    });

    test(`${spec.role} can list teams`, async ({ lib }) => {

        if (!spec.listTeams)
            throw new Error("Test not implemented");
        const teamId = await lib.createTeam({ name: "TEST team" });
        const teams = await lib.listTeams();
        expect(teams.map(t => t.id)).toContain(teamId);

    });

    test(`${spec.role} can delete a team`, async ({ lib, setup }) => {

        if (!spec.deleteATeam)
            throw new Error("Test not implemented");
        const teamId = await lib.createTeam({ name: "TEST team" });
        await lib.deleteTeam({ id: teamId });
        const teams = await setup.listTeams();
        expect(teams.map(t => t.id)).not.toContain(teamId);

    });

    test(`${spec.role} can rename a team`, async ({ lib }) => {

        if (!spec.renameATeam)
            throw new Error("Test not implemented");
        const teamId = await lib.createTeam({ name: "TEST team" });
        const newTeamName = `Team ${Math.random()}`;
        await lib.renameTeam({ id: teamId, name: newTeamName });
        const team = await lib.getTeam({ id: teamId });
        expect(team.data.name).toEqual(newTeamName);

    });

    test(`${spec.role} can add a team member`, async ({ setup, lib }) => {

        if (!spec.addATeamMember)
            throw new Error("Test not implemented");
        // A
        const accountId = state.currentAccountId;
        const userId = await setup.createUser({ accountId, waitForPublic: true });
        const teamId = await lib.createTeam({ name: "TEST team" });
        // A
        await lib.addTeamMember({ id: teamId, userId });
        // A
        const members = await lib.getTeamMembers({ id: teamId });
        expect(members.map(m => m.id)).toEqual([userId]);
        expect(members.map(m => m.data.name)).toEqual([`User ${userId}`]);

    });

    test(`${spec.role} can add a team admin`, async ({ app, setup, lib }) => {

        if (!spec.makeATeamAdmin)
            throw new Error("Test not implemented");
        // Arrange
        const accountId = state.currentAccountId;
        const user = await setup.createUserLogin({ accountId });
        const teamId = await lib.createTeam({ name: "TEST make test admin" });
        // Act
        await lib.makeTeamAdmin({ id: teamId, userId: user.uid });
        // Assert
        const team = await lib.getTeam({ id: teamId });
        expect(team.data.admins).toHaveProperty(user.uid);

    });

    // INVITE
    test(`${spec.role} can invite a new user to a team, can read the invite`, async ({ lib }) => {

        if (!spec.inviteANewUserToATeam)
            throw new Error("Not implemented");
        if (!spec.readTheInvite)
            throw new Error("Not implemented");
        const teamId = await lib.createTeam({ name: "TEST team" });
        const inviteId = await lib.inviteTeamMember({
            teamId: teamId,
            email: "bright.eyes@example.com",
            name: "Bright Eyes"
        });
        const invite = await lib.getInvite({ id: inviteId });
        const { adminId } = state;
        expect(refPathFromJSON(invite.data.from)).toMatch(new RegExp(`/teams-users-public/${adminId}$`));
        expect(refPathFromJSON(invite.data.team)).toMatch(new RegExp(`/teams-teams/${teamId}`));

    });

    test(`${spec.role} can't accept the invitation myself`, async ({ lib }) => {

        if (spec.acceptTheInvitationMyself)
            throw new Error("Test not implemented");
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

    test(`${spec.role} can create invite which other person can accept`, async ({ app, lib, setup }) => {

        if (!spec.createInviteWhichCanBeAccepted)
            throw new Error("Test not implemented");
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

}