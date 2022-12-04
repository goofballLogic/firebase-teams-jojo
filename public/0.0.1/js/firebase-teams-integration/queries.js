export async function getTeamsForUserInAccount({ user, users, doc, getDoc }) {

    try {
        const userRef = doc(users, user.uid);
        const userData = await getDoc(userRef);
        if (!userData.exists())
            return [];
        const { teams: teamIndex } = userData.data();
        if (!teamIndex)
            return [];
        const result = [];
        for (const id in teamIndex) {
            const snapshot = await getDoc(teamIndex[id]);
            result.push({
                id,
                data: snapshot.exists() ? snapshot.data() : {}
            });
        }
        return result;
    } catch (err) {
        throw new Error(`GTFA-1: user: ${user} ${err}`);
    }

}

export async function getAccountData({ getDoc, doc, accounts, accountId }) {

    const ss = await getDoc(doc(accounts, accountId));
    if (ss.exists())
        return ss.data();

}

