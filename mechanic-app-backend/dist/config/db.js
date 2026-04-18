"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm"); // remove Transaction from here
const User_1 = require("../entities/User");
const Request_1 = require("../entities/Request");
const Offer_1 = require("../entities/Offer");
const AppSetting_1 = require("../entities/AppSetting");
const dotenv_1 = __importDefault(require("dotenv"));
const transactions_1 = require("../entities/transactions");
const _1775419455800_InitialSchema_1 = require("../migrations/1775419455800-InitialSchema");
const _1775580000000_AddUserPhoneAndRefreshTokens_1 = require("../migrations/1775580000000-AddUserPhoneAndRefreshTokens");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
    logging: false,
    entities: [User_1.User, Request_1.Request, Offer_1.Offer, AppSetting_1.AppSetting, transactions_1.Payment],
    subscribers: [],
    migrations: [
        _1775419455800_InitialSchema_1.InitialSchema1775419455800,
        _1775580000000_AddUserPhoneAndRefreshTokens_1.AddUserPhoneAndRefreshTokens1775580000000,
    ],
});
