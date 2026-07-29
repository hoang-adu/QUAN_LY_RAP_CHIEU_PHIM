import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { UPLOAD_ROOT } from './uploads/upload.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cho phép truy cập file đã upload qua http://<host>/uploads/<folder>/<file>
  // (vd. poster phim tải từ máy lên) — cùng thư mục UPLOAD_ROOT mà
  // UploadsController ghi file xuống.
  app.useStaticAssets(UPLOAD_ROOT, { prefix: '/uploads' });

  app.enableCors({
    // Cho phép mọi cổng localhost lúc dev (CRA có thể tự nhảy cổng nếu 3001 đã bị chiếm)
    origin: process.env.FRONTEND_URL ?? /^http:\/\/localhost:\d+$/,
    credentials: true,
  });

  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'my-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: Number(process.env.SESSION_MAX_AGE ?? 3600 * 1000),
        sameSite: 'strict',
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();