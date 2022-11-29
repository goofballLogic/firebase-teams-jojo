import { generateName } from "./nouns.js";
import { INVITATION_MODE, main } from "./views-teams.js";

let renderBound = () => { };
let addEventListenersBound = () => { };

export async function initTeams({ container, state, users, usersPublic, teams, invites, doc, getDoc, setDoc, deleteField }) {

    updateStateFromURL({ state });
    if (state.user) {

        await loadUserDetails({ state, users, usersPublic, doc, getDoc });
        await ensurePublicDetails({ state, usersPublic, doc, setDoc });

    }
    if (state.ftj.mode === INVITATION_MODE) {

        await loadInvitationDetails({ state, invites, doc, getDoc });

    }
    renderBound = render.bind(this, { container, state });
    addEventListenersBound = addEventListeners.bind(this, { container, state, users, usersPublic, teams, invites, doc, getDoc, setDoc, deleteField });
    renderBound();

}

function render({ container, state }) {

    updateStateFromURL({ state });
    if (state.user) {

        container.innerHTML = main(state);

    } else {

        container.innerHTML = "";

    }
    addEventListenersBound();

}

window.addEventListener("popstate", e => renderBound());

function updateStateFromURL({ state }) {

    const url = new URL(location.href);
    state.ftj = {
        ...state.ftj,
        mode: url.searchParams.get("ftj-mode"),
        teamId: url.searchParams.get("ftj-team-id"),
        invitationId: url.searchParams.get("ftj-invite")
    };
    if (state.user && state.ftj.teamId)
        if (!state.user?.details?.teams[state.ftj.teamId]) {
            url.searchParams.delete("ftj-mode");
            url.searchParams.delete("ftj-team-id");
            history.pushState(null, "", url);
            renderBound();
        }

}

function addEventListeners({ container, state, users, usersPublic, teams, invites, doc, getDoc, setDoc, deleteField }) {

    for (const form of container.querySelectorAll("form.add-team"))
        form.addEventListener("submit", handleAddTeamSubmit.bind(this, { state, users, usersPublic, teams, doc, getDoc, setDoc }));
    for (const a of container.querySelectorAll("a.client-side"))
        a.addEventListener("click", handleClientSideNav);
    for (const form of container.querySelectorAll("form#delete-team"))
        form.addEventListener("submit", handleDeleteTeamSubmit.bind(this, { state, users, teams, doc, getDoc, setDoc, deleteField }))
    for (const form of container.querySelectorAll("form#rename-team"))
        form.addEventListener("submit", handleRenameTeamSubmit.bind(this, { state, users, teams, doc, getDoc, setDoc }));
    for (const form of container.querySelectorAll("form#invite-member"))
        form.addEventListener("submit", handleInviteMemberSubmit.bind(this, { state, invites, doc, setDoc }));
    for (const form of container.querySelectorAll("form#accept-invitation"))
        form.addEventListener("submit", handleAcceptInvitationsubmit.bind(this, { state, invites, users, teams, doc, setDoc }));
}

function handleClientSideNav(e) {

    e.preventDefault();
    history.pushState(null, "", e.target.href);
    renderBound();

}

async function loadUserDetails({ state, users, doc, getDoc }) {

    const ref = doc(users, state.user.uid);
    const snap = await getDoc(ref);
    state.user.details = snap.exists() ? snap.data() : {};
    const teams = state.user.details.teams || {};
    state.user.details.teams = teams;
    for (const teamId in teams) {
        const team = await loadTeamDetails({ getDoc, teams, teamId });
        teams[teamId] = team;
    }

}

async function ensurePublicDetails({ state, usersPublic, doc, setDoc }) {
    const ref = doc(usersPublic, state.user.uid);
    setDoc(ref, {
        email: state.user.email,
        displayName: state.user.displayName
    });

}
async function loadInvitationDetails({ state, invites, doc, getDoc }) {

    const ref = doc(invites, state.ftj.invitationId);
    const snap = await getDoc(ref);
    const invite = snap.exists() ? snap.data() : {};
    if (invite.email.toLowerCase() === state.user?.email.toLowerCase()) {
        state.ftj.invitation = invite;
    } else {
        renderError({ message: "Invalid invitation (LID-E)" });
    }

}

