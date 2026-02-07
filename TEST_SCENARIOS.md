# 🧪 Test Scenarios - Feature Demonstration

## Scenario 1: Role-Based Access Control (RBAC)

### Objective: Demonstrate different permissions for different roles

#### Test Case 1.1: Viewer Cannot Create Notes
**Steps:**
1. Register/Login as Viewer (viewer@demo.com / viewer123)
2. Navigate to Dashboard
3. Observe: No "Create New Note" button visible

**Expected Result:** ✅ Viewer sees only existing notes, cannot create new ones

**What to Explain:**
> "Viewers have read-only access. The create button is hidden on the frontend, but more importantly, the backend also validates this. If someone tries to bypass the UI and make a direct API call, they'll get a 403 Forbidden error."

---

#### Test Case 1.2: Editor Can Create and Edit Notes
**Steps:**
1. Login as Editor (editor@demo.com / editor123)
2. Click "Create New Note"
3. Enter title: "Sprint Planning"
4. Click Create
5. Open the note and edit content

**Expected Result:** ✅ Editor successfully creates and edits their own notes

**What to Explain:**
> "Editors can create, edit, and delete their own notes. This is the standard user role for most team members."

---

#### Test Case 1.3: Admin Has Full Access
**Steps:**
1. Login as Admin (admin@demo.com / admin123)
2. Create notes
3. View all notes
4. Access activity logs (if implemented)

**Expected Result:** ✅ Admin has unrestricted access

**What to Explain:**
> "Admins have full access to all features. In a production environment, they could also manage users, view analytics, and access audit logs."

---

#### Test Case 1.4: Backend Validation
**Steps:**
1. Login as Viewer
2. Open browser DevTools → Network tab
3. Try to manually POST to /api/notes endpoint
4. Show 403 Forbidden response

**Expected Result:** ✅ Backend rejects unauthorized actions

**What to Explain:**
> "Security is enforced on both frontend and backend. Even if someone bypasses the UI, the backend validates permissions and rejects unauthorized requests."

---

## Scenario 2: Real-Time Collaboration

### Objective: Demonstrate WebSocket-based real-time updates

#### Test Case 2.1: Two Users Editing Simultaneously
**Setup:**
- Browser 1: Admin user
- Browser 2: Editor user

**Steps:**
1. Browser 1: Create note "Team Standup"
2. Browser 1: Open the note
3. Browser 2: Refresh dashboard, open same note
4. Browser 1: Type "Daily standup notes for..."
5. Browser 2: Watch text appear in real-time
6. Browser 2: Add "- Discussed blockers"
7. Browser 1: See the new line appear

**Expected Result:** ✅ Changes sync instantly between both browsers

**What to Explain:**
> "This is powered by Socket.io WebSockets. When a user types, the change is immediately broadcast to all other users viewing the same note. There's no polling or page refresh needed. The changes are also auto-saved to the database after 1 second of inactivity."

---

#### Test Case 2.2: Multiple Note Rooms
**Setup:**
- Browser 1: User A on Note 1
- Browser 2: User B on Note 2
- Browser 3: User C on Note 1

**Steps:**
1. User A types in Note 1
2. User C sees changes (same note)
3. User B does NOT see changes (different note)

**Expected Result:** ✅ Changes only broadcast to users in the same note room

**What to Explain:**
> "Socket.io uses rooms to isolate events. When you open a note, you join that note's room. Changes are only broadcast to users in the same room, not globally. This is efficient and scalable."

---

#### Test Case 2.3: Auto-Save Indicator
**Steps:**
1. Open any note
2. Start typing
3. Observe "Saving..." indicator appears
4. Stop typing
5. After 1 second, indicator disappears

**Expected Result:** ✅ Debounced auto-save works correctly

**What to Explain:**
> "The auto-save is debounced with a 1-second delay. This means it waits for you to stop typing before saving to the database. This reduces unnecessary database writes and improves performance."

---

## Scenario 3: Public Note Sharing

### Objective: Demonstrate public sharing with read-only access

#### Test Case 3.1: Generate Public Link
**Steps:**
1. Login as note owner
2. Open a note
3. Click "Share Note" button
4. Copy the generated public URL

