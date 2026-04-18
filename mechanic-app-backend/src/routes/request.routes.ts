import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";
import {
  createRequest,
  makeOffer,
  acceptOffer,
  helperArrived,
  helperStartWork,
  helperWorkDone,
  userRateHelper,
  cancelRide,
} from "../controllers/request.secure.controller";
import { getJobHistory } from "../controllers/history.controller";

const router = Router();

router.post("/create", authMiddleware, roleMiddleware([UserRole.USER]), createRequest);
router.post("/offer", authMiddleware, roleMiddleware([UserRole.HELPER]), makeOffer);
router.post(
  "/offer/accept",
  authMiddleware,
  roleMiddleware([UserRole.USER]),
  acceptOffer,
);
router.post(
  "/helper/arrived",
  authMiddleware,
  roleMiddleware([UserRole.HELPER]),
  helperArrived,
);
router.post(
  "/helper/start",
  authMiddleware,
  roleMiddleware([UserRole.HELPER]),
  helperStartWork,
);
router.post(
  "/helper/done",
  authMiddleware,
  roleMiddleware([UserRole.HELPER]),
  helperWorkDone,
);
router.post("/user/rate", authMiddleware, roleMiddleware([UserRole.USER]), userRateHelper);
router.post("/cancel", authMiddleware, cancelRide);
router.get("/history", authMiddleware, getJobHistory);

export default router;
