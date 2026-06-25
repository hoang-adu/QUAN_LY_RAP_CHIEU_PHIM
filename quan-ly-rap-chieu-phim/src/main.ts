import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.use(
    session({
      secret: 'my-secret-key', // Thay bằng giá trị bí mật thực tế (env variable)
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 3600 * 1000, // 1 giờ
        sameSite: 'strict',
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
 
