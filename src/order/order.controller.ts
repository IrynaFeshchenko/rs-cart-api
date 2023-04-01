import { Body, Controller, Get, HttpStatus, Post, Put, Req } from '@nestjs/common';
import { client, clientInsert } from 'src/dbClient';
import { AppRequest } from 'src/shared';
import { v4 } from 'uuid';
import { OrderService } from './services';

@Controller('api/orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  async getOrders() {
    const orders = await this.orderService.getOrders();

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { orders },
    };
  }

  @Get(':orderId')
  async getOrdersById(@Req() req: AppRequest) {
    const order = await this.orderService.findById(req.params.orderId);
    let items;
    if (order.cart_id) {
       items = await client(
        `select * from cart_items where cart_id = '${order.cart_id}';`,
      );
    }

    if (order.myError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'ERROR',
        error: "Order doesn't exist",
      };
    } else {
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { order, items: items.rows || [] },
      };
    }
  }


  @Post('addOrder')
  async addOrder(@Req() req: AppRequest, @Body() body) {
    if (!(body && body.id)) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: 'Order is empty',
      };
    } else {
      const uuid = v4();
      const newOrder = await clientInsert(
        `INSERT INTO orders (user_id, cart_id, payment, delivery, comments, status, total) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [uuid, body.id, body.payment, body.delivery, body.comments, body.status, body.total],
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: newOrder.rows[0].id,
      };
    }
  }

  @Put('checkout')
  async checkOut(@Req() req: AppRequest, @Body() body) {
    try {
      let order;
      if (!body.id) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Order doesn't exist`,
        };
      } else {
        await clientInsert(
          `UPDATE orders SET status = $2 WHERE id = $1`,
          [body.id, "ORDERED"],
        );
        order = await this.orderService.findById(body.id);
        await clientInsert(
          `UPDATE carts SET status = $2 WHERE id = $1`,
          [order.cart_id, "ORDERED"],
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: {
          message: `Status of ${order.cart_id} cart updated.`,
        },
      };
    } catch (err) {
      console.log(err);
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Fail on adding product with id ${body.product.id} to cart`,
        err,
      };
    }
  }
}
