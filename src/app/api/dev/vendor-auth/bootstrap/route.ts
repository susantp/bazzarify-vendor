import { setAuthUser } from "@/modules/auth/data/lib/auth-lib";
import SessionUserPayloadSchema from "@/modules/auth/domain/schemas/payloads/SessionUserPayloadSchema";
import { TSessionUser } from "@/modules/auth/domain/schemas/UserSchema";
import { defaultAxiosInstance } from "@/modules/core/lib/utils.axios";
import { extractRemoteErrorFeedback } from "@/modules/core/lib/utils.feedback";
import { handleRemoteError } from "@/modules/core/lib/utils.index";
import { createAuthCookieSession } from "@/modules/core/lib/utils.session";
import { NextRequest, NextResponse } from "next/server";

type PersonaName =
  | "vendor_admin"
  | "vendor_no_store"
  | "vendor_incomplete"
  | "vendor_ready"
  | "vendor_multi_category"
  | "vendor_with_store_no_categories"
  | "vendor_with_store_with_categories";

type AuthSuccessResponse = {
  data?: {
    message?: string;
    payload?: {
      token?: string;
    };
  };
};

const verificationHeaderName = "X-Bazarify-Verification";
const verificationHeaderValue = "vendor-auth";
const verificationPassword = "H@nds0me1522";
const personas: Record<
  PersonaName,
  {
    credential: string;
    password: string;
  }
> = {
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
};

function isAllowedEnvironment() {
  return ["development", "local", "dev"].includes(
    process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.NODE_ENV ?? "",
  );
}

async function handleBootstrap(personaName?: string) {
  if (!isAllowedEnvironment()) {
    return NextResponse.json(
      {
        metaData: {
          error: "Not found",
          errorCode: 404,
        },
      },
      { status: 404 },
    );
  }

  const persona = personaName
    ? personas[personaName as PersonaName]
    : undefined;
  if (!persona) {
    return NextResponse.json(
      handleRemoteError(new Error("Unknown verification persona."), 400),
      { status: 400 },
    );
  }

  try {
    const loginResponse = await defaultAxiosInstance.post<AuthSuccessResponse>(
      "/auth/vendor/login/credentials",
      {
        credential: persona.credential,
        password: persona.password,
      },
      {
        headers: {
          [verificationHeaderName]: verificationHeaderValue,
        },
      },
    );

    const remoteError = extractRemoteErrorFeedback(loginResponse.data);
    if (remoteError) {
      return NextResponse.json(handleRemoteError(loginResponse.data), {
        status: remoteError.errorCode ?? 400,
      });
    }

    const token = loginResponse.data.data?.payload?.token;
    if (!token) {
      return NextResponse.json(
        handleRemoteError(new Error("Missing auth token from login")),
        { status: 500 },
      );
    }

    const userResponse = await defaultAxiosInstance.get("/auth/vendor/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userError = extractRemoteErrorFeedback(userResponse.data);
    if (userError) {
      return NextResponse.json(handleRemoteError(userResponse.data), {
        status: userError.errorCode ?? 400,
      });
    }

    const parsed = SessionUserPayloadSchema.safeParse(
      userResponse.data?.data?.payload,
    );

    if (!parsed.success) {
      return NextResponse.json(
        handleRemoteError(new Error("Unable to parse vendor session user.")),
        { status: 500 },
      );
    }

    const sessionUser = parsed.data.user as TSessionUser;

    await createAuthCookieSession({
      token,
      userUUID: sessionUser.uuid,
    });
    await setAuthUser(sessionUser.uuid, sessionUser);

    return NextResponse.json({
      data: {
        payload: {
          persona: personaName,
          userUUID: sessionUser.uuid,
          hasStore: Boolean(sessionUser.store?.uuid),
        },
        message: "success",
      },
      metaData: {
        error: null,
        errorCode: null,
      },
    });
  } catch (error) {
    return NextResponse.json(handleRemoteError(error), { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    persona?: PersonaName;
  };

  return handleBootstrap(body.persona);
}

export async function GET(request: NextRequest) {
  const persona = request.nextUrl.searchParams.get("persona") ?? undefined;

  return handleBootstrap(persona);
}
