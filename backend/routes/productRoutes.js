// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware'); // Verify token path
const { 
  getProducts, 
  getProductDetails, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');

// All product routes require token
router.use(verifyToken);

router.get('/', getProducts);
router.get('/:id', getProductDetails);
router.post('/', addProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;