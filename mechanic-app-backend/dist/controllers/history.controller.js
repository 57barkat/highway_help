"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobHistory = void 0;
const db_1 = require("../config/db");
const Request_1 = require("../entities/Request");
const getJobHistory = async (req, res) => {
    try {
        const helper = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
        const [jobs, total] = await requestRepo.findAndCount({
            where: {
                helper: { id: helper.id },
                status: "completed",
            },
            order: { createdAt: "DESC" },
            skip: skip,
            take: limit,
            relations: ["user"],
        });
        return res.json({
            jobs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getJobHistory = getJobHistory;
