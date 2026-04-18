import { DataSource } from "typeorm"; // remove Transaction from here
import { User } from "../entities/User";
import { Request as JobRequest } from "../entities/Request";
import { Offer } from "../entities/Offer";
import { AppSetting } from "../entities/AppSetting";
import dotenv from "dotenv";
import { Payment } from "../entities/transactions";
import { InitialSchema1775419455800 } from "../migrations/1775419455800-InitialSchema";
import { AddUserPhoneAndRefreshTokens1775580000000 } from "../migrations/1775580000000-AddUserPhoneAndRefreshTokens";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
  logging: false,
  entities: [User, JobRequest, Offer, AppSetting, Payment],
  subscribers: [],
  migrations: [
    InitialSchema1775419455800,
    AddUserPhoneAndRefreshTokens1775580000000,
  ],
});
