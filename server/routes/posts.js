import express from 'express';
import { getFeedPosts, getUserPosts, likePost } from '../controllers/posts.js';
import { verifyToken } from '../middleware/auth.js';
import { addComment } from "../controllers/posts.js";

const router = express.Router();


router.get('/', verifyToken, getFeedPosts);
router.get('/:userId/posts', verifyToken, getUserPosts);

router.patch('/:id/like', verifyToken, likePost);
router.patch("/:id/comment", verifyToken, addComment);

export default router;