function renderError({ message }) {
    alert(message);

}

async function loadTeamDetails({ getDoc, teams, teamId }) {
    const snap = await getDoc(teams[teamId]);
    const team = snap.exists() ? snap.data() : {};
    for (const userId in team.members) {
        team.members[userId] = await loadTeamMemberDetails({
            getDoc,
            publicUserRef: team.members[userId]
        });
    }
    return team;
}

async function loadTeamMemberDetails({ getDoc, publicUserRef }) {

    const snap = await getDoc(publicUserRef);
    return snap.exists() ? snap.data() : {};

}

async function handleInviteMemberSubmit({ state, invites, doc, setDoc }, e) {

    e.preventDefault();

    const teamId = state.ftj?.teamId;
    const team = state.user?.details?.teams[teamId] || {};
    if (teamId) {

        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get("email");
        const name = formData.get("name") || "Invitee";
        if (email) {

            const id = generateName(Date.now());
            const ref = doc(invites, id);
            await setDoc(ref, {
                email,
                name,
                team: { id: teamId, name: team.name },
                by: { name: state.user.displayName, email: state.user.email }
            });
            const inviteLink = new URL(location.href);
            Array.from(inviteLink.searchParams.keys())
                .filter(k => k.startsWith("ftj-"))
                .forEach(k => inviteLink.searchParams.delete(k));
            inviteLink.searchParams.set("ftj-invite", id);
            inviteLink.searchParams.set("ftj-mode", INVITATION_MODE);
            alert(inviteLink.href);

        }

    }

}

async function handleAcceptInvitationsubmit({ state, users, teams, invites, doc, getDoc, setDoc }, e) {

    e.preventDefault();
    const ref = doc(invites, state.ftj?.invitationId);
    await setDoc(ref, {
        accepted: {
            when: Date.now(),
            user: state.user?.uid
        }
    }, { merge: true });

}

async function handleDeleteTeamSubmit({ state, users, teams, doc, getDoc, setDoc, deleteField }, e) {

    e.preventDefault();
    const teamId = state.ftj && state.ftj.teamId;
    const team = state.user?.details && state.user.details.teams[teamId];
    if (team) {

        if (confirm(`Delete team: ${team.name} (${teamId}). Are you sure?`)) {

            const teamRef = doc(teams, teamId);
            const snap = await getDoc(teamRef);
            if (snap.exists) {

                await setDoc(teamRef, { deleted: true }, { merge: true });

            }

            // remove from user list
            const userRef = doc(users, state.user?.uid);
            await setDoc(userRef, { teams: { [teamId]: deleteField() } }, { merge: true });

            // refresh user details
            await loadUserDetails({ state, users, doc, getDoc });
            renderBound();
        }

    }

}

async function handleRenameTeamSubmit({ state, teams, users, doc, getDoc, setDoc }, e) {

    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const name = formData.get("name");
    if (!name) renderError("Name is empty");

    const teamId = state.ftj && state.ftj.teamId;
    const team = state.user?.details && state.user.details.teams[teamId];
    if (team) {

        const teamRef = doc(teams, teamId);
        await setDoc(teamRef, { name }, { merge: true });

        // refresh user details
        await loadUserDetails({ state, users, doc, getDoc });
        renderBound();
    }

}

async function handleAddTeamSubmit({ state, users, usersPublic, teams, doc, getDoc, setDoc }, e) {

    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const name = formData.get("name");
    if (!name) renderError("Name is empty");

    const teamsRef = doc(teams, generateName(Date.now()));
    const usersRef = doc(users, state.user.uid);
    const usersPublicRef = doc(usersPublic, state.user.uid);
    // create team
    const team = {
        name,
        admins: { [usersRef.id]: usersRef },
        members: { [usersPublicRef.id]: usersPublicRef }
    };
    await setDoc(teamsRef, team); // will fail if already exists

    // update user
    await setDoc(usersRef, {
        teams: { [teamsRef.id]: teamsRef }
    }, { merge: true });

    // refresh user details
    await loadUserDetails({ state, users, doc, getDoc });
    renderBound();

}
