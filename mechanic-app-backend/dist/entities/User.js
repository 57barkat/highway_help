"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.HelperCategory = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const Request_1 = require("./Request");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["HELPER"] = "helper";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var HelperCategory;
(function (HelperCategory) {
    HelperCategory["FLAT_TIRE"] = "flat_tire";
    HelperCategory["FUEL"] = "fuel";
    HelperCategory["BATTERY"] = "battery";
    HelperCategory["TOW"] = "tow";
})(HelperCategory || (exports.HelperCategory = HelperCategory = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, unique: true, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true, select: false }),
    __metadata("design:type", Object)
], User.prototype, "refreshTokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "refreshTokenExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)("double precision", { nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)("double precision", { nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isOnline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isBusy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: HelperCategory,
        array: true,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "cnicImage", void 0);
__decorate([
    (0, typeorm_1.Column)("double precision", {
        default: 0,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value) || 0,
        },
    }),
    __metadata("design:type", Number)
], User.prototype, "totalEarnings", void 0);
__decorate([
    (0, typeorm_1.Column)("double precision", {
        default: 0,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value) || 0,
        },
    }),
    __metadata("design:type", Number)
], User.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "ratingCount", void 0);
__decorate([
    (0, typeorm_1.Column)("double precision", {
        default: 0,
        comment: "Helper's wallet. If negative, they cannot receive rides.",
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value) || 0,
        },
    }),
    __metadata("design:type", Number)
], User.prototype, "availableBalance", void 0);
__decorate([
    (0, typeorm_1.Column)("double precision", {
        default: 0,
        comment: "Amount held until job completion",
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value) || 0,
        },
    }),
    __metadata("design:type", Number)
], User.prototype, "pendingBalance", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Request_1.Request, (request) => request.user),
    __metadata("design:type", Array)
], User.prototype, "requests", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)("users")
], User);
