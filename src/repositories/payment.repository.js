const { query } = require('../db');

async function createPayment({ userId, amount, clickMerchantTransId }) {
  const { rows } = await query(
    `INSERT INTO payments (user_id, amount, click_merchant_trans_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, amount, clickMerchantTransId]
  );
  return rows[0];
}

async function getPaymentById(id) {
  const { rows } = await query('SELECT * FROM payments WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getPaymentByMerchantTransId(clickMerchantTransId) {
  const { rows } = await query('SELECT * FROM payments WHERE click_merchant_trans_id = $1', [
    clickMerchantTransId
  ]);
  return rows[0] || null;
}

async function updatePaymentStatusById(id, status, { clickPaymentId } = {}) {
  const { rows } = await query(
    `UPDATE payments
     SET status = $2,
         click_payment_id = COALESCE($3, click_payment_id)
     WHERE id = $1
     RETURNING *`,
    [id, status, clickPaymentId || null]
  );
  return rows[0] || null;
}

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentByMerchantTransId,
  updatePaymentStatusById
};

