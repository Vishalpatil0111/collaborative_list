# 🔧 Troubleshooting Guide - Collaborator Feature

## Issue: "Failed to add collaborator"

### Common Causes & Solutions:

---

### 1. **CORS Issue** (Most Common on Deployed Apps)

**Symptom:** Request blocked by CORS policy

**Solution:** Update backend `.env` file:
```env
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Also check:** Backend `server.js` has correct CORS config:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
```

---

### 2. **User Not Found**

**Symptom:** Error: "User not found"

**Solution:** 
- Make sure the user you're adding exists in the database
- Register the user first before adding as collaborator
- Check email spelling is correct

**Test:**
```sql
SELECT * FROM users WHERE email = 'editor@demo.com';
```

---

### 3. **Not Note Owner**

**Symptom:** Error: "Only note owner can add collaborators"

**Solution:**
- Only the person who created the note can add collaborators
- Login as the note owner
- Check `owner_id` matches your user ID

**Test:**
```sql
SELECT * FROM notes WHERE id = 7;
-- Check if owner_id matches your user ID
```

---

### 4. **Authentication Issue**

**Symptom:** 401 Unauthorized or 403 Forbidden

**Solution:**
- Make sure you're logged in
- Check JWT token is being sent
- Token might be expired - logout and login again

**Check in DevTools:**
```
Network → Headers → Authorization: Bearer <token>
```

---

### 5. **Database Connection**

**Symptom:** 500 Internal Server Error

**Solution:**
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Check database has `note_collaborators` table

**Test connection:**
```bash
psql -U postgres -d collaborative_notes
\dt
# Should show note_collaborators table
```

---

## 🔍 Debugging Steps

### Step 1: Check Backend Logs

Look at your backend console for error messages:
```
Add collaborator request: { noteId: 7, body: {...}, userId: 1 }
Note check result: 1
User search result: 1
Collaborator added successfully
```

### Step 2: Check Network Tab

Open DevTools → Network → Find the POST request:
- **Status:** Should be 200
- **Request Headers:** Should have Authorization token
- **Request Payload:** Should have email
- **Response:** Should show success or error message

### Step 3: Test API Directly

Use Postman or curl:
```bash
curl -X POST https://your-backend.onrender.com/api/notes/7/collaborators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"email":"editor@demo.com","permission":"editor"}'
```

### Step 4: Check Database

```sql
-- Check if note exists
SELECT * FROM notes WHERE id = 7;

-- Check if user exists
SELECT * FROM users WHERE email = 'editor@demo.com';

-- Check existing collaborators
SELECT * FROM note_collaborators WHERE note_id = 7;
```

---

## 🚀 Quick Fix Checklist

For deployed app on Render:

- [ ] Backend `.env` has correct `FRONTEND_URL`
- [ ] Frontend `.env` has correct `VITE_API_URL`
- [ ] CORS is configured with credentials
- [ ] Database is connected
- [ ] Tables are created
- [ ] Users are registered
- [ ] You're logged in as note owner
- [ ] JWT token is valid

---

## 💡 Local Development Fix

If it works locally but not on deployed version:

1. **Update Environment Variables:**
   ```env
   # Backend .env
   FRONTEND_URL=https://your-app.vercel.app
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret
   
   # Frontend .env
   VITE_API_URL=https://your-backend.onrender.com
   ```

2. **Redeploy Both:**
   - Push changes to GitHub
   - Trigger redeploy on Render (backend)
   - Trigger redeploy on Vercel (frontend)

3. **Clear Cache:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Try incognito mode

---

## 🔧 Code Changes Made

### Updated CORS Configuration:
```javascript
// Before
app.use(cors());

// After
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
```

### Added Logging:
```javascript
console.log('Add collaborator request:', { noteId, body, userId });
console.log('Note check result:', noteCheck.rows.length);
console.log('User search result:', userResult.rows.length);
```

### Added Validation:
```javascript
if (!email) {
  return res.status(400).json({ error: 'Email is required' });
}
```

---

## 📝 Testing the Fix

### Test 1: Add Collaborator Locally
```
1. Start backend: npm run dev
2. Start frontend: npm run dev
3. Login as admin@demo.com
4. Create a note
5. Add editor@demo.com as collaborator
6. Should see success message
```

### Test 2: Verify in Database
```sql
SELECT nc.*, u.email, n.title 
FROM note_collaborators nc
JOIN users u ON nc.user_id = u.id
JOIN notes n ON nc.note_id = n.id;
```

### Test 3: Check Collaborator Can Access
```
1. Logout
2. Login as editor@demo.com
3. Go to dashboard
4. Should see the shared note
5. Open it
6. Should be able to edit
```

---

## 🆘 Still Not Working?

### Check These:

1. **Backend URL:** Is it correct in frontend `.env`?
   ```javascript
   // Check in browser console
   console.log(import.meta.env.VITE_API_URL)
   ```

2. **Token:** Is it being sent?
   ```javascript
   // Check in axios config (useAuth.jsx)
   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
   ```

3. **Database:** Are tables created?
   ```sql
   \dt
   -- Should show: users, notes, note_collaborators, activity_logs
   ```

4. **Permissions:** Are you the owner?
   ```sql
   SELECT id, title, owner_id FROM notes WHERE id = 7;
   -- owner_id should match your user id
   ```

---

## 📞 Error Messages Explained

| Error | Meaning | Solution |
|-------|---------|----------|
| `User not found` | Email doesn't exist | Register user first |
| `Only note owner can add collaborators` | You're not the owner | Login as owner |
| `Access token required` | Not logged in | Login again |
| `Invalid token` | Token expired | Logout and login |
| `Email is required` | Missing email in request | Check form input |
| `CORS error` | Frontend/backend mismatch | Update FRONTEND_URL |

---

## ✅ Success Indicators

When it works, you should see:

1. **Network Tab:** Status 200
2. **Response:** `{ "message": "Collaborator added", "user": {...} }`
3. **Alert:** "Collaborator added successfully!"
4. **Collaborator List:** Shows new collaborator
5. **Other User:** Can see note in their dashboard

---

## 🔄 After Fixing

1. Commit changes to Git
2. Push to GitHub
3. Redeploy backend (Render)
4. Redeploy frontend (Vercel)
5. Test on deployed version
6. Clear browser cache
7. Try adding collaborator again

---

**If still having issues, check backend logs on Render dashboard for specific error messages!**
