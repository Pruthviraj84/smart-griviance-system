import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { getIO, emitToComplaintRoom } from '../utils/socket.js';

const router = express.Router();

router.get('/:complaintId', verifyToken, async (req, res) => {
  try {
    const { messages } = getCollections();
    const { complaintId } = req.params;
    const list = await messages
      .find({ complaintId })
      .sort({ createdAt: 1 })
      .toArray();
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/:complaintId', verifyToken, upload.array('images', 3), async (req, res) => {
  try {
    const { messages } = getCollections();
    const { complaintId } = req.params;
    const { text } = req.body;
    const user = req.user;

    const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const message = {
      complaintId,
      senderId: user.id || user._id,
      senderName: user.name,
      senderRole: user.role,
      text: text || '',
      images,
      createdAt: new Date(),
    };

    const result = await messages.insertOne(message);
    const saved = { _id: result.insertedId, ...message };

    emitToComplaintRoom(complaintId, 'new-message', saved);

    return res.status(201).json(saved);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
