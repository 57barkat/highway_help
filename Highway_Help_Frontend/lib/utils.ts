export const formatPhoneNumber = (phone: string | string[]) => {
  // Format phone number as 300 123 4567
  const phoneStr = Array.isArray(phone) ? phone[0] : phone;
  const cleaned = phoneStr.replace(/\D/g, ""); // Remove non-digits
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phoneStr; // Return original if not 10 digits
};

export const normalizePkPhoneNumber = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return null;
  }

  let normalized = digitsOnly;
  if (normalized.startsWith("00")) {
    normalized = normalized.slice(2);
  }
  if (normalized.startsWith("92")) {
    normalized = normalized.slice(2);
  }
  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  if (!/^3\d{9}$/.test(normalized)) {
    return null;
  }

  return `+92${normalized}`;
};

export const buildWhatsAppUrl = (phoneNumber: string) =>
  `https://wa.me/${phoneNumber.replace(/\D/g, "")}`;
