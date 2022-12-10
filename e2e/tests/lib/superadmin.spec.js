import { test } from "../../fixtures/index.js";
import { printPageConsoleMessages } from "./printPageConsoleMessages.js";
const { describe, beforeEach } = test;
import specifyTests from "./lib.test-implementation.js";

describe("SUPER ADMIN", () => {

    const state = {};
    beforeEach(async ({ app, context, setup }) => {

        const admin = await setup.createSuperAdmin();
        const accountId = await setup.createAccount();
        await app.loginWithEmailAndAccount(admin.email, accountId);
        printPageConsoleMessages(context);
        state.adminId = admin.uid;
        state.accountId = accountId;

    });

    specifyTests({

        state,

        calculateEntitlements: {
            createAccount: true,
            createTeam: true,
            userAdmin: true,
            isSuperAdmin: true,
            isAccountAdmin: false
        },
        // user record
        fetchMyUserRecord: true,
        fetchAnotherUsersUserRecord: true,
        updateMyUserRecord: true,
        updateAnotherUsersRecord: true,
        // accounts
        createAnAccount: true,
        listAccounts: true,
        getAnAccount: true,
        deleteAnAccount: true,
        listUsersForAnAccount: true,
        makeAnAccountAdmin: true,
        // teams
        createATeam: true,
        listTeams: true,
        deleteATeam: true,
        renameATeam: true,
        addATeamMember: true,
        makeATeamAdmin: true,
        // invites
        inviteANewUserToATeam: true,
        readTheInvite: true,
        acceptTheInvitationMyself: false,
        createInviteWhichCanBeAccepted: true
    });


});


