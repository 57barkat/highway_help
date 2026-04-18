"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatWhatsAppUrl = exports.normalizePhoneNumber = void 0;
const PK_COUNTRY_CODE = "92";
const normalizePhoneNumber = (value) => {
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
exports.normalizePhoneNumber = normalizePhoneNumber;
const formatWhatsAppUrl = (phoneNumber) => `https://wa.me/${phoneNumber.replace(/\D/g, "")}`;
exports.formatWhatsAppUrl = formatWhatsAppUrl;
