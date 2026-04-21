import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import huntRouter from "./hunt";
import submissionsRouter from "./submissions";
import rankingsRouter from "./rankings";
import friendsRouter from "./friends";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(huntRouter);
router.use(submissionsRouter);
router.use(rankingsRouter);
router.use(friendsRouter);
router.use(usersRouter);

export default router;
