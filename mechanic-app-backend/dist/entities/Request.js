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
exports.Request = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Offer_1 = require("./Offer");
let Request = class Request {
};
exports.Request = Request;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Request.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.requests, { eager: true }),
    __metadata("design:type", User_1.User)
], Request.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Request.prototype, "problemType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Request.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], Request.prototype, "areaName", void 0);
__decorate([
    (0, typeorm_1.Column)("double precision"),
    __metadata("design:type", Number)
], Request.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)("double precision"),
    __metadata("design:type", Number)
], Request.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: [
            "pending",
            "accepted",
            "arrived",
            "working",
            "completed",
            "cancelled",
        ],
        default: "pending",
    }),
    __metadata("design:type", String)
], Request.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "double precision", nullable: true }),
    __metadata("design:type", Number)
], Request.prototype, "suggestedPrice", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true, eager: true }),
    __metadata("design:type", User_1.User)
], Request.prototype, "helper", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Offer_1.Offer, (offer) => offer.request),
    __metadata("design:type", Array)
], Request.prototype, "offers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "double precision", nullable: true }),
    __metadata("design:type", Number)
], Request.prototype, "finalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], Request.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Request.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Request.prototype, "updatedAt", void 0);
exports.Request = Request = __decorate([
    (0, typeorm_1.Entity)("requests")
], Request);
