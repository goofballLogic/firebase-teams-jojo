import base from "@playwright/test";
export { expect } from "@playwright/test";
import { readFileSync } from "fs";

const firebase = JSON.parse(readFileSync(new URL("../../firebase.json", import.meta.url)).toString());
const hostingPort = firebase.emulators.hosting.port;
const baseURL = `http://localhost:${hostingPort}`;

export const test = base.extend({

    async app({ page }, use) {

        use({

            async loginAsBob() {

                await page.goto(new URL("?testuser=Bob", baseURL).href);

            }

        });

    }

});
