const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = { $regex: category, $options: 'i' };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name email');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const product = await Product.create({ ...req.body, createdBy: req.user._id });

    // Log transaction
    if (product.quantity > 0) {
      await Transaction.create({
        product: product._id,
        type: 'stock-in',
        quantity: product.quantity,
        previousQuantity: 0,
        newQuantity: product.quantity,
        note: 'Initial stock entry',
        performedBy: req.user._id,
      });
    }

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const prevQty = product.quantity;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    // Log quantity change
    if (req.body.quantity !== undefined && req.body.quantity !== prevQty) {
      const diff = req.body.quantity - prevQty;
      await Transaction.create({
        product: product._id,
        type: diff > 0 ? 'stock-in' : 'stock-out',
        quantity: Math.abs(diff),
        previousQuantity: prevQty,
        newQuantity: req.body.quantity,
        note: req.body.note || 'Manual adjustment',
        performedBy: req.user._id,
      });
    }

    res.json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (admin/manager)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/products/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const inStock = await Product.countDocuments({ status: 'in-stock' });
    const lowStock = await Product.countDocuments({ status: 'low-stock' });
    const outOfStock = await Product.countDocuments({ status: 'out-of-stock' });

    const totalValueAgg = await Product.aggregate([
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', '$price'] } } } },
    ]);
    const totalValue = totalValueAgg[0]?.totalValue || 0;

    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentTransactions = await Transaction.find()
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalProducts,
        inStock,
        lowStock,
        outOfStock,
        totalValue,
        categories,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stock adjustment
// @route   POST /api/products/:id/adjust
// @access  Private
const adjustStock = async (req, res, next) => {
  try {
    const { type, quantity, note } = req.body;

    if (!['stock-in', 'stock-out'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const prevQty = product.quantity;
    const newQty = type === 'stock-in' ? prevQty + quantity : prevQty - quantity;

    if (newQty < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    product.quantity = newQty;
    product.lastUpdatedBy = req.user._id;
    await product.save();

    await Transaction.create({
      product: product._id,
      type,
      quantity,
      previousQuantity: prevQty,
      newQuantity: newQty,
      note: note || '',
      performedBy: req.user._id,
    });

    res.json({ success: true, message: 'Stock adjusted successfully', product });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getStats, adjustStock };
