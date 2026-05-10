# Setup & Testing Guide

## 🚀 Quick Start

### Backend Setup

1. **Ensure MongoDB is running**
```bash
# On Windows
mongod

# Or use MongoDB Atlas connection string in .env
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables** (`.env`)
```
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=smart-hostel
PORT=3001
```

4. **Start the server**
```bash
npm run server
```

### Frontend Setup

1. **Install dependencies**
```bash
npm install
```

2. **Start development server**
```bash
npm run dev
```

3. **Build for production**
```bash
npm run build
```

---

## ✅ Testing Workflow

### Test 1: Worker Completion Workflow

**Prerequisites:**
- Create a complaint as student
- Assign to a worker through admin

**Steps:**
1. Login as worker
2. Go to "My Tasks"
3. Find assigned complaint (status: "Assigned")
4. Click "Start Work"
   - Expected: Status changes to "In Progress"
   - Check: Verify `workStartedAt` is recorded

5. Click "Mark as Completed"
   - Modal opens for image upload

6. Upload image proof
   - Drag and drop OR click to select
   - Verify preview appears
   - Expected: Image shows in preview area

7. Add remarks (optional)
   - Example: "Leak fixed, water flow normal"

8. Click "Submit Completion"
   - Expected: Request sent with multipart/form-data
   - Check: Loading state shows during upload
   - Success: Toast shows "Work completed and proof uploaded"
   - Status: Changes to "Completed"
   - `completionImage` recorded
   - `verificationStatus`: "Awaiting"

---

### Test 2: Duplicate Complaint Detection

**Prerequisites:**
- None

**Steps:**
1. Login as Student
2. Go to "Raise Complaint"
3. Fill form:
   ```
   Title: "Fan not working"
   Hostel: "A"
   Room: "101"
   Category: "Electric"
   Description: "Ceiling fan makes noise"
   ```
4. Click "Register Complaint"
   - Expected: Success message
   - Status: "Pending"
   - Count: 1

5. Create identical complaint again:
   ```
   Same hostel, room, category
   Different title/description
   ```
6. Click "Register Complaint"
   - Expected: SUCCESS (not error)
   - Message: "Similar complaint already exists. Total: 2 reports"
   - Original complaint: Count increments to 2
   - `reportedBy` includes both students

7. View in Student Dashboard:
   - Complaint shows badge: "2 reports"

---

### Test 3: Admin Verification

**Prerequisites:**
- Complete Test 1 (worker completion)

**Steps:**
1. Login as Admin
2. Go to Admin menu → "Verification Dashboard"
3. See "Awaiting Verification" tab
   - Shows completed complaint
   - Display stats: "1 Awaiting Verification"

4. View complaint details:
   - Before image visible
   - After image visible (completion proof)
   - Worker remarks displayed
   - Timeline shown

5. **Option A: Verify**
   - Click "Verify & Complete"
   - Status: Changes to "Verified"
   - `verifiedBy`: Admin name recorded
   - Tab: Moves to "Verified" tab
   - Student notification sent

6. **Option B: Reject**
   - Click "Reject"
   - Form appears: Add rejection reason
   - Example: "Image not clear enough"
   - Click "Confirm Rejection"
   - Status: Changes back to "In Progress"
   - `verificationStatus`: "Rejected"
   - Worker gets notification with reason
   - Worker can resubmit

---

### Test 4: Status Flow Validation

**Edge Cases:**

1. **Worker tries to complete without image**
   - Expected: Form prevents submission
   - Button disabled: "Submit Completion"
   - Error shown: "Image proof is required"

2. **Worker tries to mark complete when status is "Completed"**
   - Expected: Backend rejects with 400
   - Error: "Cannot complete work. Current status is Completed."

3. **Wrong worker tries to start another's task**
   - Expected: Backend rejects with 403
   - Error: "You are not assigned to this complaint"

4. **Admin tries to verify pending complaint**
   - Expected: Backend rejects with 400
   - Error: "Complaint status must be 'Completed'"

---

### Test 5: Image Upload Edge Cases

**Test File Upload:**
1. File too large (>5MB)
   - Expected: Error shown before upload

2. Wrong file type (PDF, text file)
   - Expected: Error shown

3. Valid image (JPG, PNG <5MB)
   - Expected: Preview shown, upload works

4. Mobile drag-and-drop
   - Expected: Works on mobile browsers

---

### Test 6: Responsive Design

**Desktop (1024px+)**
- [ ] All buttons visible
- [ ] Images display properly
- [ ] Form layout is horizontal

**Tablet (768px-1023px)**
- [ ] Layout adapts
- [ ] Buttons stack if needed
- [ ] Images resize

**Mobile (< 768px)**
- [ ] Vertical layout
- [ ] Touch-friendly buttons
- [ ] Image preview responsive
- [ ] Form single column
- [ ] Upload works properly

---

## 🔍 Database Verification

### Check Complaint Schema
```javascript
// In MongoDB
db.complaints.findOne({})

