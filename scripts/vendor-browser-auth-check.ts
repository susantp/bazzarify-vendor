import { chromium, type Page } from "playwright";

type CliOptions = {
  persona: string;
  visitPath: string;
  expectPath?: string;
  authMode: "cookie" | "ui";
  expectCategories: string[];
  expectText: string[];
  workflow?: "tenant-admin" | "dual-member" | "vendor" | "platform";
};

type SessionPayload = {
  authenticated: boolean;
  persona: string | null;
  sessionCookie: string;
};

type PersonaDefinition = {
  credential: string;
  password: string;
};

const baseUrl = Bun.env.VENDOR_BASE_URL ?? "http://localhost:3001";
const verificationPassword = "H@nds0me1522";
const personas: Record<string, PersonaDefinition> = {
  vendor_admin: {
    credential: "techbizznepal@gmail.com",
    password: verificationPassword,
  },
  vendor_no_store: {
    credential: "vendor.no-store@bazarify.local",
    password: verificationPassword,
  },
  vendor_incomplete: {
    credential: "vendor.store.nocategories@bazarify.local",
    password: verificationPassword,
  },
  vendor_ready: {
    credential: "vendor.store.categories@bazarify.local",
    password: verificationPassword,
  },
  vendor_multi_category: {
    credential: "vendor.store.multiple-categories@bazarify.local",
    password: verificationPassword,
  },
  vendor_with_store_no_categories: {
    credential: "vendor.store.nocategories@bazarify.local",
    password: verificationPassword,
  },
  vendor_with_store_with_categories: {
    credential: "vendor.store.multiple-categories@bazarify.local",
    password: verificationPassword,
  },
  tenant_admin_multi_store: {
    credential: "qa-tenant-admin@bazarify.local",
    password: verificationPassword,
  },
  tenant_dual_member: {
    credential: "qa-dual-member@bazarify.local",
    password: verificationPassword,
  },
  tenant_vendor_single_store: {
    credential: "qa-vendor-alpha@bazarify.local",
    password: verificationPassword,
  },
  platform_super_admin: {
    credential: "qa-platform-admin@bazarify.local",
    password: verificationPassword,
  },
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    persona: "vendor_no_store",
    visitPath: "/products/create",
    expectPath: undefined,
    authMode: "cookie",
    expectCategories: [],
    expectText: [],
    workflow: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--persona" && next) {
      options.persona = next;
      index += 1;
      continue;
    }

    if (current === "--visit" && next) {
      options.visitPath = next;
      index += 1;
      continue;
    }

    if (current === "--expect-path" && next) {
      options.expectPath = next;
      index += 1;
      continue;
    }

    if (current === "--no-expect-path") {
      options.expectPath = undefined;
    }

    if (current === "--expect-categories" && next) {
      options.expectCategories = next
        .split(",")
        .map((category) => category.trim())
        .filter((category) => category.length > 0);
      index += 1;
    }

    if (current === "--expect-text" && next) {
      options.expectText.push(next);
      index += 1;
    }

    if (
      current === "--workflow" &&
      next &&
      ["tenant-admin", "dual-member", "vendor", "platform"].includes(next)
    ) {
      options.workflow = next as CliOptions["workflow"];
      options.visitPath =
        next === "tenant-admin" || next === "dual-member" ? "/workspace" : "/";
      index += 1;
      continue;
    }

    if (
      current === "--auth-mode" &&
      next &&
      (next === "cookie" || next === "ui")
    ) {
      options.authMode = next;
      index += 1;
      continue;
    }
  }

  return options;
}

