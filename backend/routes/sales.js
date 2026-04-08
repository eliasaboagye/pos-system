const express = require('express');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const { sequelize, Sale, SaleItem, Product, User } = require('../models');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, discount_type, discount_value } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Items are required' });
    }

    const preparedItems = [];
    let subtotalAmount = 0;

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: `Product not found: ${item.product_id}` });
      }

      if (product.quantity < item.quantity) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: `Insufficient stock for: ${product.name}` });
      }

      const unitPrice = Number(product.price);
      subtotalAmount += unitPrice * item.quantity;

      preparedItems.push({
        product,
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.price,
      });
    }

    let discountAmount = 0;
    const normalizedDiscountValue = Number(discount_value || 0);

    if (discount_type === 'percent' && normalizedDiscountValue > 0) {
      discountAmount = subtotalAmount * (normalizedDiscountValue / 100);
    } else if (discount_type === 'fixed' && normalizedDiscountValue > 0) {
      discountAmount = normalizedDiscountValue;
    }

    if (discountAmount > subtotalAmount) {
      discountAmount = subtotalAmount;
    }

    const totalAmount = subtotalAmount - discountAmount;

    const sale = await Sale.create(
      {
        user_id: req.user.id,
        total_amount: totalAmount.toFixed(2),
        payment_status: 'pending',
      },
      { transaction }
    );

    for (const item of preparedItems) {
      await SaleItem.create(
        {
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        },
        { transaction }
      );

      item.product.quantity -= item.quantity;
      await item.product.save({ transaction });
    }

    await transaction.commit();

    return res.status(201).json({
      message: 'Sale created',
      sale_id: sale.id,
      subtotal_amount: subtotalAmount.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      total_amount: totalAmount.toFixed(2),
    });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ sales });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalSalesToday = await Sale.count({
      where: {
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    const totalRevenueToday =
      (await Sale.sum('total_amount', {
        where: {
          createdAt: {
            [Op.gte]: today,
          },
        },
      })) || 0;

    const totalProducts = await Product.count();

    return res.status(200).json({
      total_sales_today: totalSalesToday,
      total_revenue_today: Number(totalRevenueToday).toFixed(2),
      total_products: totalProducts,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'price'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['username'],
        },
      ],
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    return res.status(200).json({ sale });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
