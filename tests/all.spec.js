import { readFileSync } from "fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { teamSideEffects } from "./functions/specs/team-side-effects";
import { createTeamAdminsSpec } from "./firestore/specs/create-team-admins";
import { createTeamsSpec } from "./firestore/specs/create-teams";
import { removingTeamMembersSpec } from "./firestore/specs/removing-team-members";
import { updatingUsers } from "./firestore/specs/update-user";
import { invitationsSpecs } from "./firestore/specs/invitations";
import { publicUserDocuments } from "./functions/specs/public-user-documents";
import { acceptInvitations } from "./functions/specs/accept-invitations";
import { accountAdministrationSpec } from "./firestore/specs/account-administration";

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

});

describe("functions", () => {

    teamSideEffects(testEnv);
    publicUserDocuments(testEnv);
    acceptInvitations(testEnv);

});

afterAll(async () => { await testEnv.cleanup(); });

