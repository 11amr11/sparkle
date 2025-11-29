import express from 'express';
import { getAllUsers, getUserById, getContacts, addContact, updateProfile } from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getAllUsers); // Keep for search if needed, or restrict
router.get('/contacts', getContacts);
router.post('/contacts', addContact);
router.put('/profile', updateProfile);
router.get('/:id', getUserById);

export default router;
