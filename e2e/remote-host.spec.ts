import { test, expect } from "@playwright/test";

// Covers DOZZLE_REMOTE_HOST (tcp:// through the socket proxy), a different code path
// than DOZZLE_REMOTE_AGENT. See agent.spec.ts for that one.
test.beforeEach(async ({ page }) => {
  await page.goto("http://remote:8080/");
});

test("has right title", async ({ page }) => {
  await expect(page).toHaveTitle(/.* - Dozzle/);
});

test("shows the labeled remote host", async ({ page }) => {
  // The sidebar's host group, not the dashboard's host column. This setup sees
  // exactly one host, and the table drops that column when there is only one —
  // it would repeat the same word on every row and cost the stat columns the
  // width they need. So the cell this used to assert on cannot exist here.
  // Scoped to the side menu rather than a bare getByText, since the label also
  // appears in the merge link.
  await expect(page.getByTestId("side-menu").getByText("remote-host").first()).toBeVisible();
});

test("select running container", async ({ page }) => {
  await page.getByTestId("side-menu").getByRole("link", { name: "dozzle" }).click();
  await expect(page).toHaveURL(/\/container/);
  await expect(page.getByText("Accepting connections")).toBeVisible();
});
