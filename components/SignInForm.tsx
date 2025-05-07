"use client";
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setCredentials } from "@/store/authSlice";
import { useDispatch } from "react-redux";
import ValidationCodes from "@/components/ValidationCodes";
import { useRouter } from "next/navigation";
// Define the validation schema
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  verificationCode: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .optional(),
});

// Infer the type from the schema
type SignInFormData = z.infer<typeof signInSchema>;

const SignInForm = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codes, setCodes] = useState(["", "", "", "", "", ""]);
  const router = useRouter();

  useEffect((): void | (() => void) => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const email = watch("email");

  const handleResendCode = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      setApiError("");

      const response = await fetch(
        `${process.env.BACKEND_URL}/auth/send-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to resend verification code"
        );
      }

      setCodes(["", "", "", "", "", ""]);

      setCountdown(60); // Start 60 second countdown
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Failed to resend code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignInFormData): Promise<void> => {
    try {
      debugger;
      setIsLoading(true);
      setApiError("");

      if (!codeSent) {
        // Send verification code
        const response = await fetch("/api/auth/send-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: data.email }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to send verification code");
        }

        setCodeSent(true);
        setCountdown(60); // Start 60 second countdown
      } else {
        // Verify code
        const response = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            code: codes.join(""),
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Invalid verification code");
        }

        const { session } = result.data;

        if (session) {
          console.log("Login successful! Session:", session);

          dispatch(
            setCredentials({
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              userId: session.user.id,
              email: session.user.email || "",
              avatarUrl: session.user.user_metadata?.avatar_url || "",
              totalCredits: 5,
              remainingCredits: 5,
              subscriptionName: "Free",
              firstName: session.user.user_metadata?.first_name || "",
              lastName: session.user.user_metadata?.last_name || "",
              fullName: session.user.user_metadata?.full_name || "",
            })
          );

          setCodes(["", "", "", "", "", ""]);
          router.push("/message");
        }
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-[500px] flex flex-col gap-2 bg-[#0F1B2650] p-10 rounded-md"
    >
      {apiError && (
        <p className="w-full text-center bg-transparent text-red-500 text-base leading-3">
          {apiError}
        </p>
      )}
      <p className="text-white text-opacity-80 text-base">
        {codeSent
          ? "We've sent a verification code to " + email
          : "Enter email for verification code."}
      </p>

      {!codeSent && (
        <div className="flex flex-row items-center justify-center gap-0.5 px-4 py-[1px] border border-gray-700 rounded-md bg-[#0F1B2680] mt-4">
          <input
            {...register("email")}
            type="text"
            placeholder="Enter email address"
            className="w-full outline-none border-gray-300 rounded-md p-2 bg-transparent text-base text-white placeholder:text-gray-400 placeholder:text-opacity-60 placeholder:font-medium font-inter"
          />
        </div>
      )}
      {errors.email && (
        <span className="text-red-500 text-base">{errors.email.message}</span>
      )}

      {codeSent && (
        <>
          <ValidationCodes
            onComplete={() => {}}
            isLoading={isLoading}
            codes={codes}
            setCodes={setCodes}
            apiError={apiError}
          />
          {errors.verificationCode && (
            <span className="text-red-500 text-base">
              {errors.verificationCode.message}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleResendCode(email)}
            disabled={countdown > 0 || isLoading}
            className="text-base font-barlow text-blue-600 hover:text-blue-800 disabled:text-gray-400 -mb-4 cursor-pointer"
          >
            {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
          </button>
        </>
      )}

      <div className="w-full h-[1px] opacity-[10%] bg-gradient-to-r from-white/100 to-[#99999940] mt-3"></div>

      <button
        type="submit"
        className="w-full py-2 border border-[#8D8D8D20] rounded-md p-2 bg-[linear-gradient(35deg,_#ffffff,_#cacaca)] mt-3 cursor-pointer"
        disabled={isLoading}
      >
        <span className="text-base text-[#1D2939] font-semibold">
          {isLoading ? "Processing..." : codeSent ? "Verify Code" : "Continue"}
        </span>
      </button>
    </form>
  );
};

export default React.memo(SignInForm);
