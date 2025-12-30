const express = require('express');
const controller = require('../controllers/click.controller');

const router = express.Router();

router.post('/payments', controller.createPayment);
router.get('/payments/:id', controller.getPayment);
router.get('/payments/:id/redirect', controller.redirectToClick);
router.post('/payments/:id/sync-status', controller.syncPaymentStatusFromClick);
router.post('/payments/:id/reverse', controller.reversePayment);

router.post('/click/invoices', controller.createInvoice);
router.get('/click/invoices/:invoiceId/status', controller.getInvoiceStatus);

module.exports = router;
