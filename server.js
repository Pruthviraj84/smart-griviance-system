import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'smart-hostel';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const client = new MongoClient(MONGODB_URI);
let db;
let students;
let complaints;

const startServer = async () => {
  try {
    await client.connect();
    db = client.db(DB_NAME);
    students = db.collection('students');
    complaints = db.collection('complaints');

    await students.createIndex({ email: 1 }, { unique: true });

    app.post('/api/students/register', async (req, res) => {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const existing = await students.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Student already registered. Please login.' });
      }

      const student = { email, password, name: name || email.split('@')[0], role: 'Student', createdAt: new Date() };
      await students.insertOne(student);
      return res.json({ message: 'Registered successfully.' });
    });

    app.post('/api/students/login', async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const student = await students.findOne({ email });
      if (!student || student.password !== password) {
        return res.status(401).json({ message: 'Invalid student credentials.' });
      }

      return res.json({ email: student.email, name: student.name, role: 'Student' });
    });

    const toJSON = (doc) => ({
      ...doc,
      _id: doc._id.toString(),
    });

    app.get('/api/complaints', async (req, res) => {
      const list = await complaints.find().sort({ createdAt: -1 }).toArray();
      return res.json(list.map(toJSON));
    });

    app.post('/api/complaints', async (req, res) => {
      const { studentName, email, title, description, category, priority, location, contact } = req.body;
      if (!studentName || !email || !title || !description) {
        return res.status(400).json({ message: 'Missing complaint details.' });
      }

      const complaint = {
        studentName,
        email,
        title,
        description,
        category,
        priority,
        location,
        contact,
        status: 'Pending',
        assignedTo: 'Not assigned',
        createdAt: new Date(),
      };

      const result = await complaints.insertOne(complaint);
      return res.json({ _id: result.insertedId.toString(), ...complaint });
    });

    app.patch('/api/complaints/:id/status', async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'Status value is required.' });
      }

      const result = await complaints.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status } },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Complaint not found.' });
      }
      return res.json(toJSON(result.value));
    });

    app.patch('/api/complaints/:id/assign', async (req, res) => {
      const { id } = req.params;
      const { assignedTo } = req.body;
      if (!assignedTo) {
        return res.status(400).json({ message: 'Worker name is required.' });
      }

      const result = await complaints.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { assignedTo } },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Complaint not found.' });
      }
      return res.json(toJSON(result.value));
    });

    app.listen(PORT, () => {
      console.log(`MongoDB backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
