const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { handleInvitationAccept, handleTeamsWrite, handleUsersWrite } = require("./firebase-teams-integration");

admin.initializeApp();

function buildIntegration() {

    const firestore = admin.firestore();
    return {
        users: firestore.collection("teams-users"),
        teams: firestore.collection("teams-teams"),
        usersPublic: firestore.collection("teams-users-public"),
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

exports.handleUsersWrite = functions.firestore
    .document("teams-users/{id}")
    .onWrite((change, context) => handleUsersWrite({
        context,
        change,
        ...buildIntegration()
    }));
