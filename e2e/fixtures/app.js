import { expect } from "@playwright/test";

import { readFileSync } from "fs";

const firebase = JSON.parse(readFileSync(new URL("../../firebase.json", import.meta.url)).toString());
const hostingPort = firebase.emulators.hosting.port;
export const baseURL = `http://localhost:${hostingPort}`;

export function app({ page }, use) {

    page.on("pageerror", console.error.bind(console));


    use({

        async loginWithEmail(email) {

            await page.goto(new URL(`?test-login=${encodeURIComponent(email)}`, baseURL).href);
            await expect(page.locator("body > nav")).toContainText(email);

        },

        async loginWithEmailAndAccount(email, accountId) {

            await page.goto(new URL(`?test-login=${encodeURIComponent(email)}&test-account=${encodeURIComponent(accountId)}`, baseURL).href);
            await expect(page.locator("body > nav")).toContainText(email);

        }

    });

}
