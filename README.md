# Real-Time Collaborative Notes Application

A production-quality full-stack web application that allows multiple users to create, edit, and collaborate on notes in real time with secure authentication, role-based access control, activity tracking, search, and public read-only sharing.

## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel/Netlify]
- **Backend**: [Deployed on Railway/Render]

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, React Router, Socket.io Client, Axios
- **Backend**: Node.js, Express, Socket.io, JWT, bcryptjs
- **Database**: PostgreSQL
- **Real-time**: WebSockets (Socket.io)

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│  Express Server │◄──►│   PostgreSQL    │
│                 │    │                 │    │    Database     │
│ - Authentication│    │ - REST APIs     │    │                 │
│ - Real-time UI  │    │ - WebSockets    │    │ - Users         │
│ - Note Editor   │    │ - JWT Auth      │    │ - Notes         │
│                 │    │ - Role-based    │    │ - Collaborators │
└─────────────────┘    │   Access        │    │ - Activity Logs │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file:
   ```env
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DATABASE_URL=postgresql://username:password@localhost:5432/collaborative_notes
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb collaborative_notes
   
   # The application will automatically create tables on first run
   ```

5. **Start Backend Server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start Frontend Development Server**
   ```bash
   npm run dev
   ```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notes Table
```sql
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  public_id UUID UNIQUE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Note Collaborators Table
```sql
CREATE TABLE note_collaborators (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(50) DEFAULT 'viewer',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(note_id, user_id)
);
```

### Activity Logs Table
```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/register
Register a new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "editor"
}
```

#### POST /api/login
Login user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Notes Endpoints

#### GET /api/notes
Get all notes accessible to the user
- **Auth**: Required
- **Returns**: Array of notes

#### POST /api/notes
Create a new note
- **Auth**: Required (Editor/Admin)
```json
{
  "title": "My Note",
  "content": "Note content"
}
```

#### GET /api/notes/:id
Get specific note
- **Auth**: Required
- **Returns**: Note object

#### PUT /api/notes/:id
Update note
- **Auth**: Required (Owner only)
```json
{
  "title": "Updated Title",
  "content": "Updated content"
}
```

#### DELETE /api/notes/:id
Delete note
- **Auth**: Required (Owner only)

#### POST /api/notes/:id/share
Generate public share link
- **Auth**: Required (Owner only)
- **Returns**: `{ "publicUrl": "..." }`

### Public Endpoints

#### GET /api/public/:publicId
Get public note (no auth required)
- **Returns**: Public note content

### Search Endpoints

#### GET /api/search?q=query
Search notes by title and content
- **Auth**: Required
- **Returns**: Array of matching notes




### Permissions
- **Create Notes**: Editor, Admin
- **Edit Own Notes**: Editor, Admin
- **Delete Own Notes**: Editor, Admin
- **View Activity Logs**: Admin only
- **Share Notes**: Owner only

## 🔄 Real-Time Features

### WebSocket Events

#### Client to Server
- `joinNote`: Join a note room for real-time updates
- `leaveNote`: Leave a note room
- `noteChange`: Broadcast content changes

#### Server to Client
- `noteUpdated`: Note was saved/updated
- `noteChange`: Real-time content changes from other users

## 🚀 Deployment

### Backend Deployment (Railway/Render)

1. **Environment Variables**
   ```env
   PORT=5000
   JWT_SECRET=production-secret-key
   DATABASE_URL=postgresql://user:pass@host:port/db
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Build Command**: `npm install`
3. **Start Command**: `npm start`

### Frontend Deployment (Vercel/Netlify)

1. **Environment Variables**
   ```env
   VITE_API_URL=https://your-backend-domain.com
   ```

2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Create, edit, delete notes
- [ ] Real-time collaboration
- [ ] Search functionality
- [ ] Public note sharing
- [ ] Role-based permissions

### Test Users
Create test users with different roles:
```bash
# Admin user
POST /api/register
{
  "email": "admin@test.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin"
}

# Editor user
POST /api/register
{
  "email": "editor@test.com",
  "password": "editor123",
  "name": "Editor User",
  "role": "editor"
}

# Viewer user
POST /api/register
{
  "email": "viewer@test.com",
  "password": "viewer123",
  "name": "Viewer User",
  "role": "viewer"
}
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- SQL injection prevention with parameterized queries
- CORS configuration
- Input validation and sanitization

## 📝 Features Implemented

### Core Requirements ✅
- [x] User authentication (JWT)
- [x] Role-based access control
- [x] CRUD operations for notes
- [x] Real-time collaboration via WebSockets
- [x] Activity logging
- [x] Search functionality
- [x] Public read-only sharing

### Technical Requirements ✅
- [x] React frontend with clean state management
- [x] Node.js/Express backend
- [x] PostgreSQL database
- [x] Real-time updates with Socket.io
- [x] JWT authentication
- [x] RESTful API design

## 🐛 Known Issues & Limitations

- Basic conflict resolution (last-write-wins)
- No offline support
- Limited collaborative features (no cursor tracking)
- Basic UI/UX (focused on functionality)

## 🔮 Future Enhancements

- Operational transforms for better conflict resolution
- Rich text editor
- File attachments
- Comment system
- Email notifications
- Mobile app
- Advanced collaboration features

## 📞 Support

For issues or questions, please check the GitHub repository or contact the development team.

---

**Built with ❤️ for real-time collaboration**