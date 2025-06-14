import express from "express";
import { sendMessage, getMessages } from "../controllers/messages.js";

const router = express.Router();

router.post("/", sendMessage);
router.get("/:userId1/:userId2", getMessages);

export default router;
