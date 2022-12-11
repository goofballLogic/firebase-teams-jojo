const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { handleInvitationAccept, handleTeamsWrite, handleUsersPrivateWrite } = require("./firebase-teams-integration");

admin.initializeApp();

function buildIntegration() {

    const firestore = admin.firestore();
    return {
        users: firestore.collection("teams-users"),
        teams: firestore.collection("teams-teams"),
        usersPrivate: firestore.collection("teams-users-private"),
        logger: functions.logger,
        deleteField: admin.firestore.FieldValue.delete()
    };

}

exports.handleInvitationAccept = functions.firestore
    .document("teams-invites/{id}")
    .onWrite((change) => handleInvitationAccept({
        change,
        ...buildIntegration()
    }));

exports.handleTeamsWrite = functions.firestore
    .document("teams-teams/{id}")
    .onWrite((change, context) => handleTeamsWrite({
        context,
        change,
        ...buildIntegration()
    }));

exports.handleUsersPrivateWrite = functions.firestore
    .document("teams-users-private/{id}")
    .onWrite((change, context) => handleUsersPrivateWrite({
        context,
        change,
        ...buildIntegration()
    }));
