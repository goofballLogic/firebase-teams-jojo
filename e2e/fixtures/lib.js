import { expect } from "@playwright/test";

export async function lib({ page }, use) {

    const teardowns = [];

    const local = {

        teardown(strategy) {
            teardowns.push(strategy);
        }

    };

    const remoting = {

        get(target, prop) {

            // if we implemented it here, use our local version
            if (prop in target)
                return target[prop];

            // otherwise evaluate it in the context of our (test) page
            return arg => page.evaluate(

                async ({ prop, arg }) => {

                    try {

                        return await window.__ftj[prop](arg);

                    } catch (err) {

                        throw new Error(`${prop}: ${err}`);

                    }
                },
                { prop, arg }

            );

        }

    };

    // proxy will forward unknown calls to the client-side library for processing
    const fixture = new Proxy(local, remoting);

    // use the fixture
    await use(fixture);

    // now complete any teardowns
    while (teardowns.length) {
        const teardown = teardowns.pop();
        try {
            await teardown();
        } catch (err) {
            console.error(teardown.toString());
            throw err;
        }
    }

}
