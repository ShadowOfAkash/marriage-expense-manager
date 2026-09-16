const { isLibSQL, dbGet, dbAll, dbRun, readJSON, writeJSON } = require('../db');
const { DEFAULT_INDIAN_WEDDING_TASKS, TIMELINE_STAGES, CHECKLIST_CATEGORIES } = require('../config/defaultChecklist');

function formatTask(task) {
  if (!task) return null;
  return {
    ...task,
    id: typeof task.id === 'string' && !isNaN(Number(task.id)) ? Number(task.id) : task.id,
    completed: task.completed === 1 || task.completed === true,
    is_custom: task.is_custom === 1 || task.is_custom === true,
    estimated_cost: Number(task.estimated_cost) || 0,
    actual_cost: Number(task.actual_cost) || 0
  };
}

function computeSummary(tasks = []) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const now = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => !t.completed && t.due_date && t.due_date < now).length;

  // Category counts
  const byCategory = {};
  for (const t of tasks) {
    const cat = t.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, completed: 0 };
    byCategory[cat].total++;
    if (t.completed) byCategory[cat].completed++;
  }

  // Stage counts
  const byStage = {};
  for (const t of tasks) {
    const st = t.timeline_stage || 'General';
    if (!byStage[st]) byStage[st] = { total: 0, completed: 0 };
    byStage[st].total++;
    if (t.completed) byStage[st].completed++;
  }

  return {
    total,
    completed,
    pending,
    overdue,
    percentage,
    byCategory,
    byStage
  };
}

async function seedTasksForUser(userId) {
  const now = new Date().toISOString();
  if (isLibSQL()) {
    for (let i = 0; i < DEFAULT_INDIAN_WEDDING_TASKS.length; i++) {
      const t = DEFAULT_INDIAN_WEDDING_TASKS[i];
      const taskId = `TSK-${Date.now()}-${i + 1}`;
      await dbRun(`
        INSERT INTO checklist_tasks (
          task_id, user_id, title, category, timeline_stage,
          due_date, completed, completed_at, priority, assigned_to,
          estimated_cost, actual_cost, notes, is_custom, sort_order,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, 0, 0, ?, 0, ?, datetime('now'), datetime('now'))
      `, [
        taskId, userId, t.title, t.category, t.timeline_stage,
        '', t.priority || 'Medium', t.assigned_to || '',
        t.notes || '', i + 1
      ]);
    }
  } else {
    const d = readJSON();
    if (!d.checklist_tasks) d.checklist_tasks = [];
    DEFAULT_INDIAN_WEDDING_TASKS.forEach((t, i) => {
      d.checklist_tasks.push({
        id: Date.now() + i,
        task_id: `TSK-${Date.now()}-${i + 1}`,
        user_id: userId,
        title: t.title,
        category: t.category,
        timeline_stage: t.timeline_stage,
        due_date: '',
        completed: false,
        completed_at: null,
        priority: t.priority || 'Medium',
        assigned_to: t.assigned_to || '',
        estimated_cost: 0,
        actual_cost: 0,
        linked_booking_id: null,
        linked_payment_id: null,
        notes: t.notes || '',
        is_custom: false,
        sort_order: i + 1,
        created_at: now,
        updated_at: now
      });
    });
    writeJSON(d);
  }
}

async function getTasks(req, res) {
  try {
    const userId = req.user?.uid || 'legacy_user';
    let tasks = [];

    if (isLibSQL()) {
      const rows = await dbAll(`
        SELECT * FROM checklist_tasks 
        WHERE user_id = ? OR user_id = 'legacy_user' OR user_id IS NULL OR user_id = ''
        ORDER BY sort_order ASC, id ASC
      `, [userId]);
      tasks = rows.map(formatTask);
    } else {
      const d = readJSON();
      tasks = (d.checklist_tasks || [])
        .filter(t => !t.user_id || t.user_id === userId || t.user_id === 'legacy_user')
        .map(formatTask);
    }

    // Auto-seed if first time visiting
    if (tasks.length === 0) {
      await seedTasksForUser(userId);
      if (isLibSQL()) {
        const rows = await dbAll('SELECT * FROM checklist_tasks WHERE user_id = ? ORDER BY sort_order ASC, id ASC', [userId]);
        tasks = rows.map(formatTask);
      } else {
        const d = readJSON();
        tasks = (d.checklist_tasks || [])
          .filter(t => t.user_id === userId)
          .map(formatTask);
      }
    }

    const summary = computeSummary(tasks);

    res.json({
      success: true,
      tasks,
      summary,
      stages: TIMELINE_STAGES,
      categories: CHECKLIST_CATEGORIES
    });
  } catch (err) {
    console.error('Error fetching checklist tasks:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch checklist tasks' });
  }
}

