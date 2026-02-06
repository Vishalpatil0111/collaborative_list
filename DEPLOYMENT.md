# Deployment Guide

## Quick Deployment Steps

### 1. Database Setup (PostgreSQL)

#### Option A: Railway PostgreSQL
1. Go to [Railway](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from the Connect tab

#### Option B: Render PostgreSQL
1. Go to [Render](https://render.com)
2. Create new PostgreSQL database
3. Copy the External Database URL

### 2. Backend Deployment

#### Railway Deployment
1. Fork/clone this repository
2. Go to [Railway](https://railway.app)
3. Create new project → Deploy from GitHub repo
4. Select the `backend` folder as root directory
5. Add environment variables:
   ```
   PORT=5000
   JWT_SECRET=your-production-secret-key-make-it-long-and-random
   DATABASE_URL=your-postgresql-connection-string
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```
6. Deploy and copy the backend URL

#### Render Deployment
1. Go to [Render](https://render.com)
2. Create new Web Service from GitHub
3. Select `backend` as root directory
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add same environment variables as above

### 3. Frontend Deployment

#### Vercel Deployment
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-domain.railway.app
   ```
5. Deploy

#### Netlify Deployment
1. Go to [Netlify](https://netlify.com)
2. Drag and drop the `frontend/dist` folder (after running `npm run build`)
3. Or connect GitHub repository with build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `frontend`

### 4. Environment Variables Summary

#### Backend (.env)
```env
PORT=5000
JWT_SECRET=your-super-long-random-secret-key-for-production
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.railway.app
```

### 5. Post-Deployment Testing

1. Visit your frontend URL
2. Register a new account
3. Create a note
4. Test real-time collaboration by opening the same note in two browser tabs
5. Test public sharing functionality

### 6. Common Issues & Solutions

#### CORS Issues
- Ensure `FRONTEND_URL` in backend matches your actual frontend domain
- Check that frontend is making requests to correct backend URL

#### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure database allows external connections
- Check if database service is running

#### WebSocket Issues
- Some hosting providers may not support WebSockets
- Railway and Render both support WebSockets by default

### 7. Production Checklist

- [ ] Strong JWT secret (at least 32 characters)
- [ ] Database backups configured
- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] Environment variables set correctly
- [ ] CORS configured for production domain
- [ ] Error monitoring setup (optional)

### 8. Monitoring & Maintenance

#### Health Check Endpoints
- Backend: `GET /api/notes` (requires auth)
- Frontend: Check if login page loads

#### Logs
- Railway: View logs in dashboard
- Render: View logs in service dashboard
- Vercel: View function logs in dashboard

### 9. Scaling Considerations

For production use, consider:
- Database connection pooling
- Redis for session storage
- CDN for static assets
- Load balancing for multiple backend instances
- Database indexing for better search performance

---

**Estimated Deployment Time: 15-30 minutes**

Need help? Check the main README.md for detailed setup instructions.