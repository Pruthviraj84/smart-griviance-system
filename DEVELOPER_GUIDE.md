# Developer Quick Start Guide

## 🎯 What's New in This Version?

Your Smart Grievance Management System has been enhanced with:
1. ✅ **Worker Image Proof Requirements** - Workers must upload image to complete tasks
2. ✅ **Admin Verification Dashboard** - Admins review and approve/reject work
3. ✅ **Intelligent Duplicate Detection** - Prevents identical complaints, tracks demand
4. ✅ **Improved UI/UX** - Better workflows, status indicators, mobile support

---

## 🏃 Super Quick Start (5 minutes)

### 1. Install & Setup
```bash
cd system
npm install
npm run server      # Terminal 1: Start backend
npm run dev        # Terminal 2: Start frontend
```

### 2. Test the Features
```
1. Login as Student → Create complaint (enter Hostel A, Room 101)
2. Login as Admin → Assign to Worker
3. Login as Worker → See "Start Work" button → Click it
4. Click "Mark as Completed" → Upload image → Submit
5. Login as Admin → Go to Verification → See pending work → Verify
```

### 3. Test Duplicate Detection
```
1. Create second complaint (same Hostel, Room, Category)
2. Get message: "Similar complaint already exists. Total: 2 reports"
3. Check badge on dashboard: Shows "2 reports"
```

---

## 📁 File Organization

### New Frontend Components
```javascript
// All in src/components/common/

CompleteWorkModal.jsx          // Image upload form for workers
  ├─ Props: complaint, onClose, onSubmit, isLoading
  ├─ Features: Preview, validation, remarks
  └─ Used in: WorkerTasks

WorkerComplaintCard.jsx        // Display task with action buttons
  ├─ Props: complaint, userRole, onStartWork, onCompleteWork
  ├─ Features: Timeline, status, buttons
  └─ Used in: WorkerTasks

ComplaintVerificationCard.jsx  // Admin verification interface
  ├─ Props: complaint, userRole, onVerify, onReject
  ├─ Features: Before/after comparison, rejection form
  └─ Used in: AdminVerification
```

### New Pages
```javascript
// src/pages/admin/

AdminVerification.jsx          // Verification dashboard
  ├─ Tabs: Awaiting, Verified, Rejected
  ├─ Features: Stats, verification checklist
  └─ Endpoints: GET /api/complaints, PATCH /verify, PATCH /reject-verification
```

### Updated Pages
```javascript
WorkerTasks.jsx                // Updated with new components
StudentComplaints.jsx          // Shows duplicate detection message
ComplaintComposer.jsx          // Added hostel & room fields
```

### Backend Enhancements
```javascript
// server/routes/complaintRoutes.js

Added 5 new endpoints:
1. PATCH /api/complaints/:id/start-work
2. PATCH /api/complaints/:id/complete-work
3. PATCH /api/complaints/:id/verify
4. PATCH /api/complaints/:id/reject-verification
5. POST /api/complaints (enhanced with duplicate detection)
```

---

## 🔌 Key Integration Points

### Component Communication

```javascript
// Worker Flow
WorkerTasks
  ├─ Shows: complaints.filter(c => c.assignedTo === user.name)
  ├─ Renders: WorkerComplaintCard for each
  │   ├─ Click "Start Work" → calls API → updates complaint
  │   └─ Click "Complete" → opens CompleteWorkModal
  │       └─ Upload image → calls API → refreshes list

// Admin Flow
AdminVerification
  ├─ Fetches: complaints with status = "Completed"
  ├─ Renders: ComplaintVerificationCard for each
  │   ├─ Click "Verify" → calls API → updates complaint
  │   └─ Click "Reject" → opens form → calls API

// Student Flow
StudentComplaints
  ├─ Uses: ComplaintComposer
  ├─ On submit: POST /api/complaints with hostel & roomNo
  └─ Response: { isDuplicate: true/false, complaintCount: N }
```

---

