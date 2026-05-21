import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import adminRouter from "./admin";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(adminRouter);
router.use(settingsRouter);
router.use(dashboardRouter);
router.use(paymentsRouter);
router.use(uploadRouter);

export default router;
