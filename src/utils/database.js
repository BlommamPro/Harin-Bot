import mongoose from 'mongoose';
import { config } from '../../config/config.js';
import { logger } from './logger.js';

export async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoURL);
    logger.db('Conectado a MongoDB');
  } catch (err) {
    logger.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.db('Desconectado de MongoDB');
  } catch (err) {
    logger.error('Error al desconectar de MongoDB:', err.message);
  }
}

export function setupDBShutdown(client = null) {
  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.warn(`Recibida señal ${signal}, cerrando limpiamente...`);

    try {
      if (client && client.isReady()) {
        client.destroy();
        logger.info('Cliente de Discord cerrado');
      }
    } catch (err) {
      logger.error('Error cerrando cliente Discord:', err.message);
    }

    await disconnectDB();

    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}