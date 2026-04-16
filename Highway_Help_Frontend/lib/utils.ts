export const formatPhoneNumber = (phone: string | string[]) => {
  // Format phone number as 300 123 4567
  const phoneStr = Array.isArray(phone) ? phone[0] : phone;
  const cleaned = phoneStr.replace(/\D/g, ""); // Remove non-digits
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phoneStr; // Return original if not 10 digits
};
