# Smart Hostel Grievance Management System - Enhanced Version

## 🚀 Recent Enhancements & Features

### ✅ Authentication System (UPGRADED)
- **JWT-based Authentication**: Secure token-based authentication for all users
- **Password Encryption**: Bcrypt hashing for secure password storage
- **Student Self-Registration**: Students can now register with:
  - Name, Email, Phone, Password
  - Room Number and Hostel Block information
  - Email format validation
  - Password strength validation (minimum 6 characters)
- **Token Persistence**: JWT tokens stored in localStorage for session management
- **Role-based Login**: Separate login endpoints for Student, Worker, Admin, Super Admin
- **Logout Functionality**: Clear tokens and session data on logout

### 📋 Student Features
- **Self Registration**: Register without admin intervention
- **Complaint Submission**:
  - Title, Description, Location, Contact Details
  - Multiple image uploads (up to 5 images)
  - Auto-categorization based on keywords
  - Auto-priority assignment
- **View My Complaints**: See only their own complaints
- **Track Status**: Real-time status updates
- **Statistics Dashboard**:
  - Total complaints
  - Pending complaints
  - Solved complaints

### 🛠 Worker Features
- **Assigned Complaints Dashboard**: View only assigned tasks
- **Status Updates**: Move from In Progress to Completed
- **Upload Proof Images**: Submit after work completion
- **Work Remarks**: Add notes about the work done
- **Workload Statistics**:
  - Total assigned tasks
  - Pending work
  - Completed work

### 👨‍💼 Admin Dashboard
- **Complaint Management**:
  - View all complaints with advanced filters
  - Search by Student Name, Complaint ID, Title, Category
  - Filter by Status, Priority, Category
- **Worker Management**:
  - Add new workers with secure passwords
  - Delete workers
  - Search and manage worker directory
  - View worker performance metrics
- **Assignment System**:
  - Assign complaints to workers via dropdown
  - Real-time worker availability
- **Status Management**:
  - Update complaint status
  - Verify worker-submitted proof
  - Resolve complaints
  - Archive solved complaints
- **Worker Workload View**:
  - See total, pending, and completed work per worker
  - Click to view detailed worker history

### 👑 Super Admin Features
- **System Analytics**:
  - Complaints per day calculation
  - Resolution rate percentage
  - Active admins count
  - Delayed complaint alerts
- **Delay Management**:
  - Auto-detect complaints pending > 4 days
  - Visual red indicators for delayed items
  - Priority escalation for delayed complaints
  - Real-time notifications
- **Force Resolution**:
  - Override and mark complaints as solved
  - Reopen completed complaints if needed
  - Change complaint priority
- **Admin Performance**:
  - Track admin efficiency
  - View completion metrics
  - Generate reports

### 📊 Advanced Features

#### Image Handling
- **Before/After Comparison**: Side-by-side image display
- **Image Thumbnails**: Compact image strip view
- **Full Image Preview**: Click to expand images
- **Multiple File Upload**: Support for up to 5 images per complaint

#### Delay Detection & Management
- **Automated Detection**: CRON job checks daily for stale complaints
- **4-Day Threshold**: Complaints pending > 4 days marked as delayed
- **Priority Escalation**: Auto-escalate priority for delayed items
- **Visual Indicators**: Red highlighting for delayed complaints
- **Super Admin Notifications**: Real-time alerts for escalated complaints

#### Search & Filter System
- **Complaint Search**:
  - By Student Name
  - By Complaint ID
  - By Category
  - By Title
- **Advanced Filters**:
  - Status (Pending, Assigned, In Progress, Solved, Delayed)
  - Priority (Low, Medium, High, Urgent)
  - Category (Water, Electricity, Security, Internet, Cleaning, Food, Furniture, Tiles, Others)
  - Date Range (for Super Admin)

#### Status Flow & Lifecycle
- **Complaint Lifecycle**: Pending → Assigned → In Progress → Completed → Verified → Resolved
- **Timeline Tracking**: Timestamps for each stage
- **Audit Logging**: Track all actions and state changes
- **Complaint Archive**: Solved complaints moved to archive collection

### 🎨 UI/UX Improvements
- **Responsive Design**: Mobile-friendly layout
- **Modern Cards**: Clean dashboard cards with statistics
- **Color-Coded Status**: Visual indicators for complaint status
- **Loading States**: Spinners during async operations
- **Toast Notifications**: Success, error, and info messages
- **Form Validation**: Real-time validation with error messages
- **Modal Dialogs**: Detailed complaint and worker information modals

## 🛠 Tech Stack

### Frontend
- **React 18**: Latest React with hooks
- **React Router v6**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: 483+ icons
- **Vite**: Fast build tool
- **JWT**: Token-based authentication

### Backend
- **Node.js + Express**: Fast server framework
- **MongoDB**: NoSQL database
- **Bcryptjs**: Password hashing
- **Jsonwebtoken**: JWT token generation and verification
- **Multer**: File upload middleware
- **Node-Cron**: Scheduled tasks (daily escalation)
- **CORS**: Cross-origin resource sharing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Frontend Setup
```bash
cd system/system
npm install
npm run dev
```

