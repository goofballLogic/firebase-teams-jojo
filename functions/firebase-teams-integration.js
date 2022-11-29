exports.handleInvitationAccept = async function handleInvitationAccept({
    change,
    teams,
    users,
    usersPublic
}) {
    const { after } = change;
    const data = after.data();
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