// Should contain:
{
  _id: ObjectId,
  title: String,
  description: String,
  hostel: String,
  roomNo: String,
  category: String,
  status: String,              // "Assigned", "In Progress", "Completed", "Verified"
  completionImage: String,     // URL or null
  remarks: String,
  complaintCount: Number,      // >= 1
  reportedBy: [String],        // Array of student GRNs
  verificationStatus: String,  // "Pending", "Awaiting", "Verified", "Rejected"
  workStartedAt: Date,
  workCompletedAt: Date,
  verifiedAt: Date,
  createdAt: Date,
  lastUpdatedAt: Date
}
```

### Verify Indexes
```javascript
db.complaints.getIndexes()

// Should include:
// - { hostel: 1, roomNo: 1, category: 1 }  // For duplicate detection
// - { status: 1 }
// - { createdAt: -1 }
// - { assigned_worker_id: 1 }
```

---

## 📊 Manual Testing Checklist

- [ ] Worker can start assigned work
- [ ] Worker must upload image to complete
- [ ] Image preview shows before upload
- [ ] Worker remarks are saved
- [ ] Completion image stored in `/uploads/`
- [ ] Admin sees "Awaiting Verification" count
- [ ] Admin can view before/after images
- [ ] Admin can verify completion
- [ ] Admin can reject with reason
- [ ] Student receives notification
- [ ] Duplicate complaints increment count
- [ ] Complaint count badge displays
- [ ] Student sees duplicate message
- [ ] Hostel/room required for complaints
- [ ] All error messages display correctly
- [ ] Loading states show during operations
- [ ] Mobile layout is responsive
- [ ] Images load correctly
- [ ] Timestamps are accurate

---

## 🐛 Debugging Tips

### Enable Logs
```javascript
// In browser console
localStorage.debug = '*'
```

### Check Network
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR/Fetch
4. Check request/response bodies
5. Verify headers (multipart/form-data for uploads)

### Check File Uploads
```bash
# Verify files in uploads directory
ls -la /path/to/uploads/

# Check file permissions
chmod 755 /path/to/uploads
```

### MongoDB Queries
```javascript
// Count duplicates
db.complaints.find({ hostel: "A", roomNo: "101" })

// Check verification status
db.complaints.find({ verificationStatus: "Awaiting" })

// Find by student
db.complaints.find({ grnNumber: "STUDENT123" })
```

---

## 🚨 Common Issues & Solutions

### Issue: Image upload fails
**Solutions:**
- Check file size (max 5MB)
- Verify file format (JPG, PNG)
- Check `/uploads` directory exists and writable
- Check Content-Type headers
- Verify multer configuration

### Issue: Duplicate detection not working
**Solutions:**
- Ensure hostel & roomNo are filled
- Check complaint status (not closed)
- Verify database query

### Issue: Verification button missing
**Solutions:**
- Check user role is Admin
- Check complaint status is "Completed"
- Check completion image exists
- Refresh page

### Issue: Worker can't see task
**Solutions:**
- Check task is assigned to correct worker
- Verify worker status is active
- Check user role is "Worker"
- Verify complaint exists

---

## 📱 Mobile Testing

### iOS Safari
- Test image upload
- Check responsive layout
- Verify touch interactions
- Test drag-and-drop

### Android Chrome
- Test image upload
- Check responsive layout
- Verify camera access (if needed)
- Test native file picker

### Desktop Chrome/Firefox
- Test all features
- Check console for errors
- Verify network requests
- Test keyboard navigation

---

## 🎯 Performance Testing

### Metrics to Monitor
- Image upload time
- API response time
- Page load time
- Network payload size

### Optimization Tips
- Image compression
- API caching
- Database indexing
- Lazy loading

---

## 📝 Post-Deployment

1. **Monitor logs** for errors
2. **Check uploads folder** for file accumulation
3. **Verify** database growth
4. **Test** with actual users
5. **Gather feedback** on UX
6. **Monitor performance** metrics

