import { test, expect } from "../fixtures/index.js";
const { describe, beforeEach } = test;

describe("Create a team", async () => {

  describe("Given I am logged in as an account admin", () => {

    beforeEach(async ({ app }) => {

      await app.loginAsAccountAdmin();

    });

    describe("When I create a team", () => {

      let name;
      beforeEach(async ({ app }) => {

        name = `Team 1 ${Date.now()}-${Math.random().toString().substring(2)}`;
        await app.createATeam({ name });

      });

      test("Then the team is shown in my list of teams", async ({ app }) => {

        await app.assertTeamIsListed({ name });

      });

    });

  });

});
