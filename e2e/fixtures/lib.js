import { expect } from "@playwright/test";

export async function lib({ page }, use) {

    page.on("console", console.log.bind(console))

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

                async ({ prop, arg }) => await window.__ftj[prop](arg),
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
