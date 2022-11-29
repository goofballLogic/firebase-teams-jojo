const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { handleInvitationAccept } = require("./firebase-teams-integration");

admin.initializeApp();

function buildIntegration() {

    const firestore = admin.firestore();
    return {
        users: firestore.collection("teams-users"),
        teams: firestore.collection("teams-teams")
    };

}

exports.handleInvitationAccept = functions
    .firestore
    .document("teams-invites/{inviteId}")
    .onWrite((change, context) => handleInvitationAccept({
        change,
        ...buildIntegration()
    }));