### Backend Setup
```bash
cd system/system
npm install
node server.js
```

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=smart-hostel
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=7d
CLIENT_ORIGIN=http://localhost:5173
```

## 🔑 Default Credentials

### Student
- Email: `student@hostel.com`
- Password: `Student@123`

### Worker
- Email: `vikram@hostel.com` (and others)
- Password: `Worker@123`

### Admin
- Email: `admin@hostel.com`
- Password: `Admin@123`

### Super Admin
- Email: `superadmin@hostel.com`
- Password: `SuperAdmin@123`

## 📱 API Endpoints

### Authentication
- `POST /api/students/register` - Student registration
- `POST /api/students/login` - Student login
- `POST /api/worker/login` - Worker login
- `POST /api/admin/login` - Admin login
- `POST /api/superadmin/login` - Super Admin login

### Complaints
- `GET /api/complaints` - Get complaints (filtered by role)
- `POST /api/complaints` - Create new complaint (with image upload)
- `PATCH /api/complaints/:id/status` - Update status
- `PATCH /api/complaints/:id/assign` - Assign worker
- `PATCH /api/complaints/:id/priority` - Update priority
- `DELETE /api/complaints/:id` - Archive complaint
- `PATCH /api/workers/complaints/:id/complete` - Submit proof (worker)
- `PATCH /api/admin/complaints/:id/verify` - Verify complaint (admin)
- `PATCH /api/superadmin/complaints/:id/override` - Override action (super admin)

### Workers
- `GET /api/admin/workers` - Get all workers
- `POST /api/admin/workers` - Create worker
- `DELETE /api/admin/workers/:id` - Delete worker
- `GET /api/admin/workers/:id/complaints` - Get worker's complaints

## 🗄️ Database Schema

### Students Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (bcrypt hashed),
  name: String,
  phone: String,
  roomNo: String,
  hostelBlock: String,
  role: "Student",
  isVerified: Boolean,
  createdAt: Date
}
```

### Complaints Collection
```javascript
{
  _id: ObjectId,
  studentName: String,
  email: String,
  title: String,
  description: String,
  category: String,
  priority: String,
  location: String,
  contact: String,
  images: [String], // Array of image URLs
  status: String,
  assignedTo: String,
  assigned_worker_id: ObjectId,
  workerProofImages: [String],
  createdAt: Date,
  assigned_at: Date,
  started_at: Date,
  completed_at: Date,
  delayed: Boolean,
  escalated: Boolean,
  escalatedAt: Date
}
```

### Workers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  role: "worker",
  password: String (bcrypt hashed),
  created_at: Date,
  createdAt: Date
}
```

## 🚀 Key Features Implemented

✅ JWT-based authentication
✅ Student self-registration
✅ Password encryption with bcrypt
✅ Role-based access control
✅ Image upload and management
✅ Auto-categorization of complaints
✅ Auto-priority assignment
✅ Delay detection and escalation
✅ Complaint lifecycle tracking
✅ Worker assignment and management
✅ Admin verification workflow
✅ Super Admin override capabilities
✅ Audit logging
✅ Responsive mobile-friendly UI
✅ Toast notifications
✅ Form validation
✅ CRON-based automation
✅ Search and advanced filters

## 📈 Future Enhancements

- [ ] Email notifications for status updates
- [ ] SMS alerts for critical updates
- [ ] Advanced analytics and reporting
- [ ] Rating system for workers
- [ ] Feedback and comments on complaints
- [ ] Maintenance schedule management
- [ ] Cost tracking for repairs
- [ ] Multi-language support
- [ ] Dark mode
- [ ] API rate limiting
- [ ] Pagination for large datasets
- [ ] Export to CSV/PDF
- [ ] Mobile app (React Native)

## 🧪 Testing

To test the system:

1. **Register a new student**:
   - Go to `/register` page
   - Fill in all required fields
   - Submit to create account

2. **Login**:
   - Go to `/login`
   - Select role (Student/Worker/Admin/Super Admin)
   - Use appropriate credentials

3. **Submit Complaint** (Student):
   - Go to Student Dashboard
   - Click "Submit Complaint"
   - Fill in details and upload images
   - System auto-categorizes and assigns priority

4. **Assign Worker** (Admin):
   - Go to Admin Dashboard
   - Find complaint in "All Complaints"
   - Use "Assign Worker" dropdown
   - Select worker from list

5. **Complete Task** (Worker):
   - Go to Worker Dashboard
   - See assigned complaints
   - Upload proof images
   - Add remarks
   - Mark as completed

6. **Verify & Resolve** (Admin):
   - Check "Awaiting Verification"
   - Review worker proof
   - Click "Verify" or "Solve"
   - Complaint moves to resolved

7. **Monitor Delays** (Super Admin):
   - Check Super Admin Dashboard
   - See delayed complaints highlighted
   - Force resolve if needed
   - View escalation metrics

## 📝 Notes

- All passwords are hashed using bcryptjs before storage
- JWT tokens expire after 7 days by default
- Images are stored in `/uploads` directory
- Complaints older than 4 days without progress are auto-escalated
- Only solved complaints can be archived/removed
- Worker deletion cascades to unassign their complaints

## 🤝 Contributing

To contribute improvements:
1. Test thoroughly before submitting
2. Follow existing code style
3. Add validation for new features
4. Update this documentation

## 📞 Support

For issues or questions, contact the system administrator.

---

**Last Updated**: May 3, 2026
**Version**: 2.0 (Enhanced with JWT & Student Registration)
