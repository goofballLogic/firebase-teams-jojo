import { expect } from "@playwright/test";

import { readFileSync } from "fs";

const firebase = JSON.parse(readFileSync(new URL("../../firebase.json", import.meta.url)).toString());
const hostingPort = firebase.emulators.hosting.port;
export const baseURL = `http://localhost:${hostingPort}`;

export function app({ page }, use) {

    page.on("pageerror", console.log.bind(console));
    page.on("console", console.log.bind(console));
    use({

        async loginAsSuperAdmin() {

            await page.goto(new URL("?test-login=SueSuperAdmin", baseURL).href);
            await expect(page.locator("body > nav")).toContainText("Sue Superadmin");

        },

        async loginAsAccountAdmin() {

            await page.goto(new URL("?test-login=BobAccountAdmin", baseURL).href);
            await expect(page.locator("body > nav")).toContainText("Bob Accountadmin");

        },

        async loginAsAccountAdmin2() {

            await page.goto(new URL("?test-login=SueAccountAdmin", baseURL).href);
            await expect(page.locator("body > nav")).toContainText("Sue Accountadmin");

        },


        async createATeam({ name }) {

            await page.click("a", { hasText: "Create a team" });
            await page.getByLabel("Team name").fill(name);
            await page.locator("input[type=submit]", { hasText: "Create" }).click();

        },

        async deleteTeam({ name }) {

            await page.locator("a", { hasText: name }).click();
            await page.getByRole("button", "Delete").click();

        },

        async assertTeamIsListed({ name }) {

            await expect(page.locator("li").getByText(name)).toBeVisible();

        }
    });
}
