import { nonce } from "./nonce.js";
import { generateName } from "./nouns.js";
import { poll } from "./poll.js";

export function getTeams({ user, getDoc, getDocs, setDoc, doc, deleteDoc, serverTimestamp, where, query, collections: { users, teams, accounts, usersPrivate, invites } }) {

    return {

        async getEntitlements() {

            const isSuperAdmin = user?.superAdmin;

            const account = await this.getAccount({ id: user.account });
            const isAccountAdmin = account.data?.admins && (user?.uid in account.data.admins);

            return {
                createAccount: !!isSuperAdmin, // create accouns
                createTeam: !!(isSuperAdmin || isAccountAdmin), // create a team in the current account
                userAdmin: !!isSuperAdmin, // administer users directly
                isSuperAdmin: !!isSuperAdmin,
                isAccountAdmin: !!isAccountAdmin
            };

        },

        // TEAM CRD
        async createTeam({ name }) {

            if (!user.account) throw new Error("No account for user [FCT-10]");
            const data = {
                name,
                account: doc(accounts, user.account)
            };
            return await createInCollection(teams, data, "FCT-10");

        },

        async getTeam({ id }) {

            return await getById(teams, id, "FGT-10");

        },

        async listTeams() {

            const criteria = user.superAdmin
                ? null
                : where("account", "==", doc(accounts, user.account));
            return await listCollection(teams, criteria);

        },

        async deleteTeam({ id }) {

            await deleteById(teams, id, "FDT-10");

        },

        // TEAM update
        async renameTeam({ id, name }) {

            await patchById({
                collection: teams,
                id,
                code: "FNT-10",
                patch: { name }
            });

        },

        async addTeamMember({ id, userId }) {

            if (!userId) throw new Error("No user id specified [FATM-11]");
            const patch = {
                members: {
                    [userId]: doc(users, userId)
                }
            };
            await patchById({
                collection: teams,
                id,
                code: "FATM-10",
                patch
            });

        },

        async makeTeamAdmin({ id, userId }) {

            if (!userId) throw new Error("No user id specified [FMTA-10]");
            const patch = {
                admins: {
                    [userId]: doc(users, userId)
                }
            };
            await patchById({
                collection: teams,
                id,
                code: "FMTA-11",
                patch
            });

        },

        // USER PUBLIC read
        async getTeamMembers({ id }) {

            return await readDocMapDocs({
                collection: teams,
                id,
                code: "FGTM-10",
                extractMap: x => x.members
            });

        },

        async getUsers() {

            return await readDocMapDocs({
                collection: accounts,
                id: user?.account,
                code: "FGU-10",
                extractMap: x => x.members
            });

        },

        async getUser({ id }) {

            return await getById(users, id, "FGU-11");

        },

        // USER PRIVATE read
        async getMyUserRecord() {

            return getById(usersPrivate, user.uid, "FGU-10");

        },

        async getUserRecord({ id }) {

            return getById(usersPrivate, id, "FGUR-10");

        },

        // USER PRIVATE update
        async updateMyUserRecord({ name, email }) {

            const id = user.uid;
            await this.updateUserRecord({ id, name, email });

        },

        async updateUserRecord({ id, name, email }) {

            if (!(name || email)) return;
            const patch = {};
            if (name) patch.name = name;
            if (email) patch.email = email;
            await patchById({
                collection: usersPrivate,
                id,
                code: "FUMUR-10",
                patch
            });

        },

        // ACCOUNT crud
        async createAccount({ name }) {

            if (!name) throw new Error("No name specified [FCA-10]");
            return await createInCollection(accounts, { name });

        },

        async getAccount({ id }) {

            return await getById(accounts, id, "FGA-10");

        },

        async listAccounts() {

            return await listCollection(accounts);

        },

        async deleteAccount({ id }) {

            await deleteById(accounts, id, "FDA-10");

        },

        async makeAccountAdmin({ id, userId }) {

            if (!userId) throw new Error("No user id specified [FMAA-10]");
            const patch = { admins: { [userId]: doc(users, userId) } };
            return await patchById({ collection: accounts, id, code: "FMAA-20", patch });

        },

        // INVITE create
        async inviteTeamMember({ teamId, email, name }) {

            if (!teamId) throw new Error("No team id specified [FITM-11]");
            if (!user.uid) throw new Error("No user id specified [FITM-10]");
            const data = {
                from: doc(users, user.uid),
                team: doc(teams, teamId),
                to: { email, name }
            }
            return await createInCollection(invites, data, "FITM-20");

        },

        // INVITE get
        async getInvite({ id }) {

            return getById(invites, id, "FGI-10");

        },

        // INVITE accept (update)
        async acceptInvitation({ id, waitForMembership }) {

            if (!user.uid) throw new Error("No user id specified [FAI-10]");
            const patch = {
                accepted: {
                    user: doc(users, user.uid),
                    when: serverTimestamp()
                }
            };
            await patchById({
                collection: invites,
                id,
                code: "FAI-10",
                patch
            });
            if (waitForMembership) {

                const invite = await getById(invites, id);
                const teamRef = invite?.data?.team;

                return await poll(async () => {
                    const snap = await getDoc(teamRef);
                    if (user.uid in snap.data().members) return true;
                }, 20);

            }

        }

    };


    async function patchById({ collection, id, code, patch }) {

        if (!id) throw new Error(`No id specified [${code}]`);
        const ref = doc(collection, id);
        await setDoc(ref, patch, { merge: true });

    }

    async function readDocMapDocs({ collection, id, code, extractMap }) {

        if (!id) throw new Error(`No id specified[${code}]`);
        const ref = doc(collection, id);
        const snap = await getDoc(ref);
        const data = snap?.data();
        const innerMap = data && extractMap(data);
        const result = [];
        if (innerMap)
            for (const [id, ref] of Object.entries(innerMap)) {

                const itemSnap = await getDoc(ref);
                result.push({ id, data: itemSnap.data() });

            };
        return result;

    }

    async function createInCollection(collection, data, code) {
        const id = generateName(nonce());
        const ref = doc(collection, id);
        try {
            await setDoc(ref, data);
        } catch (err) {
            throw new Error(`Failed to create in collection [${code}].${err}`);
        }
        return id;
    }

    async function deleteById(collection, id, code) {
        if (!id)
            throw new Error(`No id specified[${code}]`);
        const ref = doc(collection, id);
        await deleteDoc(ref);
    }

    async function listCollection(collection, criteria) {
        const target = criteria ? query(collection, criteria) : collection;
        const snap = await getDocs(target);
        return snap.docs.map(d => ({
            id: d.id,
            data: d.data()
        }));
    }

    async function getById(collection, id, code) {

        if (!id)
            throw new Error(`No id specified [${code}]`);
        const ref = doc(collection, id);
        const snap = await getDoc(ref);
        return {
            id,
            data: snap.data()
        };
    }

}
