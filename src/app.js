const express = require('express');
const clickRoutes = require('./routes/click.routes');
const clickController = require('./controllers/click.controller');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// app.disable('x-powered-by'); // Commented out for now
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/healthz', (req, res) => res.json({ ok: true }));
app.get('/pay', clickController.quickPay);
app.get('/payment/callback', clickController.clickReturnCallback);
app.post('/api/click/prepare', clickController.clickPrepare);
app.post('/api/click/complete', clickController.clickComplete);
app.use('/api', clickRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
