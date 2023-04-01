import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './services';

@Module({
  providers: [OrderService],
  exports: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
