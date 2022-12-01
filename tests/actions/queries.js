import { doc, getDoc } from "firebase/firestore";
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
