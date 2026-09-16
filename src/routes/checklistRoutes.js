const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const checklistController = require('../controllers/checklistController');

router.get('/', requireAuth, checklistController.getTasks);
router.post('/', requireAuth, checklistController.createTask);
router.post('/seed', requireAuth, checklistController.seedDefaultTasks);
router.post('/bulk', requireAuth, checklistController.bulkUpdateTasks);
router.put('/:id', requireAuth, checklistController.updateTask);
router.patch('/:id/toggle', requireAuth, checklistController.toggleTask);
router.delete('/:id', requireAuth, checklistController.deleteTask);

module.exports = router;
