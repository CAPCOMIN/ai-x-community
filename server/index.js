'use strict';

const { createApp } = require('./app');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

const app = createApp();
const server = app.listen(port, host, () => {
  console.log(`AI+X community server listening on http://${host}:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(() => {
    app.close();
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Force exiting after shutdown timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
