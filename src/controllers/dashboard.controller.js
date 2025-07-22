import Project from '../models/project.model.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Active Projects created by user
    const activeProjects = await Project.countDocuments({
      createdBy: userId,
      status: { $ne: 'completed' } 
    });

    // Completed Projects created by user
    const completedProjects = await Project.countDocuments({
      createdBy: userId,
      status: 'completed'
    });

    // Team members in all user's projects
    const userProjects = await Project.find({ createdBy: userId }).select('joinRequests');
    const teamMembersSet = new Set();

    userProjects.forEach(project => {
      project.joinRequests.forEach(req => {
        if (req.status === 'accepted') {
          teamMembersSet.add(req.user.toString());
        }
      });
    });

    const totalTeamMembers = teamMembersSet.size;

    res.status(200).json({
      activeProjects,
      completedProjects,
      teamMembers: totalTeamMembers
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};