**Expected Result:** ✅ Unique public URL generated

**What to Explain:**
> "When you share a note, the system generates a unique UUID for that note. This UUID is used in the public URL and doesn't expose any internal database IDs."

---

#### Test Case 3.2: Access Public Note Without Login
**Steps:**
1. Open incognito/private browser window
2. Paste the public URL
3. View the note content
4. Try to edit (should be read-only)

**Expected Result:** ✅ Note is viewable without authentication, but read-only

**What to Explain:**
> "Anyone with the link can view the note without logging in. This is useful for sharing meeting notes, documentation, or announcements with external stakeholders. The note is clearly marked as 'PUBLIC NOTE' and is read-only."

---

#### Test Case 3.3: Invalid Public Link
**Steps:**
1. Try to access /public/invalid-uuid-here
2. Show error message

**Expected Result:** ✅ Appropriate error message displayed

**What to Explain:**
> "If someone tries to access a non-existent or private note, they get a clear error message. The system doesn't expose whether a note exists or not for security reasons."

---

## Scenario 4: Search Functionality

### Objective: Demonstrate full-text search

#### Test Case 4.1: Search by Title
**Setup:**
- Create notes with titles: "Sprint Planning", "Team Meeting", "Project Roadmap"

**Steps:**
1. Go to Dashboard
2. Type "Sprint" in search bar
3. Press Enter or click Search

**Expected Result:** ✅ Only "Sprint Planning" note appears

**What to Explain:**
> "The search uses PostgreSQL's ILIKE operator for case-insensitive pattern matching. It searches both title and content fields."

---

#### Test Case 4.2: Search by Content
**Steps:**
1. Create note with title "Q1 Goals"
2. Add content: "Focus on customer acquisition and retention"
3. Search for "retention"

**Expected Result:** ✅ "Q1 Goals" note appears in results

**What to Explain:**
> "Search looks through both titles and content. This is a full-text search that helps users find notes quickly even if they don't remember the exact title."

---

#### Test Case 4.3: Search Respects Permissions
**Steps:**
1. Login as User A
2. Create private note
3. Logout, login as User B
4. Search for User A's note title

**Expected Result:** ✅ User B cannot see User A's private note

**What to Explain:**
> "Search results are filtered based on user permissions. You can only search through notes you own or have been given access to. This maintains data privacy and security."

---

## Scenario 5: Note Management

### Objective: Demonstrate CRUD operations

#### Test Case 5.1: Create Note
**Steps:**
1. Click "Create New Note"
2. Enter title: "New Project Ideas"
3. Click Create

**Expected Result:** ✅ Note created and appears in dashboard

---

#### Test Case 5.2: Edit Note
**Steps:**
1. Open existing note
2. Modify title and content
3. Wait for auto-save

**Expected Result:** ✅ Changes saved automatically

---

#### Test Case 5.3: Delete Own Note
**Steps:**
1. Find a note you own
2. Click "Delete" button
3. Confirm deletion

**Expected Result:** ✅ Note deleted from dashboard and database

**What to Explain:**
> "When a note is deleted, PostgreSQL's CASCADE DELETE automatically removes all related data like collaborators and activity logs. This maintains referential integrity."

---

#### Test Case 5.4: Cannot Delete Others' Notes
**Steps:**
1. Login as User A
2. View User B's shared note
3. Observe: No delete button visible

**Expected Result:** ✅ Users can only delete their own notes

**What to Explain:**
> "The delete button only appears for notes you own. Even if someone tries to make a direct API call to delete another user's note, the backend validates ownership and rejects the request."

---

## Scenario 6: Authentication & Security

### Objective: Demonstrate security features

#### Test Case 6.1: Registration with Password Hashing
**Steps:**
1. Register new user
2. Show in database: password is hashed (not plain text)

**Expected Result:** ✅ Password stored as bcrypt hash

**What to Explain:**
> "Passwords are hashed using bcrypt with 10 salt rounds before storing in the database. Even if the database is compromised, passwords cannot be easily recovered."

---

