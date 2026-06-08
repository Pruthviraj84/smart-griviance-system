import { ObjectId } from 'mongodb';
import streamifier from 'streamifier';
import cloudinary, { CLOUDINARY_FOLDER, isCloudinaryConfigured } from '../config/cloudinary.js';
import { getCollections } from '../config/db.js';
import { normalizeCategory, normalizeStatus, CATEGORY_PRIORITY, inferPriorityFromText, validateComplaintIntelligence, toJSON } from '../utils/complaintUtils.js';

const uploadSingleToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
          if (error) {
            console.error('[Cloudinary] upload_stream error for file:', file.originalname || file.filename || '<unknown>', error?.message || error);
            return reject(error);
          }
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const uploadImagesToCloudinary = async (files = []) => {
  if (!files.length) return [];
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  }

  const uploaded = [];
  for (const file of files) {
    try {
      const result = await uploadSingleToCloudinary(file);
      uploaded.push({ url: result.secure_url, public_id: result.public_id });
    } catch (err) {
      console.error('[Cloudinary] upload error for file:', file.originalname || file.filename || '<unknown>', 'size:', file.size || (file.buffer && file.buffer.length) || 'unknown', err?.message || err);
      // rethrow with context
      throw new Error(`Cloudinary upload failed for ${file.originalname || 'one of the files'}: ${err?.message || err}`);
    }
  }

  return uploaded;
};

export const deleteCloudinaryImages = async (images = []) => {
  if (!Array.isArray(images) || !images.length) return;
  const publicIds = images
    .filter((img) => img && img.public_id)
    .map((img) => img.public_id);

  await Promise.all(publicIds.map(async (public_id) => {
    try {
      await cloudinary.uploader.destroy(public_id, { invalidate: true });
    } catch (error) {
      console.warn(`[Cloudinary] Failed to delete public_id=${public_id}`, error?.message || error);
    }
  }));
};

export const getAllComplaints = async (req, res) => {
  const { complaints } = getCollections();
  const { role } = req.user;
  const { page = 1, limit = 10, status, category, priority, dateFrom, dateTo, assignedTo, search } = req.query;
  const query = {};

  if (role === 'Student') {
    query.grnNumber = req.user.grnNumber;
  }

  if (status) query.status = normalizeStatus(status);
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { studentName: { $regex: search, $options: 'i' } },
      { grnNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await complaints.countDocuments(query);
  const list = await complaints.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)).toArray();

  return res.json({
    complaints: list.map(toJSON),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
    currentPage: parseInt(page, 10),
    total,
  });
};

export const getComplaintById = async (req, res) => {
  const { complaints } = getCollections();
  const { id } = req.params;
  const complaint = await complaints.findOne({ _id: new ObjectId(id) });
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (req.user.role === 'Student' && complaint.grnNumber !== req.user.grnNumber) {
    return res.status(403).json({ message: 'You can only access your own complaints.' });
  }

  return res.json(toJSON(complaint));
};

