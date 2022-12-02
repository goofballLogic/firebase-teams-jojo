import { test, expect } from "../fixtures/index.js";
const { describe, beforeEach } = test;

describe("Create a team", async () => {

  describe("Given I am logged in as an account admin", () => {

    beforeEach(async ({ app }) => {

      await app.loginAsAccountAdmin();

    });

    describe("When I create a team", () => {

      beforeEach(async ({ app }) => {

        await app.createATeam({ name: "Team 1" });

      });

      test("Then the team is shown in my list of teams", async ({ app }) => {

        await app.assertTeamIsListed("Team 1");

      });

    });

  });

});
