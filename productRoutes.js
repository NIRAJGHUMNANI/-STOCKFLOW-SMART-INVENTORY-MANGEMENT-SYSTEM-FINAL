const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getStats,
  adjustStock,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/stats', getStats);

router.get('/', getProducts);
router.get('/:id', getProduct);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('price').isNumeric().withMessage('Price must be a number'),
  ],
  createProduct
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isNumeric().withMessage('Price must be a number'),
  ],
  updateProduct
);

router.delete('/:id', authorize('admin', 'manager'), deleteProduct);

router.post('/:id/adjust', adjustStock);

module.exports = router;
