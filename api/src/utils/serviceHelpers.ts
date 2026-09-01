export const normalizeOptionalString = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const sameId = (left: unknown, right: unknown): boolean =>
  String(left ?? "") === String(right ?? "");

export const getMongoId = (value: unknown): string => String(value ?? "");

export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
