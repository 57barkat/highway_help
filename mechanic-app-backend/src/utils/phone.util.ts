const PK_COUNTRY_CODE = "92";

export const normalizePhoneNumber = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return null;
  }

  let normalized = digitsOnly;

  if (normalized.startsWith("00")) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith(PK_COUNTRY_CODE)) {
    normalized = normalized.slice(PK_COUNTRY_CODE.length);
  }

  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  if (!/^3\d{9}$/.test(normalized)) {
    return null;
  }

  return `+${PK_COUNTRY_CODE}${normalized}`;
};

export const formatWhatsAppUrl = (phoneNumber: string) =>
  `https://wa.me/${phoneNumber.replace(/\D/g, "")}`;
