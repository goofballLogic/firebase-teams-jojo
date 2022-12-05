import { generateName } from "./nouns.js";

function nonce() {
    return Date.now().toString() + Math.random().toString().substring(1).replace(".", "-");
}
export function getTeams({ user, getDoc, getDocs, setDoc, doc, deleteDoc, serverTimestamp, collections: { users, teams, accounts, usersPublic, invites } }) {

    return {

        async getEntitlements() {

            const isSuperAdmin = user?.superAdmin;
            return {
                createAccount: isSuperAdmin,
                createTeam: isSuperAdmin,
                userAdmin: isSuperAdmin
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

            return await listCollection(teams);
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
                    [userId]: doc(usersPublic, userId)
                }
            };
            await patchById({
                collection: teams,
                id,
                code: "FATM-10",
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

        // USER read
        async getMyUserRecord() {

            return getById(users, user.uid, "FGU-10");

        },

        async getUserRecord({ id }) {

            return getById(users, id, "FGUR-10");

        },

        // USER update
        async updateMyUserRecord({ name, email }) {

            const id = user.uid;
            await this.updateUserRecord({ id, name, email });

        },

        async updateUserRecord({ id, name, email }) {

            if (!(name || email)) return;
            const patch = {};
            if (name) patch.name = name;
            if (email) patch.email = email;
            await patchById({ collection: users, id, code: "FUMUR-10", patch });

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

        // INVITE create
        async inviteTeamMember({ teamId, email, name }) {

            if (!teamId) throw new Error("No team id specified [FITM-11]");
            if (!user.uid) throw new Error("No user id specified [FITM-10]");
            const data = {
                from: doc(usersPublic, user.uid),
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
        async acceptInvitation({ id }) {

            if (!user.uid) throw new Error("No user id specified [FAI-10]");
            const patch = {
                accepted: {
                    who: doc(usersPublic, user.uid),
                    when: serverTimestamp()
                }
            };
            return patchById({
                collection: invites,
                id,
                code: "FAI-10",
                patch
            });

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

    async function listCollection(collection) {
        const snap = await getDocs(collection);
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
