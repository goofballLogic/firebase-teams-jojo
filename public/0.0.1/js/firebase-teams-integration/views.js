import {
    MODE_CREATE_TEAM,
    MODE_HOME,
    MODE_KEY,
    CLASS_CREATE_TEAM
} from "./taxonomy.js";

export function main(model) {

    return `

        ${nav()}
        ${model.mode !== MODE_CREATE_TEAM ? "" : createTeam()}
        ${model.mode !== MODE_HOME ? "" : home(model)}
        <pre>${JSON.stringify(model, (key, value) => ["firestore", "_key"].includes(key) ? "..." : value, 3)}</pre>

    `;

}

function home(model) {

    const teams = model.user?.accountTeams || [];
    return `<article>

        <ul>
            ${teams.map(item => team(item, model)).join("")}
        </ul>

    </article>`;

}

function team(teamRecord) {


    return `<li class="team">
        ${teamRecord.data?.name}
    </li>`;

}

function createTeam() {

    return `<form class="${CLASS_CREATE_TEAM}">

        <label>
            <span>Team name</span>
            <input type="text" name="name" placeholder="Team name" />
        </label>
        <input type="submit" value="Create" />

    </form>`;

}

function nav() {

    const url = new URL(location.href);
    url.searchParams.set(MODE_KEY, MODE_CREATE_TEAM);

    return `<nav>

        <a class="client-side" href="${url.href}">Create a team</a>

    </nav>`;

}