## 🔄 Data Flow Examples

### Example 1: Worker Completing Work

```javascript
// Step 1: Worker clicks "Mark as Completed"
const handleCompleteWork = (complaint) => {
  setSelectedComplaint(complaint);
  setShowCompleteModal(true);  // Opens modal
};

// Step 2: Modal appears - worker uploads image & remarks
// Step 3: Worker clicks submit
const handleCompleteWorkSubmit = async (formData) => {
  // formData contains:
  // - completionImage (File)
  // - remarks (string)
  
  const res = await fetch(
    `/api/complaints/${complaint._id}/complete-work`,
    { method: 'PATCH', headers: getAuthHeaders(), body: formData }
  );
  // Backend: Updates complaint, stores image, returns success
};

// Step 4: UI updates - status shows "Completed", awaiting verification
```

### Example 2: Duplicate Detection

```javascript
// Student submits complaint
const handleSubmit = async (formData) => {
  // formData includes:
  // - title, description, category
  // - hostel, roomNo  ← New fields
  // - images
  
  const res = await fetch('/api/complaints', {
    method: 'POST',
    body: formData
  });
  
  const data = await res.json();
  
  if (data.isDuplicate) {
    // Show: "Similar complaint already exists. Total: 2 reports"
    success(`Found duplicate! Count: ${data.complaintCount}`);
  } else {
    // Show: "Complaint submitted successfully!"
    success('Complaint submitted!');
  }
};
```

---

## 🛠️ Common Tasks

### Add New Feature to Worker Workflow

```javascript
// 1. Add Backend Endpoint (server/routes/complaintRoutes.js)
router.patch('/:id/new-action', verifyToken, async (req, res) => {
  const complaint = await complaints.findOne({ _id: new ObjectId(id) });
  // Your logic here
  await complaints.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { /* updates */ } }
  );
});

// 2. Add Frontend Method (src/pages/worker/WorkerTasks.jsx)
const handleNewAction = async (complaint) => {
  const res = await fetch(`${API_BASE}/api/complaints/${complaint._id}/new-action`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  if (res.ok) {
    // Update state
    fetchComplaints();
  }
};

// 3. Add UI Button (WorkerComplaintCard.jsx)
{status === 'SomeStatus' && (
  <Button onClick={() => onNewAction(complaint)}>
    Action Label
  </Button>
)}
```

### Add New Filter to Admin Dashboard

```javascript
// Add to AdminVerification.jsx filters
const [filters, setFilters] = useState({
  category: '',  // Add this
  priority: '',  // Or this
});

// Filter complaints
const filtered = complaints.filter(c => {
  if (filters.category && c.category !== filters.category) return false;
  if (filters.priority && c.priority !== filters.priority) return false;
  return true;
});

// Add filter UI
<select 
  value={filters.category}
  onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}
>
  <option value="">All Categories</option>
  {CATEGORIES.map(cat => <option value={cat}>{cat}</option>)}
</select>
```

---

## 🐛 Debugging Common Issues

### Image Upload Not Working

```javascript
// Check 1: Verify multipart/form-data
// ❌ Wrong
body: JSON.stringify({ image, remarks })

// ✅ Correct
const formData = new FormData();
formData.append('completionImage', imageFile);
formData.append('remarks', remarks);
body: formData

// Check 2: Verify headers
// ❌ Wrong (sets wrong content-type)
headers: { 'Content-Type': 'application/json' }

// ✅ Correct (let browser set it)
headers: getAuthHeaders()  // No Content-Type

// Check 3: Verify file input
<input type="file" accept="image/*" onChange={handleImageChange} />
```

### Duplicate Detection Not Triggering

```javascript
// Check: Are you including hostel & roomNo?
const formData = new FormData();
formData.append('hostel', hostel);      // Must include
formData.append('roomNo', roomNo);      // Must include
formData.append('category', category);  // Used for matching
formData.append('title', title);
formData.append('description', description);

// Check: Is complaint status closed?
// Duplicate detection ignores closed complaints
// Only matches: status NOT IN ['Completed', 'Verified', 'Resolved']
```

