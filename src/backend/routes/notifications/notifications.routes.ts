import { Router } from 'express';
import { query } from '../../database/db.repo';
import { authenticateJWT, AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT as any);

// Fetch persistent notifications for the current authenticated user
router.get('/', async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(`
      SELECT * FROM zmc_notifications
      WHERE user_id = $1
      ORDER BY timestamp DESC
    `, [userId]);

    res.json({
      success: true,
      data: result.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        message: r.message,
        type: r.type,
        read: r.read,
        timestamp: r.timestamp
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark all notifications as read for current user
router.post('/read-all', async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await query(`
      UPDATE zmc_notifications
      SET read = TRUE
      WHERE user_id = $1
    `, [userId]);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark a single notification as read
router.post('/:id/read', async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await query(`
      UPDATE zmc_notifications
      SET read = TRUE
      WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
