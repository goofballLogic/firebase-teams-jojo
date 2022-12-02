import { test, expect } from "../fixtures/index.js";
const { describe, beforeEach } = test;

beforeEach(async ({ app }) => {

  await app.loginAsBob();

});

describe("Something", async () => {

  test("Something", async ({ page }) => {

    throw new Error("Not implemented");

  });

});