### API Response 403 (Unauthorized Worker)

```javascript
// Problem: Worker not assigned to this complaint
// Solution: Verify in backend
if (complaint.assignedTo !== workerName && complaint.workerName !== workerName) {
  return res.status(403).json({ message: 'You are not assigned to this complaint' });
}

// Fix: Check admin console → verify assignment
```

---

## 📊 Database Queries (MongoDB)

### Find Complaints Awaiting Verification
```javascript
db.complaints.find({ verificationStatus: "Awaiting" })
```

### Find Duplicate Complaints (same location, category)
```javascript
db.complaints.find({ hostel: "A", roomNo: "101" })
```

### Find All Complaints by Student
```javascript
db.complaints.find({ grnNumber: "STUDENT123" })
```

### Update Complaint Status
```javascript
db.complaints.updateOne(
  { _id: ObjectId("...") },
  { $set: { status: "Verified", verifiedAt: new Date() } }
)
```

---

## 🎯 Testing Workflow

### Test Duplicate Detection
```bash
# Test Case 1: Create unique complaint
POST /api/complaints
Body: hostel=A, room=101, category=Electric
Expected: isDuplicate=false, complaintCount=1

# Test Case 2: Create duplicate
POST /api/complaints
Body: hostel=A, room=101, category=Electric (same)
Expected: isDuplicate=true, complaintCount=2

# Verify DB
db.complaints.findOne({ hostel: "A", roomNo: "101" })
# Should show: complaintCount: 2, reportedBy: [grn1, grn2]
```

### Test Worker Workflow
```bash
# Step 1: Start work
PATCH /api/complaints/123/start-work
Expected: status="In Progress", workStartedAt=now

# Step 2: Complete work (multipart)
PATCH /api/complaints/123/complete-work
Headers: multipart/form-data
Body: completionImage=FILE, remarks="Done"
Expected: status="Completed", completionImage="/uploads/...", verificationStatus="Awaiting"

# Step 3: Admin verifies
PATCH /api/complaints/123/verify
Expected: status="Verified", verifiedBy="Admin", verifiedAt=now
```

---

## 📚 Component Props Reference

### WorkerComplaintCard
```typescript
{
  complaint: ComplaintObject,
  userRole: string,              // "Worker", "Admin", etc
  onStartWork: () => void,
  onCompleteWork: () => void,
  isLoading: boolean
}
```

### CompleteWorkModal
```typescript
{
  complaint: ComplaintObject,
  onClose: () => void,
  onSubmit: (formData: FormData) => Promise<void>,
  isLoading: boolean
}
```

### ComplaintVerificationCard
```typescript
{
  complaint: ComplaintObject,
  userRole: string,
  onVerify: () => Promise<void>,
  onReject: (reason: string) => Promise<void>,
  isLoading: boolean
}
```

---

## 🚀 Performance Tips

1. **Image Optimization**
   - Compress images before upload
   - Use appropriate format (JPG for photos, PNG for screenshots)
   - Consider max file size

2. **Database Indexing**
   ```javascript
   // Already created:
   db.complaints.createIndex({ hostel: 1, roomNo: 1, category: 1 })
   db.complaints.createIndex({ status: 1 })
   db.complaints.createIndex({ verificationStatus: 1 })
   ```

3. **API Caching**
   - Cache worker list (changes infrequently)
   - Cache complaint list with short TTL
   - Invalidate on updates

---

## 🔐 Security Checklist

- ✅ Verify worker is assigned before allowing status update
- ✅ Verify admin role for verification endpoints
- ✅ Validate file upload (size, type)
- ✅ Sanitize user inputs
- ✅ Use HTTPS in production
- ✅ Keep tokens secure

---

## 📖 Further Reading

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Detailed features
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing procedures
- [FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md) - High-level overview

