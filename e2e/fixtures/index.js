import base from "@playwright/test";
export { expect } from "@playwright/test";
import { app } from "./app.js";
import { lib } from "./lib.js";


export const test = base.extend({

    app,
    lib

});


