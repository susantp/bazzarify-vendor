import { chromium, type Page } from "playwright";

type CliOptions = {
  persona: string;
  visitPath: string;
  expectPath?: string;
  authMode: "cookie" | "ui";
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

const baseUrl = process.env.VENDOR_BASE_URL ?? "http://127.0.0.1:3001";
const verificationPassword = "H@nds0me1522";
const personas: Record<string, PersonaDefinition> = {
  vendor_no_store: {
    credential: "techbizznepal@gmail.com",
    password: verificationPassword,
  },
  vendor_with_store_no_categories: {
    credential: "vendor.store.nocategories@bazarify.local",
    password: verificationPassword,
  },
  vendor_with_store_with_categories: {
    credential: "vendor.store.categories@bazarify.local",
    password: verificationPassword,
  },
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    persona: "vendor_no_store",
    visitPath: "/products/create",
    expectPath: "/store-required",
    authMode: "cookie",
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
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const runProcess = promisify(execFile);
  const { stdout } = await runProcess(
    "bun",
    ["scripts/vendor-auth-session.ts", "--persona", persona],
    {
      cwd: process.cwd(),
      env: process.env,
    },
  );

  const payload = JSON.parse(stdout) as SessionPayload;
  if (!payload.authenticated || !payload.sessionCookie) {
    throw new Error(
      `Unable to create browser session for persona: ${persona}.`,
    );
  }

  return payload.sessionCookie;
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
  const options = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
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

    if (options.expectPath) {
      await page.waitForURL((url) => url.pathname === options.expectPath, {
        timeout: 15_000,
      });
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
          authMode: options.authMode,
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
  process.exit(1);
});
