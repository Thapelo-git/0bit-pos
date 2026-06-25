import { Router } from "express";
import { aiSmartSearch, aiDescribeService } from "./ai.controller.js";

const router = Router();
router.post("/search",   aiSmartSearch);
router.post("/describe", aiDescribeService);

export default router;
