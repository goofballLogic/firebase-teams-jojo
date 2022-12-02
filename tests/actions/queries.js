import { doc, getDoc, getDocs, collection, where, query } from "firebase/firestore";
import { collections } from "./collections";

export async function readUserPrivate(db, { user }) {

    const ref = doc(db, `${collections.USERS}/${user.id}`);
    return await getDoc(ref);

}
export async function readUserPublic(db, { user }) {

    const ref = doc(db, `${collections.USERS_PUBLIC}/${user.id}`);
    return await getDoc(ref);

}
export async function readAccount(db, { account }) {

    const ref = doc(db, account.path);
    return await getDoc(ref);

}
export async function readTeam(db, { team }) {

    const ref = doc(db, team.path);
    return await getDoc(ref);

}
export async function listAccounts(db, { userPublic }) {

    const ref = collection(db, collections.ACCOUNTS);

    // firebase doesn't let us filter using rules alone. We have to actually query for documents that match our criteria.
    // searching for a map path which is not null appears to be the only way to achieve this (i.e. admins.MYUSERID != null)
    return await getDocs(
        query(
            ref,
            where(`admins.${userPublic.id}`, "!=", null)
        )
    );

}

export async function listTeams(db, { userPublic }) {

    const ref = collection(db, collections.TEAMS);

    // firebase doesn't let us filter using rules alone. We have to actually query for documents that match our criteria.
    // searching for a map path which is not null appears to be the only way to achieve this (i.e. members.MYUSERID != null)
    return await getDocs(
        query(
            ref,
            where(`members.${userPublic.id}`, "!=", null)
        )
    );

}
