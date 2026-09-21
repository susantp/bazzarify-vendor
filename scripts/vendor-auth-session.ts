import axios from "axios";
import { SignJWT } from "jose";
import { writeFile } from "node:fs/promises";

type RemoteMeta = {
  error?: unknown;
  errorCode?: unknown;
};

type LoginEnvelope = {
  data?: {
    message?: string;
    payload?: {
      token?: string;
    } | null;
  };
  metaData?: RemoteMeta;
};

type VendorUserEnvelope = {
  data?: {
    message?: string;
    payload?: {
      user?: {
        uuid?: string;
        roles?: Array<{ name?: string }>;
        store?: {
          uuid?: string | null;
          store_type_uuid?: string | null;
        } | null;
      };
    } | null;
  };
  metaData?: RemoteMeta;
};

type CliOptions = {
  persona?: string;
  credential?: string;
  password?: string;
  useDevDefaults: boolean;
  writeHeaderPath?: string;
  writeCookiePath?: string;
};

type PersonaDefinition = {
  credential: string;
  password: string;
};

const VERIFICATION_PASSWORD = "H@nds0me1522";
const VERIFICATION_HEADER_NAME = "X-Bazarify-Verification";
const VERIFICATION_HEADER_VALUE = "vendor-auth";
const PERSONAS: Record<string, PersonaDefinition> = {
  vendor_admin: {
    credential: "techbizznepal@gmail.com",
    password: VERIFICATION_PASSWORD,
  },
  vendor_no_store: {
    credential: "vendor.no-store@bazarify.local",
    password: VERIFICATION_PASSWORD,
  },
  vendor_incomplete: {
    credential: "vendor.store.nocategories@bazarify.local",
    password: VERIFICATION_PASSWORD,
  },
  vendor_ready: {
    credential: "vendor.store.categories@bazarify.local",
    password: VERIFICATION_PASSWORD,
  },
  vendor_multi_category: {
    credential: "vendor.store.multiple-categories@bazarify.local",
    password: VERIFICATION_PASSWORD,
  },
  vendor_with_store_no_categories: {
    credential: "vendor.store.nocategories@bazarify.local",
    password: VERIFICATION_PASSWORD,
  },
  vendor_with_store_with_categories: {
    credential: "vendor.store.multiple-categories@bazarify.local",
    password: VERIFICATION_PASSWORD,
  },
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    useDevDefaults: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--dev") {
      options.useDevDefaults = true;
      continue;
    }

    if (current === "--persona" && next) {
      options.persona = next;
      index += 1;
      continue;
    }

    if (current === "--credential" && next) {
      options.credential = next;
      index += 1;
      continue;
    }

    if (current === "--password" && next) {
      options.password = next;
      index += 1;
      continue;
    }

    if (current === "--write-header" && next) {
      options.writeHeaderPath = next;
      index += 1;
      continue;
    }

    if (current === "--write-cookie" && next) {
      options.writeCookiePath = next;
      index += 1;
      continue;
    }
  }

  return options;
}

function flattenMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((entry) => flattenMessage(entry))
      .filter((entry): entry is string => Boolean(entry))
      .join(", ");
    return joined.length > 0 ? joined : null;
  }

  if (typeof value === "object" && value !== null) {
    const joined = Object.values(value)
      .map((entry) => flattenMessage(entry))
      .filter((entry): entry is string => Boolean(entry))
      .join(", ");
    return joined.length > 0 ? joined : null;
  }

  return null;
}

async function writeOptionalArtifact(
  path: string | undefined,
  content: string,
) {
  if (!path) {
    return;
  }

  await writeFile(path, content, "utf8");
}

async function createSessionCookie({
  token,
  userUUID,
  sessionSecret,
}: {
  token: string;
  userUUID: string;
  sessionSecret: string;
}) {
  const encodedKey = new TextEncoder().encode(sessionSecret);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return new SignJWT({
    token,
    userUUID,
    expiresAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const apiUrl = readRequiredEnv("API_URL");
  const appKey = readRequiredEnv("APP_KEY");
  const sessionSecret = readRequiredEnv("SESSION_SECRET");

  if (options.persona && !PERSONAS[options.persona]) {
    throw new Error(
      [
        `Unknown persona: ${options.persona}.`,
        `Supported personas: ${Object.keys(PERSONAS).join(", ")}.`,
      ].join(" "),
    );
  }

  const persona = options.persona
    ? PERSONAS[options.persona]
    : options.useDevDefaults
      ? PERSONAS.vendor_no_store
      : null;

  const credential = persona?.credential ?? options.credential;
  const password = persona?.password ?? options.password;

  if (!credential || !password) {
    throw new Error(
      "Provide --persona <alias>, --dev, or both --credential <value> and --password <value>.",
    );
  }

  const axiosInstance = axios.create({
    baseURL: apiUrl,
    headers: {
      "User-Agent": "BazzarifyVendor",
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-APP-Key": appKey,
      [VERIFICATION_HEADER_NAME]: VERIFICATION_HEADER_VALUE,
    },
    validateStatus: (status) => status < 500,
  });

  const loginResponse = await axiosInstance.post<LoginEnvelope>(
    "/auth/vendor/login/credentials",
    {
      credential,
      password,
    },
  );

  const loginError = flattenMessage(loginResponse.data.metaData?.error);
  if (loginError) {
    throw new Error(`Vendor login failed: ${loginError}`);
  }

  const token = loginResponse.data.data?.payload?.token;
  if (!token) {
    throw new Error("Vendor login succeeded without returning a token.");
  }

  const userResponse = await axiosInstance.get<VendorUserEnvelope>(
    "/auth/vendor/user",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const userError = flattenMessage(userResponse.data.metaData?.error);
  if (userError) {
    throw new Error(`Vendor user fetch failed: ${userError}`);
  }

  const user = userResponse.data.data?.payload?.user;
  const userUUID = user?.uuid;
  if (!userUUID) {
    throw new Error("Vendor user fetch did not return a user UUID.");
  }

  const sessionCookie = await createSessionCookie({
    token,
    userUUID,
    sessionSecret,
  });

  const cookieHeader = `Cookie: session=${sessionCookie}`;

  await writeOptionalArtifact(options.writeCookiePath, sessionCookie);
  await writeOptionalArtifact(options.writeHeaderPath, cookieHeader);

  console.log(
    JSON.stringify(
      {
        authenticated: true,
        persona:
          options.persona ??
          (options.useDevDefaults ? "vendor_no_store" : null),
        credential,
        userUUID,
        roles: user?.roles?.map((role) => role.name).filter(Boolean) ?? [],
        hasStore: Boolean(user?.store?.uuid),
        storeUUID: user?.store?.uuid ?? null,
        storeTypeUUID: user?.store?.store_type_uuid ?? null,
        sessionCookie,
        cookieHeader,
        wroteCookiePath: options.writeCookiePath ?? null,
        wroteHeaderPath: options.writeHeaderPath ?? null,
      },
      null,
      2,
    ),
  );
}

await main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
