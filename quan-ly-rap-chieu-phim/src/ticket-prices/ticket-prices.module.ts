import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketPrice } from './ticket-price.entity';
import { TicketPricesService } from './ticket-prices.service';
import { TicketPricesController } from './ticket-prices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TicketPrice])],
  controllers: [TicketPricesController],
  providers: [TicketPricesService],
  // export để CheckoutModule dùng getCurrentPrice() lúc tính tiền vé.
  exports: [TicketPricesService],
})
export class TicketPricesModule {}
