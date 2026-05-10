import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const { notifications } = getCollections();
    const userId = req.user.id || req.user._id;
    const role = req.user.role;

    const list = await notifications
      .find({
        $or: [
          { userId: userId?.toString() },
          { role },
          { role: 'All' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const unreadCount = await notifications.countDocuments({
      $or: [
        { userId: userId?.toString() },
        { role },
        { role: 'All' },
      ],
      read: false,
    });

    return res.json({ notifications: list, unreadCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { notifications } = getCollections();
    await notifications.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { read: true } }
    );
    return res.json({ message: 'Marked as read' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    const { notifications } = getCollections();
    const userId = req.user.id || req.user._id;
    const role = req.user.role;

    await notifications.updateMany(
      {
        $or: [
          { userId: userId?.toString() },
          { role },
          { role: 'All' },
        ],
        read: false,
      },
      { $set: { read: true } }
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { notifications } = getCollections();
    await notifications.deleteOne({ _id: new ObjectId(req.params.id) });
    return res.json({ message: 'Notification deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
