"use server";

import {
  actionRemoveTokenFromCallback,
  getSessionToken,
} from "@/modules/auth/data/lib/auth-lib";
import {
  deleteSession,
  getCookieStore,
  getSelectedTenantUuid,
} from "@/modules/core/lib/utils.session";
import axios, { CreateAxiosDefaults } from "axios";
import { redirect } from "next/navigation";

const remoteData: Record<string, string> = {
  apiUrl: process.env.API_URL || "http://local-ne.larashops.local:8081/api/v1",
  appKey: process.env.APP_KEY || "",
};
const defaultConfig: CreateAxiosDefaults = {
  baseURL: remoteData.apiUrl,
  headers: {
    "User-Agent": "BazzarifyVendor",
    "Content-Type": "application/json",
    "X-APP-Key": remoteData.appKey,
    Accept: "application/json",
  },
  validateStatus: (status) => status < 500,
};

export const defaultAxiosInstance = axios.create({
  ...defaultConfig,
});

export const authAxiosInstance = async () => {
  const cookieStore = await getCookieStore();
  const token: string | null = await getSessionToken(cookieStore);
  if (!token) {
    redirect("/login");
  }
  const selectedTenantUuid = await getSelectedTenantUuid();
  const instance = axios.create({
    ...defaultConfig,
    headers: {
      ...defaultConfig.headers,
      Authorization: `Bearer ${token}`,
      ...(selectedTenantUuid
        ? { "X-Bazarify-Tenant": selectedTenantUuid }
        : {}),
    },
  });
  instance.interceptors.response.use((response) => {
    if (response.data?.metaData?.errorCode === 401) {
      deleteSession({
        actionBeforeDeleteCookieCallback: actionRemoveTokenFromCallback,
      });
      redirect("/login");
    }
    return response;
  });
  return instance;
};
