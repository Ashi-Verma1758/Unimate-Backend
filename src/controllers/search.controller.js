import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import Event from "../models/event.model.js";

export const searchAll = async (req, res) => {
  try {
    const keyword = req.query.q;

    const users = await User.find({
      $or: [
        { firstName: { $regex: keyword, $options: "i" } },
        { lastName: { $regex: keyword, $options: "i" } },
        { university: { $regex: keyword, $options: "i" } },
        { major: { $regex: keyword, $options: "i" } },
        { college: { $regex: keyword, $options: "i" } },
        { skills: { $regex: keyword, $options: "i" } }
      ]
    }).select("-password -refreshToken");

    const projects = await Project.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { domain: { $regex: keyword, $options: "i" } },
        { requiredSkills: { $regex: keyword, $options: "i" } },
        { niceToHaveSkills: { $regex: keyword, $options: "i" } },
        { location: { $regex: keyword, $options: "i" } },
        { projectType: { $regex: keyword, $options: "i" } }
      ]
    }).populate(
      "createdBy",
      "firstName lastName university"
    );

    const events = await Event.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ]
    }).populate(
      "postedBy",
      "firstName lastName university"
    );

    res.status(200).json({
      users,
      projects,
      events
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};