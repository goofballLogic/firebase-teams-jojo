import { main } from "./views-teams.js";
import { CLASS_CREATE_TEAM, MODE_KEY } from "./taxonomy.js";
import { generateName } from "./nouns.js";

export function initTeams({
    container,
    model,

    doc,
    getDoc,
    setDoc,
    getDocs,
    deleteField,
    query,
    where,

    users,
    teams,
    invites,
    usersPublic,
    accounts

}) {

    const integration = {
        container,
        model,

        doc,
        getDoc,
        setDoc,
        getDocs,
        deleteField,
        query,
        where,

        users,
        teams,
        invites,
        usersPublic,
        accounts
    };

    render();

    async function render() {

        updateModelFromURL();
        await updateModelForMode();
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

    async function updateModelForMode() {

        if (model.user) {
            const { account } = userAndAccount();

            try {
                const docs = await getTeamsForUserInAccount({ user: model.user, account, ...integration });
                model.user.accountTeams = docs.docs.map(d => ({
                    id: d.id,
                    data: d.data()
                }));
            } catch (err) {
                console.warn("[UMFM-1]", { account }, err);
            }
        }

    }

    function handleClientSideNavigation(e) {
        e.preventDefault();
        const href = e.target.href;
        history.pushState(null, "", href);
        render();
    }

    function userAndAccount() {
        if (!model.user) throw new Error("Not authenticated [UAA-10]");
        const { account, uid } = model.user;
        if (!uid) throw new Error("No user id specified [UAA-12]");
        if (!account) throw new Error(`No account selected for user ${uid} [UAA-11]`);

        return { account, uid };
    }

    async function handleCreateTeam(e) {
        e.preventDefault();

        const { account, uid } = userAndAccount();

        const form = e.target;
        const formData = new FormData(form);
        const name = formData.get("name");
        if (!name) throw new Error("Name not specified [HCT-20]");

        const ref = doc(teams, generateName(Date.now()));
        const accountRef = doc(accounts, account);
        const userRef = doc(users, uid);
        await setDoc(ref, { name, account: accountRef, members: { [uid]: userRef } });
        const url = new URL(location.href);
        url.searchParams.delete(MODE_KEY);
        history.pushState(null, "", url.href);
        render();

    }

}
async function getTeamsForUserInAccount({ user, account, query, teams, accounts, where, doc, getDocs }) {

    try {
        const accountRef = doc(accounts, account);
        return await getDocs(
            query(
                teams,
                where(`members.${user.uid}`, "!=", null)
            )
        );
    } catch (err) {
        throw new Error(`GTFA-1: account: ${account} ${err}`);
    }

}