#### Test Case 6.2: JWT Token Authentication
**Steps:**
1. Login successfully
2. Open DevTools → Application → Memory (or Network tab)
3. Show JWT token in memory
4. Make API request, show Authorization header

**Expected Result:** ✅ Token sent with each request

**What to Explain:**
> "After login, a JWT token is generated and stored in memory. This token is sent with every API request in the Authorization header. The backend verifies the token before processing the request."

---

#### Test Case 6.3: Protected Routes
**Steps:**
1. Logout
2. Try to access /dashboard directly
3. Get redirected to /login

**Expected Result:** ✅ Unauthenticated users redirected to login

**What to Explain:**
> "Protected routes check if the user is authenticated. If not, they're automatically redirected to the login page. This is implemented using a ProtectedRoute component wrapper."

---

#### Test Case 6.4: SQL Injection Prevention
**Steps:**
1. Show code: Parameterized queries
2. Explain: Never concatenate user input

**Code Example:**
```javascript
// ✅ Safe - Parameterized query
pool.query('SELECT * FROM notes WHERE id = $1', [noteId])

// ❌ Unsafe - String concatenation
pool.query(`SELECT * FROM notes WHERE id = ${noteId}`)
```

**What to Explain:**
> "All database queries use parameterized statements. User input is never concatenated into SQL strings, which prevents SQL injection attacks."

---

## Scenario 7: Responsive Design

### Objective: Demonstrate mobile-first responsive design

#### Test Case 7.1: Mobile View
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar
3. Select iPhone 12 (390px)
4. Navigate through app

**Expected Result:** ✅ App works perfectly on mobile

**What to Explain:**
> "The app uses a mobile-first responsive design. On mobile, the layout switches to single column, buttons become full-width, and the header stacks vertically for better usability."

---

#### Test Case 7.2: Tablet View
**Steps:**
1. Select iPad (768px)
2. View dashboard

**Expected Result:** ✅ 2-column note grid on tablet

---

#### Test Case 7.3: Desktop View
**Steps:**
1. View on desktop (1440px)
2. Show multi-column grid

**Expected Result:** ✅ Optimal layout for large screens

---

## Scenario 8: Error Handling

### Objective: Demonstrate graceful error handling

#### Test Case 8.1: Invalid Login
**Steps:**
1. Try to login with wrong password
2. Show error message

**Expected Result:** ✅ Clear error message displayed

---

#### Test Case 8.2: Network Error
**Steps:**
1. Stop backend server
2. Try to create note
3. Show error handling

**Expected Result:** ✅ User-friendly error message

**What to Explain:**
> "All API calls are wrapped in try-catch blocks. If something goes wrong, the user sees a clear error message instead of the app crashing."

---

## 🎯 Demo Sequence Recommendation

**For 5-minute demo:**
1. Scenario 2.1 (Real-time collaboration)
2. Scenario 1.1 & 1.2 (RBAC)
3. Scenario 3.2 (Public sharing)

**For 10-minute demo:**
1. Scenario 6.2 (Authentication)
2. Scenario 1.1, 1.2, 1.4 (RBAC with backend validation)
3. Scenario 2.1 (Real-time collaboration)
4. Scenario 3.1 & 3.2 (Public sharing)
5. Scenario 4.1 (Search)

**For 15-minute demo:**
- All scenarios above + code walkthrough

---

## 📋 Pre-Demo Setup Checklist

```bash
# 1. Start PostgreSQL
# Windows: Check services
# Mac: brew services start postgresql

# 2. Start Backend
cd backend
npm run dev
# Should see: "Server running on port 5000"

# 3. Start Frontend
cd frontend
npm run dev
# Should see: "Local: http://localhost:3000"

# 4. Create Test Users
# Use the registration form to create:
# - admin@demo.com (Admin)
# - editor@demo.com (Editor)
# - viewer@demo.com (Viewer)

# 5. Create Sample Notes
# Login as admin and create 2-3 notes with content

# 6. Open 2 Browser Windows
# Browser 1: Chrome (normal)
# Browser 2: Chrome (incognito) or Firefox
```

---

**You're now ready to demonstrate all features! 🚀**
