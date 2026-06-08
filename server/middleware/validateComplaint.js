export function validateComplaint(req, res, next) {
  const { title, description, category, locationScope, locationDetail } = req.body;
  const errors = [];

  // For creation require required fields; for updates allow partial updates
  if (req.method === 'POST') {
    if (!title || !title.trim()) {
      errors.push('Title is required.');
    }

    if (!description || description.trim().length < 20) {
      errors.push('Description is required and must be at least 20 characters.');
    }

    if (locationScope === 'Hostel' && (!locationDetail || locationDetail.trim().length < 3)) {
      errors.push('Hostel location detail is required for general complaints.');
    }
  } else {
    // For PUT/PATCH allow partial updates but still validate provided fields
    if (description && description.trim().length < 20) {
      errors.push('If provided, description must be at least 20 characters.');
    }
  }

  if (req.files && req.files.length > 5) {
    errors.push('You can upload a maximum of 5 images.');
  }

  if (errors.length) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  next();
}
