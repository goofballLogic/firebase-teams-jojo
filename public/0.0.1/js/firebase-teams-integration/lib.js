import { generateName } from "./nouns.js";

function nonce() {
    return Date.now().toString() + Math.random().toString().substring(1).replace(".", "-");
}
export function getTeams({ user, getDocs, setDoc, doc, deleteDoc, collections: { teams, accounts } }) {

    return {

        async createTeam({ name }) {

            if (!user.account) throw new Error("No account for user [FCT-10]");
            const id = generateName(nonce());
            const accountRef = doc(accounts, user.account);
            const userRef = doc(teams, id);
            const data = { name, account: accountRef };
            try {
                await setDoc(userRef, data);
            } catch (err) {
                throw new Error(`Failed to save team [FCT-20]. ${err}`);
            }
            return id;

        },

        inviteUser() {

        },

        async listTeams() {

            const snap = await getDocs(teams);
            return snap.docs.map(d => ({
                id: d.id,
                data: d.data()
            }));

        },

        async deleteTeam({ id }) {

            if (!id) throw new Error("No id specified [FDT-10]");
            await deleteDoc(doc(teams, id));

        }

    };

}
