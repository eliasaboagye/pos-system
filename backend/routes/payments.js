const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const { Payment, Sale } = require('../models');

const router = express.Router();

router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { sale_id, email } = req.body;

    const sale = await Sale.findByPk(sale_id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (sale.payment_status === 'paid') {
      return res.status(400).json({ message: 'Sale already paid' });
    }

    const existingPayment = await Payment.findOne({ where: { sale_id } });

    if (existingPayment) {
      return res.status(200).json({
        authorization_url: null,
        reference: existingPayment.paystack_reference,
        payment: existingPayment,
      });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: Math.round(Number(sale.total_amount) * 100),
        reference: `POS-${sale_id}-${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL}/payment-success.html`,
        metadata: {
          sale_id,
          custom_fields: [
            {
              display_name: 'Sale ID',
              variable_name: 'sale_id',
              value: sale_id,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      await Payment.create({
        sale_id,
        paystack_reference: response.data.data.reference,
        amount: sale.total_amount,
        status: 'pending',
      });

      return res.status(200).json({
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference,
      });
    }

    return res.status(500).json({ message: 'Payment initialization failed' });
  } catch (err) {
    console.error('Paystack initialize error:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const payment = await Payment.findOne({ where: { paystack_reference: reference } });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (response.data.data.status === 'success') {
      payment.status = 'successful';
      payment.paid_at = new Date();
      await payment.save();

      const sale = await Sale.findByPk(payment.sale_id);

      if (sale) {
        sale.payment_status = 'paid';
        sale.paystack_reference = reference;
        await sale.save();
      }

      return res.status(200).json({
        status: 'success',
        sale_id: payment.sale_id,
        amount: response.data.data.amount / 100,
        reference,
      });
    }

    payment.status = 'failed';
    await payment.save();

    return res.status(200).json({
      status: 'failed',
      message: response.data.data.gateway_response,
    });
  } catch (err) {
    console.error('Paystack verify error:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
