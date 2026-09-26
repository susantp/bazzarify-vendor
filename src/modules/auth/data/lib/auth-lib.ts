import {
  SessionUserSchema,
  TSessionUser,
} from "@/modules/auth/domain/schemas/UserSchema";
import SessionUserPayloadSchema from "@/modules/auth/domain/schemas/payloads/SessionUserPayloadSchema";
import {
  deleteRedisValue,
  getRedisValue,
  setRedisValue,
} from "@/modules/core/domain/actions/actionRedis";
import {
  getSelectedTenantUuid,
  getSessionDecrypted,
} from "@/modules/core/lib/utils.session";
import { IApiMetaData } from "@/modules/core/schemas/response";
import { fetchAuthDataAndValidate } from "@/modules/core/utils/fetchAuthDataAndValidate";
import { handleError } from "@/modules/core/utils/jsonResponse.utils";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export async function getSessionToken(
  store: ReadonlyRequestCookies,
): Promise<string | null> {
  const jwtPayload = await getSessionDecrypted(store);
  if (jwtPayload === null) {
    console.log("no jwt payload getSessionToken: ", jwtPayload);
    return null;
  }
  if (!("token" in jwtPayload)) {
    console.log("no token in jwt payload: ", jwtPayload.token);
    return null;
  }
  return jwtPayload.token as string;
}
export async function getSessionUserUUID(
  store: ReadonlyRequestCookies,
): Promise<string | null> {
  const jwtPayload = await getSessionDecrypted(store);

  if (jwtPayload === null) {
    console.log("no jwt payload getSessionUserUUID: ", jwtPayload);
    return null;
  }
  if (!("userUUID" in jwtPayload)) {
    console.log("no token in jwt payload: ", jwtPayload.token);
    return null;
  }
  return jwtPayload.userUUID as string;
}
export async function getAuthUser(
  token: string,
): Promise<TSessionUser | IApiMetaData> {
  try {
    const cachedValue = await getRedisValue(token);
    const parsedUser = SessionUserSchema.safeParse(cachedValue);
    const user = parsedUser.success
      ? parsedUser.data
      : (
          await fetchAuthDataAndValidate(
            { module: "vendor", path: "auth/vendor/user" },
            SessionUserPayloadSchema,
            "Unable to refresh the vendor session.",
          )
        ).user;

    if (!parsedUser.success) {
      await setRedisValue(token, JSON.stringify(user));
    }

    const selectedTenantUuid = await getSelectedTenantUuid();
    const workspace = user.tenants.find(
      (tenant) => tenant.uuid === selectedTenantUuid,
    );

    return {
      ...user,
      current_tenant_uuid: workspace?.uuid ?? null,
      roles: (workspace?.roles ?? user.platform_roles).map((name) => ({
        name,
      })),
      authorized_stores: workspace?.authorized_stores ?? [],
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function setAuthUser(token: string, user: TSessionUser) {
  try {
    await setRedisValue(token, JSON.stringify(user));
  } catch (error) {
    return handleError(error);
  }
}

/**
 * This method removes redis data associated with auth token
 * @param store
 */
export async function actionRemoveTokenFromCallback(
  store: ReadonlyRequestCookies,
) {
  if (!store) {
    console.log("no store while deleting: ");
    return;
  }
  const userUUID = await getSessionUserUUID(store);
  if (!userUUID) {
    console.log("no userUUID while deleting: ");
    return;
  }
  console.log("actionBeforeDeleteCookieCallback:", userUUID);
  await deleteRedisValue(userUUID);
}
