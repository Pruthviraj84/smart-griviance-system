import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const notificationTargetsFor = (user = {}) => {
  const targets = [
    user.id || user._id ? { userId: (user.id || user._id).toString() } : null,
    user.grnNumber ? { grnNumber: user.grnNumber } : null,
    user.role ? { role: user.role } : null,
    { role: 'All' },
  ];

  return targets.filter(Boolean);
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const { notifications } = getCollections();
    const targets = notificationTargetsFor(req.user);

    const list = await notifications
      .find({ $or: targets })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const unreadCount = await notifications.countDocuments({
      $or: targets,
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
    const targets = notificationTargetsFor(req.user);

    await notifications.updateMany(
      {
        $or: targets,
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
