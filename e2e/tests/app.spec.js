import { test, expect } from "../fixtures/index.js";
const { describe, beforeEach } = test;

describe.skip("Create a team", async () => {

  describe("Given I am logged in as an account admin", () => {

    beforeEach(async ({ app }) => { await app.loginAsAccountAdmin(); });

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

describe.skip("Deleting teams", async () => {

  describe("Given I am the account admin of some teams", () => {

    const
      teamName1 = `Team 1 ${Date.now()}-${Math.random().toString().substring(2)}`,
      teamName2 = `Team 2 ${Date.now()}-${Math.random().toString().substring(2)}`,
      teamName3 = `Team 3 ${Date.now()}-${Math.random().toString().substring(2)}`;
    beforeEach(async ({ app }) => {

      await app.loginAsAccountAdmin();
      await app.createATeam({ name: teamName1 });
      await app.createATeam({ name: teamName2 });
      await app.loginAsAccountAdmin2();
      await app.createATeam({ name: teamName3 });

    });

    test("Then I am unable to delete teams I do not administer", async ({ app }) => {

      await app.assertNoDeleteTeamOptionShown({ name: teamName3 });

    });

    describe("When I delete one of my teams", () => {

      beforeEach(async ({ app }) => {

        await app.deleteTeam({ name: teamName2 });

      });

      test("Then the deleted team is no longer shown", async ({ app }) => {

        await app.assertTeamIsNotListed({ name: teamName2 });

      });

    });

  });

});
