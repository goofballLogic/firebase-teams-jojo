import { main } from "./views-teams.js";
import { CLASS_CREATE_TEAM, MODE_KEY } from "./taxonomy.js";

export function initTeams({
    container,
    model,

    doc,
    getDoc,
    setDoc,
    deleteField,

    users,
    teams,
    invites,
    usersPublic
}) {

    const integration = {
        container,
        model,
        doc, getDoc, setDoc, deleteField,
        users, teams, invites, usersPublic
    };

    render();

    function render() {

        updateModelFromURL();
        container.innerHTML = main(model);
        for (const a of container.querySelectorAll("a.client-side"))
            a.addEventListener("click", handleClientSideNavigation);
        for (const form of container.querySelectorAll(`form.${CLASS_CREATE_TEAM}`))
            form.addEventListener("submit", handleCreateTeam);

    }

    function updateModelFromURL() {
        const url = new URL(location.href);
        model.mode = url.searchParams.get(MODE_KEY) || "home";
    }

    function handleClientSideNavigation(e) {
        e.preventDefault();
        const href = e.target.href;
        history.pushState(null, "", href);
        render();
    }

    function handleCreateTeam(e) {
        e.preventDefault();

    }

}
