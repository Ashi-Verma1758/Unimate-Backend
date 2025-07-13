import Project from '../models/project.model.js';
import User from '../models/user.model.js';
//creating post
export const createProject = async (req, res) => {
  try {
    const { eventName, description, image, deadline, teamSize } = req.body;

    const newProject = new Project({
      createdBy: req.user.id,
      eventName,
      description,
      image,
      deadline,
      teamSize
    });

    await newProject.save();
    res.status(201).json({ message: 'Project post created successfully', project: newProject });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project', error: err.message });
  }
};

//getting all projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects', error: err.message });
  }
};

//get project by Id
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('joinRequests.user', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project', error: err.message });
  }
};

//joining a project like i'm interested
export const joinProject = async (req, res) => {
  try {
    const { message } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Prevent duplicate requests
    const alreadyRequested = project.joinRequests.find(
      (reqObj) => reqObj.user.toString() === req.user.id
    );
    if (alreadyRequested) {
      return res.status(400).json({ message: 'You have already requested to join this project' });
    }

    // Add join request
    project.joinRequests.push({
      user: req.user.id,
      message,
      status: 'pending'
    });

    await project.save();
    res.status(200).json({ message: 'Join request sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send request', error: err.message });
  }
};

//accepting or rejecting req
export const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body; // "accepted" or "rejected"
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    const request = project.joinRequests.find(
      (r) => r.user.toString() === userId
    );

    if (!request) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    request.status = status;
    await project.save();

    res.status(200).json({ message: `Request has been ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
};

//projects by logged in user
export const getMyProjects = async (req, res) => {
try {
const projects = await Project.find({ createdBy: req.user.id })
.sort({ createdAt: -1 });
res.status(200).json(projects);
} catch (err) {
res.status(500).json({ message: 'Failed to fetch your posts', error: err.message });
}
};

//get post logged in user requested to join
export const getMyJoinRequests = async (req, res) => {
try {
const projects = await Project.find({ 'joinRequests.user': req.user.id })
.populate('createdBy', 'name email')
.sort({ createdAt: -1 });

} catch (err) {
res.status(500).json({ message: 'Failed to fetch join requests', error: err.message });
}
};