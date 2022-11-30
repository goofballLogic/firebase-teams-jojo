export const TEAM_MODE = "team";
export const INVITATION_MODE = "invitation";

const defaultUrl = () => {
    const url = new URL(location.href);
    Array.from(url.searchParams.keys()).filter(k => k.startsWith("ftj-")).forEach(k => {
        url.searchParams.delete(k);
    });
    return url;
}

export function main({ user, ftj }) {

    const { mode, teamId, invitation } = ftj;
    const teams = user?.details?.teams || {};
    const team = teams[teamId];
    if (mode === TEAM_MODE) {
        return editTeam({ team, user });
    } else if (mode === INVITATION_MODE) {
        return acceptInvitation({ user, invitation });
    } else {
        return listTeams(teams);
    }

}

function acceptInvitation({ user, invitation }) {

    const when = invitation.accepted?.when;
    const whenData = {};
    if (when) {
        const whenDate = new Date(when);
        whenData.text = whenDate.toLocaleString();
        whenData.iso = whenDate.toISOString();
    }

    return `

        <section class="ftj invitation">

            <heading>Invitation to join ${invitation.team?.name}</heading>
            <p>
                You have been invited to join team <span class="team-name">${invitation.team?.name}</span>
            </p>
            <p>
                The invitation was sent by <span class="sent-by">
                    ${invitation.by?.name} (${invitation?.by?.email})
                </span>
            </p>
            ${invitation.accepted
            ? `
                Accepted on <time dateTime="${whenData.iso}" class="accepted-on">${whenData.text}</time>

                <a class="client-side home" href="${defaultUrl()}">Home</a>
            `
            : `
                <form id="accept-invitation">
                    <button>Accept</button>
                </form>
            `}

        </section>

    `

}

function editTeam({ team, user }) {

    const isAdmin = user?.uid in team.admins;
    return `

        <a class="client-side home" href="${defaultUrl()}">back</a>
        <section class="ftj team">

            ${!team ? "Team not found" : `

                <header>Team: ${team.name}</header>
                ${!isAdmin ? "" : `

                    <form id="rename-team">

                        <input type="text" name="name" value="${team.name}" />
                        <button>Rename</button>

                    </form>
                    <form id="delete-team">

                        <button>Delete</button>

                    </form>

                `}
                ${teamMembers({ team, user, isAdmin })}
                ${!isAdmin ? "" : `

                    <form id="invite-member">

                        <input type="email" name="email" placeholder="Email to invite" />
                        <input type="text" name="name" placeholder="Name of person to invite" />
                        <button>Invite</button>

                    </form>

                `}

            `}

        </section>

    `;

}

function teamMembers({ team, user, isAdmin }) {

    if (!team) return "";
    const members = Object
        .entries(team.members)
        .map(([id, details]) => ({ id, details, admin: id in team.admins }));
    return `

    <ol class="team-members">

        ${members.map(member => teamMember({ member, user, isAdmin })).join("")}

    </ol>

    `;

}

function teamMember({ member, user, isAdmin }) {

    const { id, details, admin } = member;
    return `
        <li>
            <span class="display-name">${details.displayName}<span>
            <span class="email">${details.email}</span>
            <span class="role">${admin ? "ADMIN" : ""}</span>
            ${(!isAdmin || id === user.uid) ? "" : `

                <form id="remove-team-member">
                    <input type="hidden" name="member" value="${id}" />
                    <button>Remove</button>
                </form>

            `}
        </li>
    `;

}

function listTeams(teams) {
    return `

        <section class="ftj teams">

            <header>Teams</header>
            ${addTeam()}
            ${renderTeams(Object.entries(teams))}

        </section>

        `;
}

function addTeam() {

    return `

        <form class="add-team">
            <input type="text" name="name" placeholder="Team name" />
            <button>Add</button>
        </form>

        `;

}
function renderTeams(teams) {

    if (!(teams && teams.length)) {

        return "No teams";

    } else {

        return `

        <ul class="ftj teams">
            ${teams.map(renderTeam).join("")}
            </ul>

        `;

    }

}

function teamMemberRoute(id) {

    const url = new URL(location.href);
    url.searchParams.set("ftj-mode", TEAM_MODE);
    url.searchParams.set("ftj-team-id", id);
    return url.href;

}

function renderTeam([id, data]) {

    return `

        <li>
        <a class="client-side" href="${teamMemberRoute(id)}">
            ${data.name}
        </a>
        </li>

        `;

}