export const createComplaint = async (req, res) => {
  const { complaints, students } = getCollections();
  const {
    title,
    description,
    category,
    priority = 'Medium',
    contact,
    hostel,
    roomNo,
    locationScope = 'Room',
    locationDetail = '',
    type = 'General',
  } = req.body;

  if (!title || !description || description.trim().length < 20) {
    return res.status(400).json({ message: 'Title and description are required. Description must be at least 20 characters.' });
  }

  const user = req.user;
  const studentName = user.name || 'Student';
  const grnNumber = user.grnNumber || user.email || user.id || 'unknown';
  const finalHostel = hostel || user.hostelName || 'Unknown Hostel';
  const finalRoomNumber = roomNo || user.roomNumber || 'Unknown Room';

  const intelligence = validateComplaintIntelligence({ title, description, category, priority });
  const finalCategory = intelligence.validatedCategory || normalizeCategory(category) || 'Others';
  const finalPriority = intelligence.finalPriority || inferPriorityFromText({ title, description }) || CATEGORY_PRIORITY[finalCategory] || 'Low';

  const duplicateQuery = {
    grnNumber,
    category: finalCategory,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    status: { $nin: ['Completed', 'Verified', 'Resolved', 'Solved'] },
  };

  const existingComplaint = await complaints.findOne(duplicateQuery);
  if (existingComplaint) {
    const updated = await complaints.findOneAndUpdate(
      { _id: existingComplaint._id },
      {
        $inc: { complaintCount: 1 },
        $addToSet: { reportedBy: grnNumber },
        $set: { lastUpdatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      ...toJSON(updated.value),
      isDuplicate: true,
      message: 'Similar complaint already exists. The report has been attached to your recent complaint.',
    });
  }

  let images = [];
  try {
    console.error('[createComplaint] Request Body:', {
      title, description, category, priority, contact, hostel, roomNo, locationScope, locationDetail, type,
    });
    console.error('[createComplaint] Request Files:', (req.files || []).map(f => ({ originalname: f.originalname, size: f.size })));

    images = await uploadImagesToCloudinary(req.files || []);
  } catch (err) {
    console.error('[Cloudinary] createComplaint upload error:', err.message || err);
    return res.status(502).json({ message: 'Image upload failed. Please try again later.' });
  }

  const complaint = {
    studentName,
    grnNumber,
    title: title.trim(),
    description: description.trim(),
    type,
    category: finalCategory,
    autoDetectedCategory: intelligence.autoDetectedCategory,
    validatedCategory: finalCategory,
    recommendedPriority: intelligence.recommendedPriority,
    priorityScore: intelligence.priorityScore,
    validationWarnings: intelligence.validationWarnings,
    urgentMisuse: intelligence.urgentMisuse,
    priority: finalPriority,
    requestedPriority: priority,
    contact: contact || '',
    hostel: finalHostel,
    hostelName: finalHostel,
    roomNo: finalRoomNumber,
    roomNumber: finalRoomNumber,
    locationScope,
    locationDetail: locationScope === 'Hostel' ? locationDetail.trim() : `Room ${finalRoomNumber}`,
    location: locationScope === 'Hostel' ? locationDetail.trim() : `Room ${finalRoomNumber}`,
    images,
    status: 'Pending',
    assignedTo: 'Not assigned',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUpdatedAt: new Date(),
    complaintCount: 1,
    reportedBy: [grnNumber],
  };

  try {
    const result = await complaints.insertOne(complaint);
    return res.status(201).json({ _id: result.insertedId.toString(), ...complaint });
  } catch (err) {
    console.error('[Database] createComplaint insert error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to save complaint. Please try again later.' });
  }
};

export const updateComplaint = async (req, res) => {
  const { complaints } = getCollections();
  const { id } = req.params;
  const { title, description, category, priority, contact, hostel, roomNo, locationScope, locationDetail, status } = req.body;

  const complaint = await complaints.findOne({ _id: new ObjectId(id) });
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (req.user.role === 'Student' && complaint.grnNumber !== req.user.grnNumber) {
    return res.status(403).json({ message: 'You can only update your own complaints.' });
  }

  const updatePayload = {
    updatedAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  if (title) updatePayload.title = title.trim();
  if (description) updatePayload.description = description.trim();
  if (category) updatePayload.category = normalizeCategory(category);
  if (priority) updatePayload.priority = priority;
  if (contact !== undefined) updatePayload.contact = contact;
  if (hostel) updatePayload.hostel = hostel;
  if (roomNo) updatePayload.roomNo = roomNo;
  if (locationScope) updatePayload.locationScope = locationScope;
  if (locationDetail) updatePayload.locationDetail = locationDetail;
  if (status) updatePayload.status = normalizeStatus(status);

  if (req.files && req.files.length) {
    await deleteCloudinaryImages(complaint.images || []);
    try {
      console.error('[updateComplaint] Request Body:', { title, description, category, priority, contact, hostel, roomNo, locationScope, locationDetail, status });
      console.error('[updateComplaint] Request Files:', (req.files || []).map(f => ({ originalname: f.originalname, size: f.size })));
      const newImages = await uploadImagesToCloudinary(req.files);
      updatePayload.images = newImages;
    } catch (err) {
      console.error('[Cloudinary] updateComplaint upload error:', err.message || err);
      return res.status(502).json({ message: 'Image upload failed. Please try again later.' });
    }
  }

  try {
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ message: 'Complaint not found.' });

    return res.json(toJSON(result.value));
  } catch (err) {
    console.error('[Database] updateComplaint error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to update complaint. Please try again later.' });
  }
};

export const deleteComplaint = async (complaint) => {
  await deleteCloudinaryImages(complaint.images || []);
};
