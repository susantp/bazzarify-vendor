"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import FormTitle from "@/modules/core/components/server/FormTitle";
import { ThemedButton } from "@/modules/core/components/server/ThemedButton";
import {
  applyValidationFeedback,
  getValidationFeedback,
} from "@/modules/core/lib/utils.validationFeedback";
import { actionLogin } from "@/modules/guest/actions/login";
import {
  LoginFormSchema,
  LoginFormValues,
} from "@/modules/guest/config/schemas/login.form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const DEV_LOGIN_PERSONAS = [
  { label: "Admin vendor", credential: "techbizznepal@gmail.com" },
  {
    label: "Vendor without store",
    credential: "vendor.no-store@bazarify.local",
  },
  {
    label: "Incomplete vendor",
    credential: "vendor.store.nocategories@bazarify.local",
  },
  {
    label: "Ready vendor",
    credential: "vendor.store.categories@bazarify.local",
  },
] as const;

const verificationPassword = "H@nds0me1522";

function isLocalEnvironment(): boolean {
  return ["development", "local", "dev"].includes(
    process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.NODE_ENV ?? "",
  );
}

export default function LoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      credential: "",
      password: "",
    },
  });

  async function runLogin(data: LoginFormValues) {
    toast.info("Signing In...");
    return actionLogin(data)
      .then((response) => {
        if (response?.metaData?.error) {
          const feedback = getValidationFeedback(response);
          if (feedback) {
            applyValidationFeedback(form.setError, feedback);
            toast.warning(feedback.summary);
            return;
          }
          toast.warning(response?.metaData?.error);
          return;
        }
        toast.success("Signing you in...");
      })
      .catch((error) => {
        const feedback = getValidationFeedback(error);
        if (feedback) {
          applyValidationFeedback(form.setError, feedback);
          toast.error(feedback.summary);
          return;
        }
        toast.error("Cannot login");
      });
  }

  function handleSubmit(data: LoginFormValues) {
    void runLogin(data);
  }

  function handleDevLogin(credential: string) {
    void runLogin({
      credential,
      password: verificationPassword,
    });
  }

  return (
    <>
      {isLocalEnvironment() ? (
        <div className="flex w-full flex-col gap-2">
          {DEV_LOGIN_PERSONAS.map((persona) => (
            <ThemedButton
              key={persona.credential}
              type="button"
              onClick={() => handleDevLogin(persona.credential)}
              className="text-md w-full py-6"
            >
              Dev Login · {persona.label}
            </ThemedButton>
          ))}
        </div>
      ) : null}
      <FormTitle
        label="Sign In"
        className="flex w-full items-center justify-center"
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex-col space-y-6"
        >
          <FormField
            render={({ field }) => (
              <FormItem className="flex flex-col gap-y-2">
                <FormLabel className="text-slate-500">Email/Phone</FormLabel>
                <FormControl>
                  <Input
                    autoComplete=""
                    className="border border-slate-300 placeholder:text-slate-400"
                    type="text"
                    placeholder="Enter your email/phone"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            name="credential"
          />
          <FormField
            render={({ field }) => (
              <FormItem className="flex flex-col gap-y-2">
                <FormLabel className="text-slate-500">Password</FormLabel>
                <FormControl>
                  <Input
                    className="border border-slate-300 accent-orange-600 placeholder:text-slate-400"
                    type="password"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            name="password"
          />
          <ThemedButton type="submit" className="text-md w-full py-6">
            Sign In
          </ThemedButton>
        </form>
      </Form>
    </>
  );
}
