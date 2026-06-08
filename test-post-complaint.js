import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const user = {
  _id: '507f1f77bcf86cd799439011',
  email: 'student@example.com',
  grnNumber: 'GRN12345',
  role: 'Student',
  name: 'John Doe'
};

const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });

async function run() {
  const formData = new FormData();
  formData.append('title', 'My room fan is not working properly');
  formData.append('description', 'The fan in room 204 makes a loud squeaking sound and does not rotate at high speed. Please repair it.');
  formData.append('category', 'Electricity');
  formData.append('priority', 'Medium');
  formData.append('locationScope', 'Room');
  formData.append('roomNo', '204');
  formData.append('hostel', 'Block A');

  // Let's create a small dummy file
  const blob = new Blob([Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")], { type: 'image/png' });
  formData.append('images', blob, 'test.png');

  try {
    const res = await axios.post('http://localhost:4000/api/complaints', formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Status:", res.status);
    console.log("Data:", res.data);
  } catch (error) {
    console.error("Request failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

run();