async function createTask(req, res) {
  try {
    const userId = req.user?.uid || 'legacy_user';
    const {
      title,
      category = 'General',
      timeline_stage = 'General',
      due_date = '',
      priority = 'Medium',
      assigned_to = '',
      estimated_cost = 0,
      actual_cost = 0,
      linked_booking_id = null,
      linked_payment_id = null,
      notes = ''
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const now = new Date().toISOString();
    const taskId = `TSK-${Date.now()}`;

    let createdTask;
    if (isLibSQL()) {
      const result = await dbRun(`
        INSERT INTO checklist_tasks (
          task_id, user_id, title, category, timeline_stage,
          due_date, completed, completed_at, priority, assigned_to,
          estimated_cost, actual_cost, linked_booking_id, linked_payment_id,
          notes, is_custom, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?, ?, ?, ?, ?, 1, 9999, datetime('now'), datetime('now'))
      `, [
        taskId, userId, title.trim(), category, timeline_stage,
        due_date, priority, assigned_to,
        Number(estimated_cost) || 0, Number(actual_cost) || 0,
        linked_booking_id ? Number(linked_booking_id) : null,
        linked_payment_id ? Number(linked_payment_id) : null,
        notes
      ]);

      const inserted = await dbGet('SELECT * FROM checklist_tasks WHERE id = ?', [result.lastInsertRowid]);
      createdTask = formatTask(inserted);
    } else {
      const d = readJSON();
      if (!d.checklist_tasks) d.checklist_tasks = [];
      const newId = Date.now();
      const item = {
        id: newId,
        task_id: taskId,
        user_id: userId,
        title: title.trim(),
        category,
        timeline_stage,
        due_date,
        completed: false,
        completed_at: null,
        priority,
        assigned_to,
        estimated_cost: Number(estimated_cost) || 0,
        actual_cost: Number(actual_cost) || 0,
        linked_booking_id: linked_booking_id ? Number(linked_booking_id) : null,
        linked_payment_id: linked_payment_id ? Number(linked_payment_id) : null,
        notes,
        is_custom: true,
        sort_order: 9999,
        created_at: now,
        updated_at: now
      };
      d.checklist_tasks.push(item);
      writeJSON(d);
      createdTask = formatTask(item);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: createdTask
    });
  } catch (err) {
    console.error('Error creating checklist task:', err);
    res.status(500).json({ error: err.message || 'Failed to create checklist task' });
  }
}

