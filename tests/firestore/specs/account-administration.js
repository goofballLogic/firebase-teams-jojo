import { assertFails } from "@firebase/rules-unit-testing";
import { createAccount, makeAccountAdmin, createUserPublic } from "../../actions/commands.js";
import { listAccounts } from "../../actions/queries.js";

export function accountAdministrationSpec(testEnv) {

    describe("A logged in account admin should be able to list accounts they administer", () => {

        let adminUser, otherUser, account1, account2, account3;
        beforeEach(async () => {

            await testEnv.withSecurityRulesDisabled(async (context) => {

                const db = context.firestore();

                adminUser = await createUserPublic(db, { name: "Clark Kent", email: "clark@gmail.com" });
                otherUser = await createUserPublic(db, { name: "Joe Bloggs", email: "joe@gmail.com" });

                account1 = await createAccount(db, { name: "Account 1" });
                account2 = await createAccount(db, { name: "Account 2" });
                account3 = await createAccount(db, { name: "Account 3" });

                await makeAccountAdmin(db, { userPublic: adminUser, account: account1 });
                await makeAccountAdmin(db, { userPublic: adminUser, account: account2 });

            });

        });

        it("DENY for other user", async () => {

            const dbAsOtherUser = testEnv.authenticatedContext(otherUser.id).firestore();
            await assertFails(
                listAccounts(dbAsOtherUser, { userPublic: adminUser })
            );

        });

        it("ALLOW only the accounts they administer", async () => {

            const dbAsAdmin = testEnv.authenticatedContext(adminUser.id).firestore();
            const found = await listAccounts(dbAsAdmin, { userPublic: adminUser });
            const foundData = found.docs.map(d => d.id);
            expect(foundData).toContainEqual(account1.id);
            expect(foundData).toContainEqual(account2.id);
            expect(foundData).not.toContainEqual(account3.id);

        })

    });

}
