import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Thành viên 1
import { MoviesModule } from './movies/movies.module';
import { RoomsModule } from './rooms/rooms.module';
import { SeatsModule } from './seats/seats.module';
import { CustomersModule } from './customers/customers.module';

// Thành viên 2
import { EmployeesModule } from './employees/employees.module';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { BookingsModule } from './bookings/bookings.module';
import { TicketsModule } from './tickets/tickets.module';

// Thành viên 3
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { FoodOrdersModule } from './food-orders/food-orders.module';

// Cookies + Session
import { CookiesModule } from './cookies/cookies.module';
import { SessionModule } from './session/session.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'PhuongAnh1',
      database: 'quan_ly_rap_chieu_phim',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    // Thành viên 1
    MoviesModule,
    RoomsModule,
    SeatsModule,
    CustomersModule,

    // Thành viên 2
    EmployeesModule,
    ShowtimesModule,
    BookingsModule,
    TicketsModule,

    // Thành viên 3
    PaymentsModule,
    ProductsModule,
    FoodOrdersModule,

    // Cookies + Session
    CookiesModule,
    SessionModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
