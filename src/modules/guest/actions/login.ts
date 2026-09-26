"use server";

import {
  actionRemoveTokenFromCallback,
  setAuthUser,
} from "@/modules/auth/data/lib/auth-lib";
import { actionGetUser } from "@/modules/auth/domain/auth-actions";
import { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";
import { getInitialTenantUuid } from "@/modules/auth/domain/workspace";
import { defaultAxiosInstance } from "@/modules/core/lib/utils.axios";
import { extractRemoteErrorFeedback } from "@/modules/core/lib/utils.feedback";
import { handleRemoteError } from "@/modules/core/lib/utils.index";
import {
  createAuthCookieSession,
  deleteSession,
} from "@/modules/core/lib/utils.session";
import { AUTH_ROUTES } from "@/modules/guest/config/routes";
import { LoginFormValues } from "@/modules/guest/config/schemas/login.form";
import { AxiosResponse } from "axios";

type AuthSuccessResponse = {
  data?: {
    message?: string;
    payload?: {
      token?: string;
    };
  };
};

export const actionLogin = async (data: LoginFormValues) => {
  let apiResponse: AxiosResponse<unknown>;
  try {
    apiResponse = await defaultAxiosInstance.post(
      AUTH_ROUTES.login.loginCredentials.path,
      data,
    );
    const remoteError = extractRemoteErrorFeedback(apiResponse.data);
    if (remoteError) {
      return handleRemoteError(apiResponse.data);
    }
    const authResponse = apiResponse.data as AuthSuccessResponse;
    if (authResponse.data?.message !== "success") {
      return handleRemoteError(
        new Error(
          ["Invalid login response", JSON.stringify(apiResponse.data)].join(
            " ",
          ),
        ),
      );
    }
    const tokenPlainText = authResponse.data?.payload?.token;
    if (!tokenPlainText) {
      return handleRemoteError(new Error("Missing auth token from login"));
    }
    await createAuthCookieSession({
      token: tokenPlainText,
      userUUID: null,
    });
    const userResponse = await actionGetUser();
    if ("error" in userResponse) {
      throw userResponse.error;
    }
    let sessionUser: TSessionUser = userResponse;
    const selectedTenantUuid = getInitialTenantUuid(sessionUser);
    await createAuthCookieSession({
      token: tokenPlainText,
      userUUID: sessionUser.uuid,
      selectedTenantUuid,
    });
    if (selectedTenantUuid) {
      const selectedUserResponse = await actionGetUser();
      if ("error" in selectedUserResponse) {
        throw selectedUserResponse.error;
      }
      sessionUser = selectedUserResponse;
    }
    await setAuthUser(sessionUser.uuid, sessionUser);
  } catch (error: unknown) {
    return handleRemoteError(error);
  }
};

export const actionLogout = async () =>
  deleteSession({
    actionBeforeDeleteCookieCallback: actionRemoveTokenFromCallback,
  });
