import express from 'express';
import loggingMiddleware from './loggingMiddleware.js';
import shortUrlRouter from './shortUrlRouter.js';

const app = express();

app.use(express.json());
app.use(loggingMiddleware);
app.use('/', shortUrlRouter);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