async function updateTask(req, res) {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.uid || 'legacy_user';
    const {
      title,
      category,
      timeline_stage,
      due_date,
      completed,
      priority,
      assigned_to,
      estimated_cost,
      actual_cost,
      linked_booking_id,
      linked_payment_id,
      notes,
      sort_order
    } = req.body || {};

    let updatedTask;
    const now = new Date().toISOString();

    if (isLibSQL()) {
      const existing = await dbGet('SELECT * FROM checklist_tasks WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Task not found' });

      let completedVal = existing.completed;
      let completedAt = existing.completed_at;
      if (completed !== undefined) {
        completedVal = completed ? 1 : 0;
        completedAt = completed ? (existing.completed_at || now) : null;
      }

      await dbRun(`
        UPDATE checklist_tasks SET
          title = COALESCE(?, title),
          category = COALESCE(?, category),
          timeline_stage = COALESCE(?, timeline_stage),
          due_date = COALESCE(?, due_date),
          completed = ?,
          completed_at = ?,
          priority = COALESCE(?, priority),
          assigned_to = COALESCE(?, assigned_to),
          estimated_cost = COALESCE(?, estimated_cost),
          actual_cost = COALESCE(?, actual_cost),
          linked_booking_id = ?,
          linked_payment_id = ?,
          notes = COALESCE(?, notes),
          sort_order = COALESCE(?, sort_order),
          updated_at = datetime('now')
        WHERE id = ?
      `, [
        title !== undefined ? title.trim() : null,
        category,
        timeline_stage,
        due_date,
        completedVal,
        completedAt,
        priority,
        assigned_to,
        estimated_cost !== undefined ? Number(estimated_cost) : null,
        actual_cost !== undefined ? Number(actual_cost) : null,
        linked_booking_id !== undefined ? (linked_booking_id ? Number(linked_booking_id) : null) : existing.linked_booking_id,
        linked_payment_id !== undefined ? (linked_payment_id ? Number(linked_payment_id) : null) : existing.linked_payment_id,
        notes,
        sort_order,
        id
      ]);

      const fresh = await dbGet('SELECT * FROM checklist_tasks WHERE id = ?', [id]);
      updatedTask = formatTask(fresh);
    } else {
      const d = readJSON();
      const idx = (d.checklist_tasks || []).findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });

      const item = d.checklist_tasks[idx];
      if (title !== undefined) item.title = title.trim();
      if (category !== undefined) item.category = category;
      if (timeline_stage !== undefined) item.timeline_stage = timeline_stage;
      if (due_date !== undefined) item.due_date = due_date;
      if (completed !== undefined) {
        item.completed = Boolean(completed);
        item.completed_at = item.completed ? (item.completed_at || now) : null;
      }
      if (priority !== undefined) item.priority = priority;
      if (assigned_to !== undefined) item.assigned_to = assigned_to;
      if (estimated_cost !== undefined) item.estimated_cost = Number(estimated_cost) || 0;
      if (actual_cost !== undefined) item.actual_cost = Number(actual_cost) || 0;
      if (linked_booking_id !== undefined) item.linked_booking_id = linked_booking_id ? Number(linked_booking_id) : null;
      if (linked_payment_id !== undefined) item.linked_payment_id = linked_payment_id ? Number(linked_payment_id) : null;
      if (notes !== undefined) item.notes = notes;
      if (sort_order !== undefined) item.sort_order = Number(sort_order);
      item.updated_at = now;

      writeJSON(d);
      updatedTask = formatTask(item);
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (err) {
    console.error('Error updating checklist task:', err);
    res.status(500).json({ error: err.message || 'Failed to update checklist task' });
  }
}

async function toggleTask(req, res) {
  try {
    const id = parseInt(req.params.id);
    let updatedTask;
    const now = new Date().toISOString();

    if (isLibSQL()) {
      const existing = await dbGet('SELECT * FROM checklist_tasks WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Task not found' });

      const newCompleted = existing.completed === 1 ? 0 : 1;
      const completedAt = newCompleted === 1 ? now : null;

      await dbRun(`
        UPDATE checklist_tasks SET
          completed = ?,
          completed_at = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `, [newCompleted, completedAt, id]);

      const fresh = await dbGet('SELECT * FROM checklist_tasks WHERE id = ?', [id]);
      updatedTask = formatTask(fresh);
    } else {
      const d = readJSON();
      const idx = (d.checklist_tasks || []).findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });

      const item = d.checklist_tasks[idx];
      item.completed = !item.completed;
      item.completed_at = item.completed ? now : null;
      item.updated_at = now;

      writeJSON(d);
      updatedTask = formatTask(item);
    }

    res.json({
      success: true,
      task: updatedTask,
      completed: updatedTask.completed
    });
  } catch (err) {
    console.error('Error toggling checklist task:', err);
    res.status(500).json({ error: err.message || 'Failed to toggle task' });
  }
}

