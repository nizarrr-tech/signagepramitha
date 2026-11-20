import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as os from 'os';

function getLocalIPs(): string[] {
  const ifaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const iface of Object.values(ifaces)) {
    for (const info of iface || []) {
      if (info.family === 'IPv4' && !info.internal) ips.push(info.address);
    }
  }
  return ips;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      process.env.FRONTEND_URL || 'https://signagepramitha.vercel.app',
      /\.vercel\.app$/,
      /\.railway\.app$/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-admin-secret',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // listen on all interfaces

  const localIPs = getLocalIPs();
  const banner = `
╔══════════════════════════════════════════════════════╗
║          Digital Signage Backend — ONLINE            ║
╠══════════════════════════════════════════════════════╣
║  Localhost  : http://localhost:${port}                  ║
${localIPs.map(ip => `║  Jaringan   : http://${ip}:${port}${' '.repeat(Math.max(0, 24 - ip.length))}║`).join('\n')}
╠══════════════════════════════════════════════════════╣
║  WebSocket  : ws://0.0.0.0:${port}                      ║
║  Static     : /resources/<filename>                 ║
╚══════════════════════════════════════════════════════╝

📺 Player (lokal)   : http://localhost:3000/player?client=PRAMITHA
${localIPs.map(ip => `📺 Player (remote)  : http://${ip}:3000/player?client=PRAMITHA&api=http://${ip}:${port}`).join('\n')}
`;
  console.log(banner);
}

bootstrap();
