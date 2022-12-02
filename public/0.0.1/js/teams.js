import { generateName } from "./nouns.js";
import { INVITATION_MODE, main } from "./views-teams.js";

let renderBound = () => { };
let addEventListenersBound = () => { };

export async function initTeams({ container, model, users, usersPublic, teams, invites, doc, getDoc, setDoc, deleteField }) {

    updateStateFromURL({ model });
    if (model.user) {

        await loadUserDetails({ model, users, usersPublic, doc, getDoc });
        await ensurePublicDetails({ model, usersPublic, doc, setDoc });

    }
    if (model.mode === INVITATION_MODE) {

        await loadInvitationDetails({ model, invites, doc, getDoc });

    }
    renderBound = render.bind(this, { container, model });
    addEventListenersBound = addEventListeners.bind(this, { container, model, users, usersPublic, teams, invites, doc, getDoc, setDoc, deleteField });
    renderBound();

}

function render({ container, model }) {

    updateStateFromURL({ model });
    if (model.user) {

        container.innerHTML = main(model);

    } else {

        container.innerHTML = "";

    }
    addEventListenersBound();

}

window.addEventListener("popstate", e => renderBound());

function updateStateFromURL({ model }) {

    const url = new URL(location.href);
    model = {
        ...model,
        mode: url.searchParams.get("ftj-mode"),
        teamId: url.searchParams.get("ftj-team-id"),
        invitationId: url.searchParams.get("ftj-invite")
    };
    if (model.user && model.teamId)
        if (!model.user?.details?.teams[model.teamId]) {
            url.searchParams.delete("ftj-mode");
            url.searchParams.delete("ftj-team-id");
            history.pushState(null, "", url);
            renderBound();
        }

}

function addEventListeners({ container, model, users, usersPublic, teams, invites, doc, getDoc, setDoc, deleteField }) {

    for (const form of container.querySelectorAll("form.add-team"))
        form.addEventListener("submit", handleAddTeamSubmit.bind(this, { model, users, usersPublic, teams, doc, getDoc, setDoc }));
    for (const a of container.querySelectorAll("a.client-side"))
        a.addEventListener("click", handleClientSideNav);
    for (const form of container.querySelectorAll("form#delete-team"))
        form.addEventListener("submit", handleDeleteTeamSubmit.bind(this, { model, users, teams, doc, getDoc, setDoc, deleteField }))
    for (const form of container.querySelectorAll("form#rename-team"))
        form.addEventListener("submit", handleRenameTeamSubmit.bind(this, { model, users, teams, doc, getDoc, setDoc }));
    for (const form of container.querySelectorAll("form#invite-member"))
        form.addEventListener("submit", handleInviteMemberSubmit.bind(this, { model, invites, doc, setDoc }));
    for (const form of container.querySelectorAll("form#accept-invitation"))
        form.addEventListener("submit", handleAcceptInvitationSubmit.bind(this, { model, invites, users, teams, doc, setDoc }));
    for (const form of container.querySelectorAll("form#remove-team-member"))
        form.addEventListener("submit", handleRemoveTeamMemberSubmit.bind(this, { model, teams, users, doc, setDoc, deleteField }));
}

function handleClientSideNav(e) {

    e.preventDefault();
    history.pushState(null, "", e.target.href);
    renderBound();

}

async function loadUserDetails({ model, users, doc, getDoc }) {

    const ref = doc(users, model.user.uid);
    const snap = await getDoc(ref);
    model.user.details = snap.exists() ? snap.data() : {};
    const teams = model.user.details.teams || {};
    model.user.details.teams = teams;
    for (const teamId in teams) {
        const team = await loadTeamDetails({ getDoc, teams, teamId });
        teams[teamId] = team;
    }

}

async function ensurePublicDetails({ model, usersPublic, doc, setDoc }) {
    const ref = doc(usersPublic, model.user.uid);
    setDoc(ref, {
        email: model.user.email,
        displayName: model.user.displayName
    });

}
async function loadInvitationDetails({ model, invites, doc, getDoc }) {

    const ref = doc(invites, model.invitationId);
    const snap = await getDoc(ref);
    const invite = snap.exists() ? snap.data() : {};
    if (invite.email.toLowerCase() === model.user?.email.toLowerCase()) {
        model.invitation = invite;
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

async function handleInviteMemberSubmit({ model, invites, doc, setDoc }, e) {

    e.preventDefault();

    const teamId = model?.teamId;
    const team = model.user?.details?.teams[teamId] || {};
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
                by: { name: model.user.displayName, email: model.user.email }
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

async function handleAcceptInvitationSubmit({ model, invites, doc, setDoc }, e) {

    e.preventDefault();
    const ref = doc(invites, model?.invitationId);
    await setDoc(ref, {
        accepted: {
            when: Date.now(),
            user: model.user?.uid
        }
    }, { merge: true });

}

async function handleRemoveTeamMemberSubmit({ model, teams, users, doc, setDoc, deleteField }, e) {

    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const member = formData.get("member");

    const userId = model.user?.uid;
    const teamId = model?.teamId;
    const team = model.user?.details?.teams[teamId];
    if (userId && teamId && team) {

        const memberInfo = team.members[member];
        if (memberInfo) {

            console.log(memberInfo);
            if (confirm(`Remove team member: ${memberInfo.displayName} (${memberInfo.email}) from team: ${team.name}?`)) {

                const userRef = doc(users, member);
                const teamRef = doc(teams, teamId);

                await setDoc(teamRef, { members: { [userId]: deleteField() } }, { merge: true });
                await setDoc(userRef, { teams: { [teamId]: deleteField() } }, { merge: true });

                // refresh user details
                await loadUserDetails({ model, users, doc, getDoc });
                renderBound();

            }

        }

    }

}

async function handleDeleteTeamSubmit({ model, users, teams, doc, getDoc, setDoc, deleteField }, e) {

    e.preventDefault();
    const teamId = model && model.teamId;
    const team = model.user?.details && model.user.details.teams[teamId];
    if (team) {

        if (confirm(`Delete team: ${team.name} (${teamId}). Are you sure?`)) {

            const teamRef = doc(teams, teamId);
            const snap = await getDoc(teamRef);
            if (snap.exists) {

                await setDoc(teamRef, { deleted: true }, { merge: true });

            }

            // remove from user list
            const userRef = doc(users, model.user?.uid);
            await setDoc(userRef, { teams: { [teamId]: deleteField() } }, { merge: true });

            // refresh user details
            await loadUserDetails({ model, users, doc, getDoc });
            renderBound();
        }

    }

}

async function handleRenameTeamSubmit({ model, teams, users, doc, getDoc, setDoc }, e) {

    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const name = formData.get("name");
    if (!name) renderError("Name is empty");

    const teamId = model && model.teamId;
    const team = model.user?.details && model.user.details.teams[teamId];
    if (team) {

        const teamRef = doc(teams, teamId);
        await setDoc(teamRef, { name }, { merge: true });

        // refresh user details
        await loadUserDetails({ model, users, doc, getDoc });
        renderBound();
    }

}

async function handleAddTeamSubmit({ model, users, usersPublic, teams, doc, getDoc, setDoc }, e) {

    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const name = formData.get("name");
    if (!name) renderError("Name is empty");

    const teamsRef = doc(teams, generateName(Date.now()));
    const usersRef = doc(users, model.user.uid);
    const usersPublicRef = doc(usersPublic, model.user.uid);
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
    await loadUserDetails({ model, users, doc, getDoc });
    renderBound();

}
