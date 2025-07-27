import User from '../models/user.model.js';
import Project from '../models/project.model.js';
//get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user){
    return res.status(404).json({ message: 'User not found' });
  }
  const userObject = user.toObject({ virtuals: true });
  //  console.log('---------------------------------');
  //   console.log('Searching for projects with userId:', user._id);
  const projects = await Project.find({ createdBy:userObject._id });
    
  // console.log('Found projects:', projects);
    // console.log('---------------------------------');
  userObject.projects = projects;

    res.status(200).json(userObject);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//update profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });


    const { name, phone, dob,bio,
      linkedin, github, university, skills, academicYear } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (dob) user.dob = dob;
    if (linkedin) user.linkedin = linkedin;
    if (github) user.github = github;
    if (university) user.university = university;
    if (skills) user.skills = skills; 
     if (bio) user.bio = bio; 
    if (academicYear) user.academicYear = academicYear;

    const updatedUser = await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        bio: updatedUser.bio,
        linkedin: updatedUser.linkedin,
        github: updatedUser.github,
        university: updatedUser.university,
        skills: updatedUser.skills,
        academicYear: updatedUser.academicYear
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
    try {
        // 1. Fetch all users but exclude sensitive information
        const users = await User.find({ 
            _id: { $ne: req.user._id } // Exclude the currently logged-in user
        }).select('-password -refreshToken').lean();

        // 2. Get project counts for all users in a single, efficient query
        const projectCounts = await Project.aggregate([
            {
                $group: {
                    _id: '$createdBy', // Group by the user who created the project
                    projectCount: { $sum: 1 } // Count the projects for each user
                }
            }
        ]);

        // 3. Create a map for easy lookup of project counts
        const projectCountMap = new Map(
            projectCounts.map(item => [item._id.toString(), item.projectCount])
        );

        // 4. Add the project count to each user object
        const usersWithData = users.map(user => ({
            ...user,
            projectCount: projectCountMap.get(user._id.toString()) || 0
        }));

        res.status(200).json(usersWithData);

    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
};
