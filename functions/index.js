const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { handleInvitationAccept, handleTeamsModified } = require("./firebase-teams-integration");

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

exports.handleTeamsModified = functions.firestore
    .document("teams-teams/{id}")
    .onWrite((change, context) => handleTeamsModified({
        context,
        change,
        ...buildIntegration()
    }));
