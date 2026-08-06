"use server";

import {
  registerWithEmailPassword,
  resendSignupConfirmationEmail,
} from "@/app/lib/auth/email-password";

export async function registerWithEmailAction(input: {
  email: string;
  password: string;
}) {
  return registerWithEmailPassword(input.email, input.password);
}

export async function resendSignupConfirmationAction(input: {
  email: string;
  password: string;
}) {
  return resendSignupConfirmationEmail(input.email, input.password);
}
