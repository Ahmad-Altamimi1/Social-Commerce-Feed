import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storeRouter from "./store";
import feedRouter from "./feed";
import merchantRouter from "./merchant";
import cartRouter from "./cart";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(feedRouter);
router.use(merchantRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(storeRouter);

export default router;
