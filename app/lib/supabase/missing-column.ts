type PostgrestLikeError = {
  code?: string;
  message?: string;
} | null;

export function isMissingColumnError(
  error: PostgrestLikeError,
  columnName: string,
): boolean {
  if (!error) {
    return false;
  }

  if (error.code === "42703") {
    return true;
  }

  const message = error.message?.toLowerCase() ?? "";
  return message.includes(columnName.toLowerCase());
}
