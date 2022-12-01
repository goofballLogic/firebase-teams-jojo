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

const rulesFile = new URL("../firestore.rules", import.meta.url);
const rules = readFileSync(rulesFile, "utf8");
const testEnv = await initializeTestEnvironment({ firestore: { rules } });

beforeEach(async () => { await testEnv.clearFirestore(); });

describe("firebase", () => {

    createTeamAdminsSpec(testEnv);
    createTeamsSpec(testEnv);
    removingTeamMembersSpec(testEnv);
    updatingUsers(testEnv);
    invitationsSpecs(testEnv);

});

describe("functions", () => {

    teamSideEffects(testEnv);
    publicUserDocuments(testEnv);
    acceptInvitations(testEnv);

});

afterAll(async () => { await testEnv.cleanup(); });

