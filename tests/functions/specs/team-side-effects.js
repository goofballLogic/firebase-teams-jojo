import { createAccount, createTeam, reassignTeamToAccount } from "../../actions/commands";
import { readAccount } from "../../actions/queries";

export function teamSideEffects(testEnv) {

    describe("An record of teams is maintained in the account object", () => {

        let account;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();
                account = await createAccount(db, { name: "Account 1" });

            });

        });

        describe("When a team is created", () => {

            let team;
            beforeEach(async () => {

                await testEnv.withSecurityRulesDisabled(async (context) => {

                    const db = context.firestore();
                    team = await createTeam(db, { name: "Team 1", account });

                });

            });

            it("Then the account is updated with a link to the team", async () => {

                const accountData = await poll(() => findTeamInAccount(testEnv, account, team));
                expect(accountData?.teams).toHaveProperty(team.id);

            });

            describe("But the team is moved to another account", () => {

                let account2;
                beforeEach(async () => {

                    // wait for it to register in the first account
                    await poll(() => findTeamInAccount(testEnv, account, team));
                    // now reassign it
                    await testEnv.withSecurityRulesDisabled(async (context) => {

                        const db = context.firestore();
                        account2 = await createAccount(db, { name: "Account 2", account });
                        await reassignTeamToAccount(db, { team, account: account2 });

                    });

                });

                it("Then the old account no longer has a link to the team", async () => {

                    const accountData = await poll(() => findTeamNOTInAccount(testEnv, account, team));
                    expect(accountData?.teams).not.toHaveProperty(team.id);

                });

                it("Then the new account has the link to the team", async () => {

                    const accountData = await poll(() => findTeamInAccount(testEnv, account2, team));
                    expect(accountData?.teams).toHaveProperty(team.id);

                })

            });

        });

    });

}

async function findTeamInAccount(testEnv, account, team) {

    let found;
    await testEnv.withSecurityRulesDisabled(async (context) => {

        const db = context.firestore();
        const newAccount = await readAccount(db, { account });
        const data = newAccount.data();
        const success = data && data.teams && (team.id in data.teams);
        if (success) found = data;

    });
    return found;

}

async function findTeamNOTInAccount(testEnv, account, team) {

    let found;
    await testEnv.withSecurityRulesDisabled(async (context) => {

        const db = context.firestore();
        const newAccount = await readAccount(db, { account });
        const data = newAccount.data();
        const success = !(data && data.teams && (team.id in data.teams));
        if (success) found = data;

    });
    return found;

}

async function poll(strategy, delay = 250, retries = 10) {
    while (retries > 0) {
        const result = await strategy();
        if (result !== undefined) return result;
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
    }
}
