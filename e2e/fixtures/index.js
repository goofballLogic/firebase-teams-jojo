import base from "@playwright/test";
import { expect } from "@playwright/test";
export { expect } from "@playwright/test";
import { readFileSync } from "fs";

const firebase = JSON.parse(readFileSync(new URL("../../firebase.json", import.meta.url)).toString());
const hostingPort = firebase.emulators.hosting.port;
const baseURL = `http://localhost:${hostingPort}`;

export const test = base.extend({

    async app({ page }, use) {

        use({

            async loginAsAccountAdmin() {

                await page.goto(new URL("?test-login=BobAccountAdmin", baseURL).href);
                await expect(page.locator("body > nav")).toContainText("Bob Accountadmin");

            },

            async createATeam({ name }) {

                page.on("pageerror", console.log.bind(console));
                await page.click("a", { hasText: "Create a team" });
                await page.getByLabel("Team name").fill(name);
                await page.locator("input[type=submit]", { hasText: "Create" }).click();

            },

            async assertTeamIsListed({ name }) {

                await expect(page.locator("li").getByText(name)).toBeVisible();

            }

        });

    }

});
