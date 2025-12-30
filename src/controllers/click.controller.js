const crypto = require('crypto');
const logger = require('../logger');
const paymentRepo = require('../repositories/payment.repository');
const clickService = require('../services/click.service');
const { requireInt, requireNumber, requireNonEmptyString } = require('../utils/validation');

function mapClickPaymentStatusToLocal(clickPaymentStatus) {
  if (clickPaymentStatus === 1) return 'PAID';
  return 'PENDING';
}

async function createPayment(req, res) {
  const userId = requireInt(req.body.user_id, 'user_id');
  const amount = requireNumber(req.body.amount, 'amount');

  const clickMerchantTransId = crypto.randomUUID();
  const payment = await paymentRepo.createPayment({ userId, amount, clickMerchantTransId });

  const clickPayUrl = clickService.buildClickPayUrl({
    amount: payment.amount,
    transactionParam: payment.click_merchant_trans_id
  });

  res.status(201).json({ payment, clickPayUrl });
}

async function getPayment(req, res) {
  const id = requireInt(req.params.id, 'id');
  const payment = await paymentRepo.getPaymentById(id);
  if (!payment) return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found' });
  res.json({ payment });
}

async function redirectToClick(req, res) {
  const id = requireInt(req.params.id, 'id');
  const payment = await paymentRepo.getPaymentById(id);
  if (!payment) return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found' });

  const clickPayUrl = clickService.buildClickPayUrl({
    amount: payment.amount,
    transactionParam: payment.click_merchant_trans_id
  });

  res.redirect(302, clickPayUrl);
}

async function createInvoice(req, res) {
  const amount = requireNumber(req.body.amount, 'amount');
  const phoneNumber = requireNonEmptyString(req.body.phone_number, 'phone_number');
  const merchantTransId = requireNonEmptyString(req.body.merchant_trans_id, 'merchant_trans_id');

  const response = await clickService.createInvoice({ amount, phoneNumber, merchantTransId });
  res.json({ response });
}

async function getInvoiceStatus(req, res) {
  const invoiceId = requireNonEmptyString(req.params.invoiceId, 'invoiceId');
  const response = await clickService.getInvoiceStatus({ invoiceId });
  res.json({ response });
}

async function syncPaymentStatusFromClick(req, res) {
  const id = requireInt(req.params.id, 'id');
  const payment = await paymentRepo.getPaymentById(id);
  if (!payment) return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found' });

  const response = await clickService.getPaymentStatusByMerchantTransId({
    merchantTransId: payment.click_merchant_trans_id,
    createdAt: payment.created_at
  });

  const clickPaymentId = response && response.payment_id ? Number(response.payment_id) : null;
  const clickPaymentStatus = response && typeof response.payment_status === 'number' ? response.payment_status : null;

  let updated = payment;
  if (clickPaymentStatus != null) {
    const status = mapClickPaymentStatusToLocal(clickPaymentStatus);
    updated = await paymentRepo.updatePaymentStatusById(payment.id, status, { clickPaymentId });
  }

  res.json({ click: response, payment: updated });
}

async function reversePayment(req, res) {
  const id = requireInt(req.params.id, 'id');
  const payment = await paymentRepo.getPaymentById(id);
  if (!payment) return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found' });
  if (!payment.click_payment_id) {
    return res.status(409).json({
      error: 'MISSING_CLICK_PAYMENT_ID',
      message: 'Cannot reverse without click_payment_id (sync status first)'
    });
  }

  const response = await clickService.reversePayment({ paymentId: payment.click_payment_id });
  const updated = await paymentRepo.updatePaymentStatusById(payment.id, 'CANCELED');
  res.json({ click: response, payment: updated });
}

async function clickPrepare(req, res) {
  const { click_trans_id, service_id, merchant_trans_id, amount, sign_time, sign_string } = req.body;

  logger.info('Click PREPARE received', { body: req.body });

  // Validate required fields
  if (!click_trans_id || !service_id || !merchant_trans_id || !amount) {
    logger.error('Click PREPARE: Missing required parameters', { body: req.body });
    return res.json({ error: -8, error_note: 'Missing required parameters' });
  }

  // Verify signature
  const { config } = require('../config');
  const { sha1Hex } = require('../utils/clickAuth');
  const expectedSign = sha1Hex(`${click_trans_id}${service_id}${config.click.secretKey}${merchant_trans_id}${amount}${sign_time}`);


  if (expectedSign !== sign_string) {
    logger.error('Click PREPARE: Invalid signature', { body: req.body, expectedSign, sign_string });
    return res.json({ error: -1, error_note: 'Invalid signature' });
  }

  // Check if payment exists

  const payment = await paymentRepo.getPaymentByMerchantTransId(merchant_trans_id);
  if (!payment) {
    logger.error('Click PREPARE: Payment not found', { merchant_trans_id });
    return res.json({ error: -5, error_note: 'Payment not found' });
  }

  // Check if payment is already processed

  if (payment.status === 'PAID') {
    logger.error('Click PREPARE: Payment already processed', { merchant_trans_id });
    return res.json({ error: -4, error_note: 'Payment already processed' });
  }

  // Check amount

  if (parseFloat(payment.amount) !== parseFloat(amount)) {
    logger.error('Click PREPARE: Invalid amount', { merchant_trans_id, expected: payment.amount, got: amount });
    return res.json({ error: -2, error_note: 'Invalid amount' });
  }

  // Success
  res.json({
    click_trans_id,
    merchant_trans_id,
    merchant_prepare_id: payment.id,
    error: 0,
    error_note: 'Success'
  });
}

