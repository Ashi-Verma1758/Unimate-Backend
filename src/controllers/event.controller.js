import Event from '../models/event.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date } = req.body;

  let imageUrl = '';
  if (req.files && req.files.image) {
    const upload = await uploadOnCloudinary(req.files.image.tempFilePath);
    imageUrl = upload.secure_url;
  }

  const event = await Event.create({
    title,
    description,
    date,
    postedBy: req.user._id,
    imageUrl,
  });

  res.status(201).json(new ApiResponse(201, event, 'Event created'));
});

export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().populate('postedBy', 'name email');
  res.json(new ApiResponse(200, events, 'All events'));
});

export const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, date } = req.body;

  const event = await Event.findById(id);
  if (!event) throw new ApiError(404, 'Event not found');

  if (event.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized to update this event');
  }

  event.title = title || event.title;
  event.description = description || event.description;
  event.date = date || event.date;

  if (req.files && req.files.image) {
    const upload = await uploadOnCloudinary(req.files.image.tempFilePath);
    event.imageUrl = upload.secure_url;
  }

  const updatedEvent = await event.save();
  res.json(new ApiResponse(200, updatedEvent, 'Event updated'));
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) throw new ApiError(404, 'Event not found');

  if (event.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized to delete this event');
  }

  await event.remove();
  res.json(new ApiResponse(200, null, 'Event deleted'));
});
