import { doc, setDoc, deleteField, serverTimestamp } from "firebase/firestore";
import { collections } from "./collections";

const generateId = (prefix = "test") => `${prefix}_${Math.random().toString().substring(2)}`;
export async function createTeam(db, { name, account, id = generateId("_team") }) {

    account = doc(db, account.path);
    const ref = doc(db, `${collections.TEAMS}/${id}`);
    await setDoc(ref, { name, account });
    return ref;

}
export async function createUserPrivate(db, { name, email, id = generateId(), extras = {} }) {

    const ref = doc(db, `${collections.USERS}/${id}`);
    await setDoc(ref, { name, email, ...extras });
    return ref;

}
export async function updateUserPrivate(db, { user, details }) {

    const ref = doc(db, `${collections.USERS}/${user.id}`);
    await setDoc(ref, details, { merge: true });

}
export async function updateUserPublic(db, { user, details }) {

    const ref = doc(db, `${collections.USERS_PUBLIC}/${user.id}`);
    await setDoc(ref, details, { merge: true });
    return ref;

}
export async function createUserPublic(db, { name, email, id = generateId() }) {

    const ref = doc(db, `${collections.USERS_PUBLIC}/${id}`);
    await setDoc(ref, { name, email });
    return ref;

}
export async function createAccount(db, { name, id = generateId(), entitlements = {} }) {

    const ref = doc(db, `${collections.ACCOUNTS}/${id}`);
    await setDoc(ref, { name, entitlements });
    return ref;

}
export async function reassignTeamToAccount(db, { team, account }) {

    const ref = doc(db, team.path);
    await setDoc(ref, { account });
    return ref;

}
export async function makeAccountAdmin(db, { userPublic, account }) {

    account = doc(db, account.path);
    userPublic = doc(db, userPublic.path);
    const patch = { admins: { [userPublic.id]: userPublic } };
    await setDoc(account, patch, { merge: true });

}
export async function makeTeamAdmin(db, { userPublic, team }) {

    team = doc(db, team.path);
    userPublic = doc(db, userPublic.path);
    const patch = { admins: { [userPublic.id]: userPublic } };
    await setDoc(team, patch, { merge: true });

}
export async function makeTeamMember(db, { userPublic, team }) {

    team = doc(db, team.path);
    userPublic = doc(db, userPublic.path);
    const patch = { members: { [userPublic.id]: userPublic } };
    await setDoc(team, patch, { merge: true });

}
export async function removeTeamMember(db, { userPublic, team }) {

    team = doc(db, team.path);
    userPublic = doc(db, userPublic.path);
    const patch = { members: { [userPublic.id]: deleteField() } };
    await setDoc(team, patch, { merge: true });

}
export async function createInvitation(db, { from, to, team, id = generateId() }) {

    team = doc(db, team.path);
    from = doc(db, from.path);
    const ref = doc(db, `${collections.INVITES}/${id}`);
    await setDoc(ref, { from, to, team });
    return ref;

}
export async function acceptInvitation(db, { invite, userPublic, team, poisonAccept }) {

    userPublic = doc(db, userPublic.path);
    invite = doc(db, invite.path);
    const patch = { accepted: { when: serverTimestamp(), user: userPublic } };
    if (team) {

        // should be disallowed by the rules
        team = doc(db, team.path)
        patch.team = team;

    }
    if (poisonAccept) {

        patch.accepted.when = "last year";

    }
    await setDoc(invite, patch, { merge: true });

}
