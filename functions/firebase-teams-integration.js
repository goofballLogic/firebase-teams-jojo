exports.handleInvitationAccept = async function handleInvitationAccept({
    change,
    teams,
    users,
    usersPublic
}) {
    return;
    const { after } = change;
    const data = after.data();
    console.log(change);
    const uid = data.accepted?.user;
    const teamId = data.team.id;
    if (!uid) return;
    if (!teamId) return;
    const userRef = users.doc(uid);
    const publicUserRef = usersPublic.doc(uid);
    const teamRef = teams.doc(teamId);
    await Promise.all([
        teamRef.set({ members: { [uid]: publicUserRef } }, { merge: true }),
        userRef.set({ teams: { [teamId]: teamRef } }, { merge: true })
    ]);
}

exports.handleTeamsModified = async function handleTeamsWrite({
    change,
    context,
    teams,
    accounts,
    logger,
    deleteField
}) {


    const afterTeamId = change.after?.id;
    const beforeAccount = change.before?.data()?.account;
    const afterAccount = change.after?.data()?.account;
    if (beforeAccount?.path !== afterAccount?.path) {

        if (afterAccount) {

            const patch = { teams: { [afterTeamId]: teams.doc(afterTeamId) } };
            await afterAccount.set(patch, { merge: true });

        }
        if (beforeAccount) {

            const patch = { teams: { [afterTeamId]: deleteField } };
            await beforeAccount.set(patch, { merge: true });

        }

    }

}
