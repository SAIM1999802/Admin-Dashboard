const { 
  getAllProducts, 
  createProduct, 
  updateProduct: updateProductModel, 
  deleteProduct: deleteProductModel,
  getProductById
} = require('../models/productModel');

exports.getProducts = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const products = await getAllProducts(userId);
    res.status(200).json(products);
  } catch (error) {
    console.error("GET Products Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("GET Product Details Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, category_id, stock_price, price, stock, stock_count, image, description } = req.body;

    const productData = {
      name,
      category_id,
      stock_price, // Fixed: Added stock_price to payload
      price,
      stock: stock !== undefined ? stock : stock_count,
      image,
      description: description ? description.toString().trim() : ""
    };

    await createProduct(productData, userId);
    res.status(201).json({ message: 'Product created successfully' });
  } catch (error) {
    console.error("ADD Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, category_id, stock_price, price, stock, stock_count, image, description } = req.body; // Fixed: Destructured stock_price

    const productData = {
      name,
      category_id,
      stock_price, // Fixed: Added stock_price to payload
      price,
      stock: stock !== undefined ? stock : stock_count,
      image,
      description: description ? description.toString().trim() : ""
    };

    await updateProductModel(id, productData, userId);
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error("UPDATE Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await deleteProductModel(id, userId);
    res.status(200).json({ message: 'Product marked as deleted successfully' });
  } catch (error) {
    console.error("DELETE Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};