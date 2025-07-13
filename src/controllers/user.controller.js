import User from '../models/user.model.js';

//get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//update profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, dob } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (dob) user.dob = dob;

    const updatedUser = await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dob: updatedUser.dob
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};
// (get all users)
// export const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find().select('-password');
//     res.status(200).json(users);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch users', error: err.message });
//   }
// };
