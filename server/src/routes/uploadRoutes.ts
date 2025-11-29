import express from 'express';
import upload from '../middleware/upload';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
    if (req.file) {
        res.json({
            url: `/uploads/${req.file.filename}`,
        });
    } else {
        res.status(400).json({ message: 'No file uploaded' });
    }
});

export default router;
