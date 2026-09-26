import { expect, test } from "bun:test";

import { ResetPasswordFormSchema } from "@/modules/guest/config/schemas/reset.password.form";
import { ResetPasswordVerificationFormSchema } from "@/modules/guest/config/schemas/reset.password.verification.form";
import {
  buildPasswordResetVerificationHref,
  toPasswordResetVerificationPayload,
} from "@/modules/guest/utils/passwordReset";

test("password reset request schema accepts valid details and rejects invalid phone", () => {
  expect(
    ResetPasswordFormSchema.safeParse({
      email: "vendor@example.com",
      phone: "9812345678",
    }).success,
  ).toBe(true);
  expect(
    ResetPasswordFormSchema.safeParse({
      email: "vendor@example.com",
      phone: "1234",
    }).success,
  ).toBe(false);
});

test("password reset verification enforces confirmation and maps the payload", () => {
  expect(
    ResetPasswordVerificationFormSchema.safeParse({
      phone: "9812345678",
      otp: "123456",
      password: "SecurePass1!",
      password_confirmation: "SecurePass1!",
    }).success,
  ).toBe(true);
  expect(
    ResetPasswordVerificationFormSchema.safeParse({
      phone: "9812345678",
      otp: "123456",
      password: "SecurePass1!",
      password_confirmation: "AnotherPass1!",
    }).success,
  ).toBe(false);
  expect(buildPasswordResetVerificationHref("9812345678")).toBe(
    "/verify-otp?phone=9812345678",
  );
  expect(
    toPasswordResetVerificationPayload({
      phone: "9812345678",
      otp: "123456",
      password: "SecurePass1!",
      password_confirmation: "SecurePass1!",
    }),
  ).toEqual({
    phone: "9812345678",
    verification_code: "123456",
    password: "SecurePass1!",
    password_confirmation: "SecurePass1!",
  });
});
