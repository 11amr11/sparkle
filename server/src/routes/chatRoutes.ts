import express from 'express';
import { protect } from '../middleware/auth';
import { getConversations, getMessages, startConversation, deleteMessage } from '../controllers/chatController';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations', startConversation);
router.delete('/messages/:messageId', deleteMessage); // Add import for deleteMessage

export default router;
