import {
  CALLING_CODE_OPTIONS,
  DEFAULT_CALLING_CODE,
} from "@/app/lib/geo/country-calling-codes";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isValidEmail(trimmed)) {
    return "Ievadi derīgu e-pasta adresi.";
  }
  return null;
}

export function validateRequiredEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Ievadi e-pasta adresi.";
  }
  if (!isValidEmail(trimmed)) {
    return "Ievadi derīgu e-pasta adresi.";
  }
  return null;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizePhone(value: string, defaultCallingCode: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("+")) {
    return `+${digitsOnly(trimmed)}`;
  }

  const localDigits = digitsOnly(trimmed);
  const codeDigits = digitsOnly(defaultCallingCode);
  return `+${codeDigits}${localDigits}`;
}

export function formatDisplayPhone(stored: string): string {
  const trimmed = stored.trim();
  if (!trimmed) return "";

  const { callingCode, local } = parseStoredPhone(trimmed);
  if (!local) return callingCode;

  return `${callingCode} ${local}`;
}

export function parseStoredPhone(stored: string): {
  callingCode: string;
  local: string;
} {
  const trimmed = stored.trim();
  if (!trimmed) {
    return { callingCode: DEFAULT_CALLING_CODE, local: "" };
  }

  if (!trimmed.startsWith("+")) {
    return { callingCode: DEFAULT_CALLING_CODE, local: digitsOnly(trimmed) };
  }

  const digits = digitsOnly(trimmed);
  const sortedCodes = [...CALLING_CODE_OPTIONS].sort(
    (a, b) => digitsOnly(b.value).length - digitsOnly(a.value).length,
  );

  for (const option of sortedCodes) {
    const codeDigits = digitsOnly(option.value);
    if (digits.startsWith(codeDigits)) {
      return {
        callingCode: option.value,
        local: digits.slice(codeDigits.length),
      };
    }
  }

  return { callingCode: DEFAULT_CALLING_CODE, local: digits };
}

export function validatePhone(
  value: string,
  defaultCallingCode: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = normalizePhone(trimmed, defaultCallingCode);
  const digits = digitsOnly(normalized);

  if (digits.length < 8 || digits.length > 15) {
    return "Ievadi derīgu telefona numuru.";
  }

  return null;
}

export function validateProjectContactFields(input: {
  email: string;
  phone: string;
  phoneCallingCode: string;
}): { email: string; phone: string; error: string | null } {
  const emailError = validateEmail(input.email);
  if (emailError) {
    return { email: input.email, phone: input.phone, error: emailError };
  }

  const phoneError = validatePhone(input.phone, input.phoneCallingCode);
  if (phoneError) {
    return { email: input.email, phone: input.phone, error: phoneError };
  }

  return {
    email: input.email.trim(),
    phone: normalizePhone(input.phone, input.phoneCallingCode),
    error: null,
  };
}