async function deleteTask(req, res) {
  try {
    const id = parseInt(req.params.id);

    if (isLibSQL()) {
      const existing = await dbGet('SELECT * FROM checklist_tasks WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Task not found' });
      await dbRun('DELETE FROM checklist_tasks WHERE id = ?', [id]);
    } else {
      const d = readJSON();
      const idx = (d.checklist_tasks || []).findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });
      d.checklist_tasks.splice(idx, 1);
      writeJSON(d);
    }

    res.json({ success: true, message: 'Task deleted successfully', id });
  } catch (err) {
    console.error('Error deleting checklist task:', err);
    res.status(500).json({ error: err.message || 'Failed to delete task' });
  }
}

async function seedDefaultTasks(req, res) {
  try {
    const userId = req.user?.uid || 'legacy_user';
    const { overwrite = false } = req.body || {};

    if (overwrite) {
      if (isLibSQL()) {
        await dbRun('DELETE FROM checklist_tasks WHERE user_id = ?', [userId]);
      } else {
        const d = readJSON();
        d.checklist_tasks = (d.checklist_tasks || []).filter(t => t.user_id !== userId);
        writeJSON(d);
      }
    }

    await seedTasksForUser(userId);

    res.json({
      success: true,
      message: 'Default Indian wedding roadmap seeded successfully'
    });
  } catch (err) {
    console.error('Error seeding checklist tasks:', err);
    res.status(500).json({ error: err.message || 'Failed to seed default tasks' });
  }
}

async function bulkUpdateTasks(req, res) {
  try {
    const { action, taskIds = [], data = {} } = req.body || {};
    if (!action || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'action and taskIds array are required' });
    }

    const ids = taskIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    const now = new Date().toISOString();

    if (isLibSQL()) {
      if (action === 'delete') {
        const placeholders = ids.map(() => '?').join(',');
        await dbRun(`DELETE FROM checklist_tasks WHERE id IN (${placeholders})`, ids);
      } else if (action === 'mark_completed') {
        const placeholders = ids.map(() => '?').join(',');
        await dbRun(`
          UPDATE checklist_tasks SET 
            completed = 1, 
            completed_at = datetime('now'), 
            updated_at = datetime('now') 
          WHERE id IN (${placeholders})
        `, ids);
      } else if (action === 'mark_pending') {
        const placeholders = ids.map(() => '?').join(',');
        await dbRun(`
          UPDATE checklist_tasks SET 
            completed = 0, 
            completed_at = NULL, 
            updated_at = datetime('now') 
          WHERE id IN (${placeholders})
        `, ids);
      } else if (action === 'change_stage' && data.timeline_stage) {
        const placeholders = ids.map(() => '?').join(',');
        await dbRun(`
          UPDATE checklist_tasks SET 
            timeline_stage = ?, 
            updated_at = datetime('now') 
          WHERE id IN (${placeholders})
        `, [data.timeline_stage, ...ids]);
      }
    } else {
      const d = readJSON();
      if (!d.checklist_tasks) d.checklist_tasks = [];
      if (action === 'delete') {
        d.checklist_tasks = d.checklist_tasks.filter(t => !ids.includes(t.id));
      } else {
        d.checklist_tasks.forEach(t => {
          if (ids.includes(t.id)) {
            if (action === 'mark_completed') {
              t.completed = true;
              t.completed_at = now;
            } else if (action === 'mark_pending') {
              t.completed = false;
              t.completed_at = null;
            } else if (action === 'change_stage' && data.timeline_stage) {
              t.timeline_stage = data.timeline_stage;
            }
            t.updated_at = now;
          }
        });
      }
      writeJSON(d);
    }

    res.json({
      success: true,
      message: `Bulk ${action} executed for ${ids.length} tasks`,
      affectedCount: ids.length
    });
  } catch (err) {
    console.error('Error in bulkUpdateTasks:', err);
    res.status(500).json({ error: err.message || 'Failed to perform bulk task update' });
  }
}

module.exports = {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
  seedDefaultTasks,
  bulkUpdateTasks
};
