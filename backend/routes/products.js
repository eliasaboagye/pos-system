const express = require('express');
const { Sequelize } = require('sequelize');
const { Product } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['name', 'ASC']],
    });

    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: Sequelize.where(
        Sequelize.col('quantity'),
        '<=',
        Sequelize.col('low_stock_threshold')
      ),
      order: [['quantity', 'ASC']],
    });

    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/report/stock', authMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['name', 'ASC']] });

    const totalProducts = products.length;
    const totalUnitsInStock = products.reduce((sum, product) => sum + Number(product.quantity), 0);
    const lowStockProducts = products.filter(
      (product) => Number(product.quantity) <= Number(product.low_stock_threshold)
    );
    const outOfStockProducts = products.filter((product) => Number(product.quantity) === 0);

    return res.status(200).json({
      total_products: totalProducts,
      total_units_in_stock: totalUnitsInStock,
      low_stock_count: lowStockProducts.length,
      out_of_stock_count: outOfStockProducts.length,
      low_stock_products: lowStockProducts,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, supplier, price, quantity, low_stock_threshold } = req.body;

    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const product = await Product.create({
      name,
      category,
      supplier,
      price,
      quantity,
      low_stock_threshold,
    });

    return res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, supplier, price, quantity, low_stock_threshold } = req.body;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name !== undefined) {
      product.name = name;
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (supplier !== undefined) {
      product.supplier = supplier;
    }

    if (price !== undefined) {
      product.price = price;
    }

    if (quantity !== undefined) {
      product.quantity = quantity;
    }

    if (low_stock_threshold !== undefined) {
      product.low_stock_threshold = low_stock_threshold;
    }

    await product.save();

    return res.status(200).json({ message: 'Product updated', product });
  } catch (err) {
    if (err instanceof Sequelize.ValidationError) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/replenish', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const replenishmentQty = Number(quantity);
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!Number.isFinite(replenishmentQty) || replenishmentQty <= 0) {
      return res.status(400).json({ message: 'Replenishment quantity must be greater than zero' });
    }

    product.quantity = Number(product.quantity) + replenishmentQty;
    await product.save();

    return res.status(200).json({ message: 'Stock replenished', product });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/adjust', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment_type, quantity } = req.body;
    const adjustmentQty = Number(quantity);
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!Number.isFinite(adjustmentQty) || adjustmentQty < 0) {
      return res.status(400).json({ message: 'Adjustment quantity must be zero or greater' });
    }

    if (adjustment_type === 'set') {
      product.quantity = adjustmentQty;
    } else if (adjustment_type === 'add') {
      product.quantity = Number(product.quantity) + adjustmentQty;
    } else if (adjustment_type === 'remove') {
      if (Number(product.quantity) < adjustmentQty) {
        return res.status(400).json({ message: 'Cannot remove more stock than available' });
      }

      product.quantity = Number(product.quantity) - adjustmentQty;
    } else {
      return res.status(400).json({ message: 'Adjustment type must be set, add, or remove' });
    }

    await product.save();

    return res.status(200).json({ message: 'Inventory adjusted', product });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();

    return res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    if (err instanceof Sequelize.ForeignKeyConstraintError) {
      return res.status(400).json({
        message: 'Cannot delete product because it is linked to existing sales',
      });
    }

    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
