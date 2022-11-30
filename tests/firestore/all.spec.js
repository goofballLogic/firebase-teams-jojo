import { readFileSync } from "fs";
import { createTeamAdminsSpec } from "./specs/create-team-admins";
import { createTeamsSpec } from "./specs/create-teams";
import { removingTeamMembersSpec } from "./specs/removing-team-members";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { updatingUsers } from "./specs/update-user";
import { invitationsSpecs } from "./specs/invitations";

const rulesFile = new URL("../../firestore.rules", import.meta.url);
const rules = readFileSync(rulesFile, "utf8");
const testEnv = await initializeTestEnvironment({ firestore: { rules } });

beforeEach(async () => { await testEnv.clearFirestore(); });

describe("Sequential", () => {

    createTeamAdminsSpec(testEnv);
    createTeamsSpec(testEnv);
    removingTeamMembersSpec(testEnv);
    updatingUsers(testEnv);
    invitationsSpecs(testEnv);

});

afterAll(async () => { await testEnv.cleanup(); });

