
const logs = [];

export default function loggingMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
    };
    logs.push(logEntry);
  });
  next();
}


export function getLogs() {
  return logs;
}
