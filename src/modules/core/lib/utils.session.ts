"use server";

import { jwtVerify, SignJWT } from "jose";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";

interface IDeleteSession {
  actionBeforeDeleteCookieCallback:
    | ((store: ReadonlyRequestCookies) => Promise<void>)
    | undefined;
}
const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export const getCookieStore = async () => cookies();
async function getSessionCookieEncrypted(
  cookieStore: ReadonlyRequestCookies | undefined,
) {
  if (!cookieStore) return null;
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return session;
}

export async function getSessionDecrypted(
  cookieStore: ReadonlyRequestCookies | undefined,
) {
  if (!cookieStore) return null;
  const sessionCookie = await getSessionCookieEncrypted(cookieStore);
  if (!sessionCookie) return null;
  const payload = await decrypt(sessionCookie);
  if (!payload) return null;
  return payload;
}
export async function getSelectedTenantUuid(): Promise<string | null> {
  const payload = await getSessionDecrypted(await getCookieStore());
  const selectedTenantUuid = payload?.selectedTenantUuid;

  return typeof selectedTenantUuid === "string" ? selectedTenantUuid : null;
}

export async function createAuthCookieSession({
  token,
  userUUID,
  selectedTenantUuid = null,
}: {
  token: string;
  userUUID: string | null;
  selectedTenantUuid?: string | null;
}): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await new SignJWT({
      token,
      userUUID,
      selectedTenantUuid,
      expiresAt,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(encodedKey);
    const cookieStore = await cookies();

    cookieStore.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      sameSite: "strict",
      path: "/",
    });
  } catch (error) {
    console.log("cookie storing error: ", error);
    throw error;
  }
}

export async function setSelectedTenantUuid(
  selectedTenantUuid: string | null,
): Promise<void> {
  const payload = await getSessionDecrypted(await getCookieStore());
  if (
    !payload ||
    typeof payload.token !== "string" ||
    typeof payload.userUUID !== "string"
  ) {
    throw new Error("An authenticated session is required to select a tenant.");
  }

  await createAuthCookieSession({
    token: payload.token,
    userUUID: payload.userUUID,
    selectedTenantUuid,
  });
}

export async function deleteSession({
  actionBeforeDeleteCookieCallback,
}: IDeleteSession): Promise<void> {
  const cookieStore = await getCookieStore();
  try {
    // Attempt to execute some task before deleting cookie
    if (actionBeforeDeleteCookieCallback !== undefined) {
      await actionBeforeDeleteCookieCallback(cookieStore);
    }
    // Attempt standard deletion first (no domain)
    cookieStore.delete("session");

    // Force expire for robustness (no domain)
    cookieStore.set("session", "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    // Ensure removal even if delete throws in certain runtimes
    cookieStore.set("session", "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error: unknown) {
    console.error("Failed to verify session", error);
  }
}