async function clickComplete(req, res) {
  const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, sign_time, sign_string, error } = req.body;

  logger.info('Click COMPLETE received', { body: req.body });

  // Validate required fields

  if (!click_trans_id || !service_id || !merchant_trans_id) {
    logger.error('Click COMPLETE: Missing required parameters', { body: req.body });
    return res.json({ error: -8, error_note: 'Missing required parameters' });
  }

  // Verify signature
  const { config } = require('../config');
  const { sha1Hex } = require('../utils/clickAuth');
  const expectedSign = sha1Hex(`${click_trans_id}${service_id}${config.click.secretKey}${merchant_trans_id}${merchant_prepare_id}${amount}${sign_time}`);


  if (expectedSign !== sign_string) {
    logger.error('Click COMPLETE: Invalid signature', { body: req.body, expectedSign, sign_string });
    return res.json({ error: -1, error_note: 'Invalid signature' });
  }

  // Check if payment exists

  const payment = await paymentRepo.getPaymentByMerchantTransId(merchant_trans_id);
  if (!payment) {
    logger.error('Click COMPLETE: Payment not found', { merchant_trans_id });
    return res.json({ error: -5, error_note: 'Payment not found' });
  }

  // If Click had an error, mark as failed

  if (error && error < 0) {
    logger.error('Click COMPLETE: Click provider error', { error, body: req.body });
    return res.json({
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: payment.id,
      error: 0,
      error_note: 'Success'
    });
  }

  // Update payment status to PAID
  await paymentRepo.updatePaymentStatusById(payment.id, 'PAID', { clickPaymentId: click_trans_id });

  res.json({
    click_trans_id,
    merchant_trans_id,
    merchant_confirm_id: payment.id,
    error: 0,
    error_note: 'Success'
  });
}

async function clickReturnCallback(req, res) {
  const transactionParam = req.query.transaction_param ? String(req.query.transaction_param) : null;

  if (!transactionParam) {
    return res.status(200).send('OK');
  }

  const payment = await paymentRepo.getPaymentByMerchantTransId(transactionParam);
  if (!payment) return res.status(200).send('OK');

  try {
    const response = await clickService.getPaymentStatusByMerchantTransId({
      merchantTransId: payment.click_merchant_trans_id,
      createdAt: payment.created_at
    });

    const clickPaymentId = response && response.payment_id ? Number(response.payment_id) : null;
    const clickPaymentStatus = response && typeof response.payment_status === 'number' ? response.payment_status : null;
    if (clickPaymentStatus != null) {
      const status = mapClickPaymentStatusToLocal(clickPaymentStatus);
      await paymentRepo.updatePaymentStatusById(payment.id, status, { clickPaymentId });
    }
  } catch (_) {
    // ignore; return_url is user-facing
  }

  res.status(200).send('Payment received. You can close this page.');
}

async function quickPay(req, res) {
  const amount = parseFloat(req.query.amount);
  const userId = req.query.user_id ? parseInt(req.query.user_id) : 1;

  if (!amount || amount <= 0) {
    return res.status(400).send('Invalid amount. Use: /pay?amount=50000');
  }

  const clickMerchantTransId = crypto.randomUUID();
  const payment = await paymentRepo.createPayment({ userId, amount, clickMerchantTransId });

  const clickPayUrl = clickService.buildClickPayUrl({
    amount: payment.amount,
    transactionParam: payment.click_merchant_trans_id
  });

  res.redirect(302, clickPayUrl);
}

module.exports = {
  createPayment,
  getPayment,
  redirectToClick,
  createInvoice,
  getInvoiceStatus,
  syncPaymentStatusFromClick,
  reversePayment,
  clickPrepare,
  clickComplete,
  clickReturnCallback,
  quickPay
};
