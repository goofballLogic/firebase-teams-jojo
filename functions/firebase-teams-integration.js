exports.handleInvitationAccept = async function handleInvitationAccept({
    change,
    logger
}) {

    const { before, after } = change;
    const beforeAccepted = before?.data()?.accepted;
    const afterAccepted = after?.data()?.accepted;
    const team = after?.data()?.team;
    if (afterAccepted?.user && team)
        if (beforeAccepted?.user !== afterAccepted.user) {

            const userId = afterAccepted.user.id;
            logger.debug("Adding invitee to team", { user: userId, team: team.id });
            const patch = { members: { [userId]: afterAccepted.user } };
            await team.set(patch, { merge: true });

        }
}

exports.handleTeamsWrite = async function handleTeamsWrite({
    change,
    teams,
    deleteField,
    logger
}) {

    const teamId = change.before?.id || change.after?.id;
    const beforeAccount = change.before?.data()?.account;
    const afterAccount = change.after?.data()?.account;
    if (beforeAccount?.path !== afterAccount?.path) {

        if (afterAccount) {

            logger.debug("Adding team to account", { account: afterAccount.id, team: teamId });
            const patch = { teams: { [teamId]: teams.doc(teamId) } };
            await afterAccount.set(patch, { merge: true });

        }
        if (beforeAccount) {

            logger.debug("Removing team from account", { account: beforeAccount.id, team: teamId });
            const patch = { teams: { [teamId]: deleteField } };
            await beforeAccount.set(patch, { merge: true });

        }

    }
    const beforeMembers = change.before?.data()?.members;
    const afterMembers = change.after?.data()?.members;
    if (beforeMembers) {
        const removedMembers = Object.entries(beforeMembers)
            .filter(([id]) => !(afterMembers && (id in afterMembers)))
            .map(([, ref]) => ref);
        for (const removedMember of removedMembers) {
            logger.debug("Removing member from team", { id: removedMember.id, teamId })
            await removedMember.set(
                { teams: { [teamId]: deleteField } },
                { merge: true }
            );
        }
    }
    if (afterMembers) {
        const addedMembers = Object.entries(afterMembers)
            .filter(([id]) => !(beforeMembers && (id in beforeMembers)))
            .map(([, ref]) => ref);
        for (const addedMember of addedMembers) {
            logger.debug("Adding member to team", { id: addedMember.id, teamId })
            await addedMember.set(
                { teams: { [teamId]: teams.doc(teamId) } },
                { merge: true }
            );
        }
    }
}

exports.handleUsersPrivateWrite = async function handleUsersPrivateWrite({
    change,
    users,
    logger
}) {

    const beforeUser = change.before?.data();
    const afterUser = change.after?.data();
    if (afterUser)
        if ((afterUser?.email != beforeUser?.email) || (afterUser?.name != beforeUser?.name)) {

            const userId = change.after.id;
            logger.debug("Updating user public record", { user: userId });
            const { name, email } = afterUser;
            const ref = users.doc(userId);
            await ref.set({ name, email });

        }

}
