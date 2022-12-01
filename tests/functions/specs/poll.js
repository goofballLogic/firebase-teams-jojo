// async function findCreatorInTeam(testEnv, creator, team) {
//     let found;
//     await testEnv.withSecurityRulesDisabled(async (context) => {
//         const db = context.firestore();
//         const newAccount = await readTeam(db, { team });
//         const data = newAccount.data();
//         const success = data && data.members && (creator.id in data.teams);
//         if (success) found = data;
//     });
//     return found;
// }
export async function poll(strategy, delay = 250, retries = 10) {

    while (retries > 0) {

        const result = await strategy();
        if (result !== undefined)
            return result;
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;

    }

}
