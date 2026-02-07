import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool, initDB } from './database.js';
import { authenticateToken, checkPermission } from './auth.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Initialize database
await initDB();

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, role = 'editor' } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, role]
    );
    
    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET);
    res.json({ token, user: result.rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0 || !await bcrypt.compare(password, result.rows[0].password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Notes Routes
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT n.*, u.name as owner_name 
      FROM notes n 
      JOIN users u ON n.owner_id = u.id 
      LEFT JOIN note_collaborators nc ON n.id = nc.note_id 
      WHERE n.owner_id = $1 OR nc.user_id = $1
      ORDER BY n.updated_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', authenticateToken, checkPermission('editor'), async (req, res) => {
  try {
    const { title, content = '' } = req.body;
    const publicId = uuidv4();
    
    const result = await pool.query(
      'INSERT INTO notes (title, content, owner_id, public_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, req.user.id, publicId]
    );
    
    await pool.query(
      'INSERT INTO activity_logs (user_id, note_id, action) VALUES ($1, $2, $3)',
      [req.user.id, result.rows[0].id, 'create']
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, u.name as owner_name 
      FROM notes n 
      JOIN users u ON n.owner_id = u.id 
      LEFT JOIN note_collaborators nc ON n.id = nc.note_id 
      WHERE n.id = $1 AND (n.owner_id = $2 OR nc.user_id = $2)
    `, [req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const result = await pool.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND owner_id = $4 RETURNING *',
      [title, content, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }
    
    await pool.query(
      'INSERT INTO activity_logs (user_id, note_id, action) VALUES ($1, $2, $3)',
      [req.user.id, req.params.id, 'update']
    );
    
    // Emit real-time update
    io.to(`note-${req.params.id}`).emit('noteUpdated', result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND owner_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }
    
    await pool.query(
      'INSERT INTO activity_logs (user_id, note_id, action) VALUES ($1, $2, $3)',
      [req.user.id, req.params.id, 'delete']
    );
    
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public note access
app.get('/api/public/:publicId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT title, content, created_at, updated_at FROM notes WHERE public_id = $1 AND is_public = true',
      [req.params.publicId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Public note not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes/:id/share', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notes SET is_public = true WHERE id = $1 AND owner_id = $2 RETURNING public_id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }
    
    await pool.query(
      'INSERT INTO activity_logs (user_id, note_id, action) VALUES ($1, $2, $3)',
      [req.user.id, req.params.id, 'share']
    );
    
    res.json({ publicUrl: `${process.env.FRONTEND_URL}/public/${result.rows[0].public_id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search
app.get('/api/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const result = await pool.query(`
      SELECT DISTINCT n.*, u.name as owner_name 
      FROM notes n 
      JOIN users u ON n.owner_id = u.id 
      LEFT JOIN note_collaborators nc ON n.id = nc.note_id 
      WHERE (n.owner_id = $1 OR nc.user_id = $1) 
      AND (n.title ILIKE $2 OR n.content ILIKE $2)
      ORDER BY n.updated_at DESC
    `, [req.user.id, `%${q}%`]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activity logs
app.get('/api/activity', authenticateToken, checkPermission('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*, u.name as user_name, n.title as note_title 
      FROM activity_logs al 
      JOIN users u ON al.user_id = u.id 
      LEFT JOIN notes n ON al.note_id = n.id 
      ORDER BY al.timestamp DESC 
      LIMIT 100
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add collaborator to note
app.post('/api/notes/:id/collaborators', authenticateToken, async (req, res) => {
  try {
    console.log('Add collaborator request:', { noteId: req.params.id, body: req.body, userId: req.user.id });
    
    const { email, permission = 'editor' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user is note owner
    const noteCheck = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    
    console.log('Note check result:', noteCheck.rows.length);
    
    if (noteCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only note owner can add collaborators' });
    }
    
    // Find user by email
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );
    
    console.log('User search result:', userResult.rows.length);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const collaboratorId = userResult.rows[0].id;
    
    // Add collaborator
    await pool.query(
      'INSERT INTO note_collaborators (note_id, user_id, permission) VALUES ($1, $2, $3) ON CONFLICT (note_id, user_id) DO UPDATE SET permission = $3',
      [req.params.id, collaboratorId, permission]
    );
    
    console.log('Collaborator added successfully');
    
    res.json({ message: 'Collaborator added', user: userResult.rows[0] });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get collaborators for a note
app.get('/api/notes/:id/collaborators', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, nc.permission, nc.added_at
      FROM note_collaborators nc
      JOIN users u ON nc.user_id = u.id
      WHERE nc.note_id = $1
    `, [req.params.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove collaborator
app.delete('/api/notes/:id/collaborators/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user is note owner
    const noteCheck = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (noteCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only note owner can remove collaborators' });
    }
    
    await pool.query(
      'DELETE FROM note_collaborators WHERE note_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    
    res.json({ message: 'Collaborator removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('joinNote', (noteId) => {
    socket.join(`note-${noteId}`);
    console.log(`User ${socket.id} joined note ${noteId}`);
  });
  
  socket.on('leaveNote', (noteId) => {
    socket.leave(`note-${noteId}`);
    console.log(`User ${socket.id} left note ${noteId}`);
  });
  
  socket.on('noteChange', (data) => {
    socket.to(`note-${data.noteId}`).emit('noteChange', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});