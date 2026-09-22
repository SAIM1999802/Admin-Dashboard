const CategoryModel = require("../models/categoryModel");

exports.getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await CategoryModel.getAllByUserId(userId);
    res.status(200).json(rows);
  } catch (err) {
    console.error("GET Categories Error:", err);
    res.status(500).json({ message: "Database error while fetching categories" });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [rows] = await CategoryModel.getById(id, userId);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { Name } = req.body;

    if (!Name || !Name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const [result] = await CategoryModel.create(Name.trim(), userId);
    res.status(201).json({
      message: "Category created successfully",
      id: result.insertId,
      Name: Name.trim(),
    });
  } catch (err) {
    console.error("ADD Category Error:", err);
    res.status(500).json({ message: "Failed to create category" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { Name } = req.body;

    if (!Name || !Name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const [result] = await CategoryModel.update(id, Name.trim(), userId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found or unauthorized" });
    }
    res.status(200).json({ message: "Category updated successfully" });
  } catch (err) {
    console.error("UPDATE Category Error:", err);
    res.status(500).json({ message: "Failed to update category" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await CategoryModel.softDelete(id, userId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found or unauthorized" });
    }
    res.status(200).json({ message: "Category marked as deleted successfully" });
  } catch (err) {
    console.error("DELETE Category Error:", err);
    res.status(500).json({ message: "Failed to delete category" });
  }
};