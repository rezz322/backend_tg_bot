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

    const isPublicGet = req.method === 'GET' && /^\/accounts\/key\/[^/]+$/.test(req.url);
    const isPublicPost = req.method === 'POST' && /^\/accounts\/?$/.test(req.url);

    if (isPublicGet || isPublicPost) {
      corsOptions.origin = true; // Allow all
    } else {
      // Restrict to bot origin
      const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://t.me';
      corsOptions.origin = allowedOrigin;
    }

    callback(null, corsOptions);
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
