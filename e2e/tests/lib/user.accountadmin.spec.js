import { test } from "../../fixtures/index.js";
import { printPageConsoleMessages } from "./printPageConsoleMessages.js";
const { beforeEach } = test;
import specifyTests from "./lib.test-implementation.js";

const state = {};

beforeEach(async ({ app, context, setup }) => {

    const accountId = await setup.createAccount();
    const admin = await setup.createAccountAdmin(accountId);
    await app.loginWithEmailAndAccount(admin.email, accountId);
    printPageConsoleMessages(context);
    state.adminId = admin.uid;
    state.currentAccountId = accountId;

});

specifyTests({

    role: "ACCOUNT ADMIN",
    state,
    calculateEntitlements: {
        createAccount: false,
        createTeam: true,
        userAdmin: false,
        isSuperAdmin: false,
        isAccountAdmin: true
    },

    // user record
    fetchMyUserRecord: true,
    fetchAnotherUsersUserRecord: false,
    updateMyUserRecord: true,
    updateAnotherUsersRecord: false,

    // accounts
    createAnAccount: false,
    listAccounts: false,
    getAnAccount: true,
    deleteAnAccount: false,
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