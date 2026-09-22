const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Have to fill every column" });
    }
    const existingEmail = await userModel.findByEmail(email);
    const existingUser = await userModel.findByName(name);

    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "This email already exists" });
    }
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "This Username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Default role 'user' rakha gaya hai agar request body mein role paas na ho
    const userRole = role || "user";
    const userId = await userModel.create(name, email, passwordHash, userRole);

    const token = jwt.sign(
      { id: userId, email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      success: true,
      message: "Signup completed",
      token,
      user: { id: userId, name, email, role: userRole },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Fill out credentials" });
    }

    const user = await userModel.findByName(name);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Wrong Credentials" });
    }

    // Database user object se role read karna
    const userRole = user.role || "user";

    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateCredentials = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    if (username !== user.name) {
      const existingUser = await userModel.findByName(username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await userModel.updateUser(userId, username, newPasswordHash);

    return res.status(200).json({
      success: true,
      message: "Credentials updated successfully",
      user: { id: userId, name: username, email: user.email, role: user.role || "user" },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};