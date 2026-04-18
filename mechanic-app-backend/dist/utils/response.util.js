"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = exports.sendError = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.ApiError = ApiError;
const sendError = (res, statusCode, message, details) => res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
});
exports.sendError = sendError;
const sendSuccess = (res, statusCode, message, data) => res.status(statusCode).json({
    success: true,
    message,
    ...(data ?? {}),
});
exports.sendSuccess = sendSuccess;