async function createAuthenticatedBrowserSession(persona: string) {
  const authSession = Bun.spawn(
    ["bun", "scripts/vendor-auth-session.ts", "--persona", persona],
    {
      cwd: Bun.cwd,
      env: Bun.env,
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(authSession.stdout).text(),
    new Response(authSession.stderr).text(),
    authSession.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(
      stderr.trim() || "Bun could not create the browser session.",
    );
  }

  const payload = JSON.parse(stdout) as SessionPayload;
  if (!payload.authenticated || !payload.sessionCookie) {
    throw new Error(
      `Unable to create browser session for persona: ${persona}.`,
    );
  }

  return payload.sessionCookie;
}

async function assertVisibleText(page: Page, text: string, expected: boolean) {
  const matchingText = page.getByText(text, { exact: true });
  const matchCount = await matchingText.count();
  let visible = false;

  for (let index = 0; index < matchCount && !visible; index += 1) {
    visible = await matchingText
      .nth(index)
      .isVisible()
      .catch(() => false);
  }

  if (visible !== expected) {
    const pageText = expected ? await page.locator("body").innerText() : "";
    throw new Error(
      expected
        ? `Expected browser text is not visible: ${text}. Page text: ${pageText.slice(0, 1200)}`
        : `Unexpected browser text is visible: ${text}`,
    );
  }
}

async function waitForVisibleText(page: Page, text: string) {
  const matchingText = page.getByText(text, { exact: true });
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const matchCount = await matchingText.count();
    for (let index = 0; index < matchCount; index += 1) {
      if (
        await matchingText
          .nth(index)
          .isVisible()
          .catch(() => false)
      ) {
        return;
      }
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Browser text did not become visible: ${text}`);
}

async function openWorkspace(page: Page, tenantName: string) {
  const workspaceForm = page.locator("form").filter({ hasText: tenantName });

  if ((await workspaceForm.count()) === 0) {
    const pageText = await page.locator("body").innerText();
    throw new Error(
      `Workspace card is not visible for ${tenantName}. Page text: ${pageText.slice(0, 1200)}`,
    );
  }

  await workspaceForm.getByRole("button", { name: "Open workspace" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}

async function switchWorkspace(
  page: Page,
  tenantName: string,
  expectedStoreName: string,
) {
  const selector = page.getByRole("combobox", { name: "Workspace" });
  const workspaceForm = page.locator("form").filter({ has: selector });
  const switchButton = workspaceForm.getByRole("button", {
    name: "Switch workspace",
  });
  const switchButtonBounds = await switchButton.boundingBox();
  const viewport = page.viewportSize();
  const switchButtonInViewport = Boolean(
    switchButtonBounds &&
    viewport &&
    switchButtonBounds.x + switchButtonBounds.width > 0 &&
    switchButtonBounds.y + switchButtonBounds.height > 0 &&
    switchButtonBounds.x < viewport.width &&
    switchButtonBounds.y < viewport.height,
  );

  if (!switchButtonInViewport) {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  }

  const labels = await selector.locator("option").allTextContents();
  const matchingLabel = labels
    .map((label) => label.trim())
    .find((label) => label.startsWith(`${tenantName} (`));

  if (!matchingLabel) {
    throw new Error(`Workspace option is not available: ${tenantName}`);
  }

  const selectedOption = selector
    .locator("option", { hasText: tenantName })
    .first();
  const expectedTenantUuid = await selectedOption.getAttribute("value");
  const actionPath = new URL(page.url()).pathname;
  const actionResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === actionPath,
    { timeout: 15_000 },
  );

  await selector.selectOption({ label: matchingLabel });
  await switchButton.click();
  const response = await actionResponse;
  if (!response.ok()) {
    throw new Error(`Workspace switch returned HTTP ${response.status()}.`);
  }

  await waitForVisibleText(page, expectedStoreName);

  if ((await selector.inputValue()) !== expectedTenantUuid) {
    const pageText = await page.locator("body").innerText();
    throw new Error(
      `Workspace switch did not select ${tenantName}. Page text: ${pageText.slice(0, 1200)}`,
    );
  }

  await page.reload({ waitUntil: "networkidle" });
  await waitForVisibleText(page, expectedStoreName);

  if ((await selector.inputValue()) !== expectedTenantUuid) {
    throw new Error(`Workspace selection did not persist: ${tenantName}`);
  }
}

async function verifyWorkflow(page: Page, workflow: CliOptions["workflow"]) {
  const tenantAlpha = "QA Tenant Alpha";
  const tenantBeta = "QA Tenant Beta";
  const alphaStoreOne = "QA Alpha Store One";
  const alphaStoreTwo = "QA Alpha Store Two";
  const betaStoreOne = "QA Beta Store One";

  if (workflow === "tenant-admin") {
    await openWorkspace(page, tenantAlpha);
    await assertVisibleText(page, alphaStoreOne, true);
    await assertVisibleText(page, alphaStoreTwo, true);
    await assertVisibleText(page, betaStoreOne, false);
    return;
  }

  if (workflow === "dual-member") {
    await assertVisibleText(page, tenantAlpha, true);
    await assertVisibleText(page, tenantBeta, true);
    await page.getByText("operator", { exact: false }).first().waitFor();
    await page.getByText("sales manager", { exact: false }).first().waitFor();

    await openWorkspace(page, tenantAlpha);
    await assertVisibleText(page, alphaStoreOne, true);
    await assertVisibleText(page, alphaStoreTwo, false);
    await assertVisibleText(page, betaStoreOne, false);

    await switchWorkspace(page, tenantBeta, betaStoreOne);
    await assertVisibleText(page, betaStoreOne, true);
    await assertVisibleText(page, alphaStoreOne, false);
    await assertVisibleText(page, alphaStoreTwo, false);

    await switchWorkspace(page, tenantAlpha, alphaStoreOne);
    await assertVisibleText(page, alphaStoreOne, true);
    await assertVisibleText(page, alphaStoreTwo, false);
    await assertVisibleText(page, betaStoreOne, false);
    return;
  }

  if (workflow === "vendor") {
    await assertVisibleText(page, alphaStoreOne, true);
    await assertVisibleText(page, alphaStoreTwo, false);
    await assertVisibleText(page, betaStoreOne, false);
    return;
  }

  if (workflow === "platform") {
    await assertVisibleText(page, "Platform overview", true);
    await assertVisibleText(page, "Tenant status", true);
    await assertVisibleText(page, "Top stores", true);
  }
}

async function loginThroughUi(page: Page, persona: string) {
  if (!personas[persona]) {
    throw new Error(`Unknown UI-login persona: ${persona}.`);
  }

  const response = await page.goto(
    `${baseUrl}/api/dev/vendor-auth/bootstrap?persona=${persona}`,
    {
      waitUntil: "networkidle",
    },
  );

  if (!response?.ok()) {
    throw new Error(
      `Vendor auth bootstrap failed with status ${response?.status() ?? "unknown"}.`,
    );
  }
}

async function main() {
  const options = parseArgs(Bun.argv.slice(2));
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      Bun.env.PLAYWRIGHT_EXECUTABLE_PATH ?? chromium.executablePath(),
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    if (options.authMode === "ui") {
      await loginThroughUi(page, options.persona);
    } else {
      const sessionCookie = await createAuthenticatedBrowserSession(
        options.persona,
      );

      await context.addCookies([
        {
          name: "session",
          value: sessionCookie,
          url: baseUrl,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
    }

    await page.goto(`${baseUrl}${options.visitPath}`, {
      waitUntil: "networkidle",
    });

    const essentialCookieButton = page.getByRole("button", {
      name: "Essential only",
      exact: true,
    });
    if (await essentialCookieButton.isVisible().catch(() => false)) {
      await essentialCookieButton.click();
    }

    if (options.expectPath) {
      await page.waitForURL((url) => url.pathname === options.expectPath, {
        timeout: 15_000,
      });
    }

    if (options.expectCategories.length > 0) {
      await page.getByText("Select a Category", { exact: true }).click();
      await page.getByText("Verification Root", { exact: true }).click();

      for (const category of options.expectCategories) {
        const categoryLocator = page.getByText(category, { exact: true });
        if (!(await categoryLocator.isVisible())) {
          throw new Error(
            `Expected authorized category is not visible: ${category}`,
          );
        }
      }
    }

    if (options.workflow) {
      await verifyWorkflow(page, options.workflow);
    }

    for (const expectedText of options.expectText) {
      const textLocator = page.getByText(expectedText, { exact: false });
      if (!(await textLocator.isVisible())) {
        throw new Error(
          `Expected browser text is not visible: ${expectedText}`,
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          verified: true,
          baseUrl,
          persona: options.persona,
          finalPathname: new URL(page.url()).pathname,
          visitedPath: options.visitPath,
          expectedPath: options.expectPath ?? null,
          expectedCategories: options.expectCategories,
          expectedText: options.expectText,
          authMode: options.authMode,
          workflow: options.workflow ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    await context.close();
    await browser.close();
  }
}

await main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  throw error;
});
