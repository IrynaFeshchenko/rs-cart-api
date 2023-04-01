import { HttpStatus, Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { client } from 'src/dbClient';
import { v4 } from 'uuid';
import { Order } from '../models';

@Injectable()
export class OrderService {
  private orders: Record<string, Order> = {};

  async findById(orderId: string) {
    try {
      const orderById: QueryResult = await client(
        `select * from orders where id = '${orderId}';`,
      );
      if(orderById.rows[0]) {
        return orderById.rows[0];
      }
    } catch (err) {
      console.log('error on getting order by id: ', err);
      return {
        myError: err,
      };
    }
  }

  create(data: any) {
    const id = v4(v4());
    const order = {
      ...data,
      id,
      status: 'INProgress',
    };

    this.orders[id] = order;

    return order;
  }

  update(orderId, data) {
    const order = this.findById(orderId);

    if (!order) {
      throw new Error('Order does not exist.');
    }

    this.orders[orderId] = {
      ...data,
      id: orderId,
    };
  }

  async getOrders() {
    try {
      const orders: QueryResult = await client(`select * from orders`);
      if (orders.rows) {
        return {
          statusCode: HttpStatus.OK,
          message: 'OK',
          data: {
            orders: orders.rows,
          },
        };
      }
    } catch (err) {
      console.log('error', err);
      return {
        myError: err,
      };
    }
  }
}
