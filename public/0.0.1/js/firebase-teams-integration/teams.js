import { main } from "./views.js";
import { CLASS_CREATE_TEAM, MODE_KEY } from "./taxonomy.js";
import { generateName } from "./nouns.js";
import { getAccountData, getTeamsForUserInAccount } from "./queries.js";
import { fetchingOp, poll } from "./async.js";

export async function initTeams({
    container,
    model,

    doc,
    getDoc,
    setDoc,
    getDocs,
    deleteField,
    query,
    where,

    collections: {
        users,
        teams,
        invites,
        usersPublic,
        accounts
    }

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

        collections: {
            users,
            teams,
            invites,
            usersPublic,
            accounts
        }
    };

    //await ensureUserData();
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
        return;
        if (model.user) {
            const { account } = userAndAccount();
            try {

                model.user.accountTeams = await fetchingOp(
                    getTeamsForUserInAccount({ user: model.user, account, ...integration })
                );

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


    // async function ensureUserData() {

    //     if (model.user) {

    //         if (model.user.account && !model.user.accountData) {

    //             model.user.accountData = await fetchingOp(
    //                 getAccountData({ accountId: model.user.account, ...integration }),
    //                 "Fetching account data"
    //             );
    //             model.user.isAccountAdmin = model.user.uid in model.user.accountData?.admins;
    //             model.user.teamAdmin =

    //         }

    //     }

    // }

    async function handleCreateTeam(e) {
        e.preventDefault();

        const { account, uid } = userAndAccount();

        const form = e.target;
        const formData = new FormData(form);
        const name = formData.get("name");
        if (!name) throw new Error("Name not specified [HCT-20]");

        const teamRef = doc(teams, generateName(Date.now()));
        const accountRef = doc(accounts, account);
        const userRef = doc(users, uid);
        await setDoc(teamRef, { name, account: accountRef, members: { [uid]: userRef } });
        const userRecordUpdated = await poll(async () => {

            const ss = await getDoc(userRef);
            const userTeams = ss.data()?.teams;
            return userTeams && teamRef.id in userTeams;

        });

        if (!userRecordUpdated) {
            throw new Error("User record not updated [HCT-30]");
        }

        const url = new URL(location.href);
        url.searchParams.delete(MODE_KEY);
        history.pushState(null, "", url.href);

        render();

    }

}



