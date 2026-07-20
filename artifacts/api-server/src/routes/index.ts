import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import notifyRouter from "./notify";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ai", aiRouter);
router.use("/notify", notifyRouter);

// Compatibilitate cu apelul existent /api/chat-notify din frontend
router.use("/", notifyRouter);

export default router;
