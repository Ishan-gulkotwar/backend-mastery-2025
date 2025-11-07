const pool = require('../config/database');
const redisClient = require('../config/redis');

// Get all tasks for user
exports.getTasks = async (req, res) => {
  const userId = req.userId;
  const { status, priority } = req.query;
  
  try {
    // Check cache first
    const cacheKey = `tasks:user:${userId}:${status || 'all'}:${priority || 'all'}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return res.json({
        source: 'cache',
        tasks: JSON.parse(cached)
      });
    }
    
    // Build query
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    if (priority) {
      const paramIndex = params.length + 1;
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));
    
    res.json({
      source: 'database',
      tasks: result.rows
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create task
exports.createTask = async (req, res) => {
  const userId = req.userId;
  const { title, description, status, priority, due_date } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, description, status, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, title, description, status || 'pending', priority || 'medium', due_date]
    );
    
    // Invalidate cache
    const pattern = `tasks:user:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    res.status(201).json({
      message: 'Task created',
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  const userId = req.userId;
  const taskId = req.params.id;
  
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  const userId = req.userId;
  const taskId = req.params.id;
  const { title, description, status, priority, due_date } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), priority = COALESCE($4, priority), due_date = COALESCE($5, due_date), updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7 RETURNING *',
      [title, description, status, priority, due_date, taskId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Invalidate cache
    const pattern = `tasks:user:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    res.json({
      message: 'Task updated',
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  const userId = req.userId;
  const taskId = req.params.id;
  
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
      [taskId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Invalidate cache
    const pattern = `tasks:user:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};