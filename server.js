const { PORT } = require('./src/config/env');
const { initDB } = require('./src/db');
const app = require('./src/app');

let server;

async function bootstrap() {
  try {
    // 1. Initialize Database (Turso LibSQL or JSON fallback)
    await initDB();

    // 2. Start HTTP Server
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n💒 Marriage Expense Manager running at:\n   ➜  http://localhost:${PORT}\n`);
    });

    // 3. Graceful Shutdown Handlers
    const shutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      if (server) {
        server.close(() => {
          console.log('[Server] Closed HTTP connections. Exiting process.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('Failed to bootstrap server:', err);
    process.exit(1);
  }
}

bootstrap();
