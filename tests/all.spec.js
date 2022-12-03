import { readFileSync } from "fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { teamSideEffects } from "./functions/specs/team-side-effects.js";
import { createTeamAdminsSpec } from "./firestore/specs/create-team-admins.js";
import { createTeamsSpec } from "./firestore/specs/create-teams.js";
import { removingTeamMembersSpec } from "./firestore/specs/removing-team-members.js";
import { updatingUsers } from "./firestore/specs/update-user.js";
import { invitationsSpecs } from "./firestore/specs/invitations.js";
import { publicUserDocuments } from "./functions/specs/public-user-documents.js";
import { acceptInvitations } from "./functions/specs/accept-invitations.js";
import { accountAdministrationSpec } from "./firestore/specs/account-administration.js";
import { listTeamsSpec } from "./firestore/specs/list-teams.js";
import { listMyTeams } from "./functions/specs/list-my-teams.js";

const rulesFile = new URL("../firestore.rules", import.meta.url);
const firestoreSpec = { rules: readFileSync(rulesFile, "utf8") };
if (process.env.FIRESTORE_HOST) {
    firestoreSpec.host = process.env.FIRESTORE_HOST;
    firestoreSpec.port = process.env.FIRESTORE_PORT;
}
const testEnv = await initializeTestEnvironment({ firestore: firestoreSpec });

beforeEach(async () => { await testEnv.clearFirestore(); });

describe("firebase", () => {

    createTeamAdminsSpec(testEnv);
    createTeamsSpec(testEnv);
    removingTeamMembersSpec(testEnv);
    updatingUsers(testEnv);
    invitationsSpecs(testEnv);
    accountAdministrationSpec(testEnv);
    listTeamsSpec(testEnv);

});

describe("functions", () => {

    teamSideEffects(testEnv);
    publicUserDocuments(testEnv);
    acceptInvitations(testEnv);
    listMyTeams(testEnv);

});

afterAll(async () => { await testEnv.cleanup(); });

