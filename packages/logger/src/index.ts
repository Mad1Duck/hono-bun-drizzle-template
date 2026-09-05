import pino from 'pino';
import { LokiStream } from './loki';

const level = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';
const lokiUrl = process.env.LOKI_URL;
const lokiLabels = process.env.LOKI_LABELS
  ? (JSON.parse(process.env.LOKI_LABELS) as Record<string, string>)
  : { service: process.env.LOKI_SERVICE_NAME || 'backend' };

const options: pino.LoggerOptions = { level };

let stream: pino.DestinationStream | undefined;
let lokiStream: LokiStream | undefined;

if (lokiUrl) {
  lokiStream = new LokiStream({ url: lokiUrl, labels: lokiLabels });
  stream = pino.multistream([process.stdout, lokiStream]);
} else if (process.env.LOG_PRETTY === 'true' || (!isProduction && process.env.LOG_PRETTY !== 'false')) {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

// Pure pino logger, tanpa dependency ke database -- aman dipakai gateway.
// Untuk Loki, set LOKI_URL. Untuk CloudWatch/OpenTelemetry, tambahkan transport modul khusus.
export const logger = stream ? pino(options, stream) : pino(options);

export const closeLogger = async (): Promise<void> => {
  if (!lokiStream) return;
  await new Promise<void>((resolve) => {
    lokiStream!.once('finish', resolve);
    lokiStream!.end();
  });
};
