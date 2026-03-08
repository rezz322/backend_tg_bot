import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Custom CORS Logic
  app.enableCors((req, callback) => {
    const corsOptions: any = {
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    };

    const publicRoutes = ['/accounts', '/accounts/key/'];
    const isPublic = publicRoutes.some(path => req.url.startsWith(path));

    // Exception for POST /accounts (create) and GET /accounts/key/ (info by key)
    if (isPublic && (req.method === 'POST' || req.method === 'GET')) {
      corsOptions.origin = true; // Allow all
    } else {
      // Restrict to bot origin (placeholder or from env)
      const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://t.me';
      corsOptions.origin = allowedOrigin;
    }

    callback(null, corsOptions);
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
