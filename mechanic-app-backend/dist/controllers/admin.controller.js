"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineHelpers = exports.getRequests = exports.updateCommission = exports.getCommission = exports.verifyHelper = exports.getPendingHelpers = exports.getHelpers = exports.deleteUser = exports.updateUser = exports.getUsers = exports.getStats = void 0;
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const Request_1 = require("../entities/Request");
const AppSetting_1 = require("../entities/AppSetting");
const __1 = require("..");
const phone_util_1 = require("../utils/phone.util");
const getStats = async (req, res) => {
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
        const totalUsers = await userRepo.count({ where: { role: User_1.UserRole.USER } });
        const totalHelpers = await userRepo.count({
            where: { role: User_1.UserRole.HELPER },
        });
        const pendingHelpers = await userRepo.count({
            where: { role: User_1.UserRole.HELPER, isVerified: false },
        });
        const rawData = await requestRepo
            .createQueryBuilder("request")
            .select("DATE_TRUNC('day', request.createdAt)", "day")
            .addSelect("COUNT(*)", "count")
            .where("request.createdAt >= NOW() - INTERVAL '7 days'")
            .groupBy("day")
            .orderBy("day", "ASC")
            .getRawMany();
        const chartData = rawData.map((item) => ({
            name: new Date(item.day).toLocaleDateString("en-US", {
                weekday: "short",
            }),
            requests: parseInt(item.count),
        }));
        return res.json({
            counts: { totalUsers, totalHelpers, pendingHelpers },
            chartData,
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getStats = getStats;
const getUsers = async (req, res) => {
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const users = await userRepo.find({ where: { role: User_1.UserRole.USER } });
        return res.json({ users });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getUsers = getUsers;
const updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, phoneNumber } = req.body;
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { id: userId, role: User_1.UserRole.USER },
        });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (phoneNumber) {
            const normalizedPhoneNumber = (0, phone_util_1.normalizePhoneNumber)(phoneNumber);
            if (!normalizedPhoneNumber) {
                return res.status(400).json({ message: "Invalid phone number" });
            }
            user.phoneNumber = normalizedPhoneNumber;
        }
        await userRepo.save(user);
        return res.json({ message: "User updated", user });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { id: userId, role: User_1.UserRole.USER },
        });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        await userRepo.remove(user);
        return res.json({ message: "User deleted" });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.deleteUser = deleteUser;
const getHelpers = async (req, res) => {
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const helpers = await userRepo.find({ where: { role: User_1.UserRole.HELPER } });
        return res.json({ helpers });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getHelpers = getHelpers;
const getPendingHelpers = async (req, res) => {
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const pendingHelpers = await userRepo.find({
            where: { role: User_1.UserRole.HELPER, isVerified: false },
        });
        return res.json({ pendingHelpers });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getPendingHelpers = getPendingHelpers;
const verifyHelper = async (req, res) => {
    try {
        const helperId = parseInt(req.params.id);
        const { isVerified } = req.body;
        if (typeof isVerified !== "boolean") {
            return res.status(400).json({ message: "isVerified boolean required" });
        }
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const helper = await userRepo.findOne({
            where: { id: helperId, role: User_1.UserRole.HELPER },
        });
        if (!helper)
            return res.status(404).json({ message: "Helper not found" });
        helper.isVerified = isVerified;
        await userRepo.save(helper);
        return res.json({
            message: `Helper ${isVerified ? "approved" : "unapproved"} successfully`,
            helper: {
                id: helper.id,
                name: helper.name,
                email: helper.email,
                isVerified: helper.isVerified,
            },
        });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.verifyHelper = verifyHelper;
const getCommission = async (req, res) => {
    try {
        const repo = db_1.AppDataSource.getRepository(AppSetting_1.AppSetting);
        const setting = await repo.findOneBy({ key: "commission_percent" });
        return res.json({
            commission: setting ? Number(setting.value) : 0,
        });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getCommission = getCommission;
const updateCommission = async (req, res) => {
    try {
        const { percent } = req.body;
        if (typeof percent !== "number" || percent < 0 || percent > 100) {
            return res.status(400).json({ message: "Invalid commission percent" });
        }
        const repo = db_1.AppDataSource.getRepository(AppSetting_1.AppSetting);
        let setting = await repo.findOneBy({ key: "commission_percent" });
        if (!setting) {
            setting = repo.create({
                key: "commission_percent",
                value: percent.toString(),
            });
        }
        else {
            setting.value = percent.toString();
        }
        await repo.save(setting);
        return res.json({
            message: "Commission updated",
            commission: percent,
        });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.updateCommission = updateCommission;
const getRequests = async (req, res) => {
    try {
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
        const requests = await requestRepo.find({
            relations: ["user", "helper", "offers"],
        });
        return res.json({ requests });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getRequests = getRequests;
const getOnlineHelpers = async (req, res) => {
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const onlineIds = Array.from(__1.onlineMechanics.keys());
        if (onlineIds.length === 0) {
            return res.json({ helpers: [] });
        }
        const helpers = await userRepo.findByIds(onlineIds);
        const result = helpers.map((helper) => {
            const liveData = __1.onlineMechanics.get(helper.id);
            return {
                id: helper.id,
                name: helper.name,
                email: helper.email,
                phoneNumber: helper.phoneNumber,
                lat: liveData?.lat ?? helper.lat,
                lng: liveData?.lng ?? helper.lng,
                rating: helper.rating,
                ratingCount: helper.ratingCount,
                totalEarnings: helper.totalEarnings,
                isBusy: helper.isBusy,
                isOnline: helper.isOnline,
            };
        });
        return res.json({ helpers: result });
    }
    catch {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getOnlineHelpers = getOnlineHelpers;
