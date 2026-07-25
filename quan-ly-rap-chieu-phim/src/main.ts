import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
