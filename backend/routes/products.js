const express = require('express');
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

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;

    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const product = await Product.create({
      name,
      category,
      price,
      quantity,
    });

    return res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, quantity } = req.body;
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

    if (price !== undefined) {
      product.price = price;
    }

    if (quantity !== undefined) {
      product.quantity = quantity;
    }

    await product.save();

    return res.status(200).json({ message: 'Product updated', product });
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
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
