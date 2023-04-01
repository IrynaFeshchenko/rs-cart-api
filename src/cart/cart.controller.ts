import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { QueryResult } from 'pg';
import { client, clientInsert } from '../dbClient';
import { OrderService } from '../order';
import { AppRequest } from '../shared';
import { v4 } from 'uuid';
import { CartService } from './services';

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Get(':cartid')
  async findUserCart(@Req() req: AppRequest) {
    try {
      console.log('req & params!!!: ', req.params, req.params.cartid);
      const cart: QueryResult = await client(
        `select * from carts where id = '${req.params.cartid}';`,
      );
      if (cart) {
        const items = await client(
          `select * from cart_items where cart_id = '${cart.rows[0].id}';`,
        );

        return {
          statusCode: HttpStatus.OK,
          message: 'OK',
          data: {
            cart: { ...cart.rows[0], items: items.rows || [] },
          },
        };
      }
    } catch (err) {
      console.log('error on getting cart by id: ', err);
      return {
        myError: err,
      };
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(@Req() req: AppRequest, @Body() body) {
    try {
      const updated_at = new Date(Date.now()).toISOString();
      if (!body.cart.status) {
        await clientInsert(`UPDATE carts SET updated_at = $2 WHERE id = $1`, [
          body.cart.id,
          updated_at,
        ]);
      } else {
        await clientInsert(
          `UPDATE carts SET updated_at = $2, status = $3 WHERE id = $1`,
          [body.cart.id, updated_at, body.cart.status],
        );
      }
      if (body.cart.items.length) {
        const items = await client(
          `select * from cart_items where cart_id = '${body.cart.id}';`,
        );
        items.rows.forEach(async item => {
          await client(
            `DELETE FROM cart_items WHERE cart_id = '${body.cart.id}';`,
          );
        });

        body.cart.items.forEach(async element => {
          await clientInsert(
            `INSERT INTO cart_items ("cart_id", "product_id", "count") VALUES ($1, $2, $3)`,
            [body.cart.id, element.product_id, element.count],
          );
        });
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: {
          message: `Success on  ${body.cart.id} cart update.`,
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

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Delete(':cartid')
  async clearUserCart(@Req() req: AppRequest) {
    try {
      console.log('req & params!!!: ', req.params, req.params.cartid);
      const cart: QueryResult = await client(
        `select * from carts where id = '${req.params.cartid}';`,
      );
      if (cart.rows.length) {
        await client(`DELETE FROM carts WHERE id = '${req.params.cartid}';`);
        return {
          statusCode: HttpStatus.OK,
          message: 'OK',
          info: `Cart ${req.params.cartid} removed`,
        };
      } else {
        return {
          myError: 'Cart does not exist',
        };
      }
    } catch (err) {
      console.log('error on deleting cart by id: ', err);
      return {
        myError: err,
      };
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Post('addCart')
  async addCart(@Req() req: AppRequest, @Body() body) {
    if (!(body.cart && body.cart.items.length)) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: 'Cart is empty',
      };
    } else {
      const uuid = v4();
      const date = new Date(Date.now()).toISOString();
      const newCart = await clientInsert(
        `INSERT INTO carts ("user_id", "created_at", "updated_at", "status") VALUES ($1, $2, $3, $4) RETURNING id`,
        [uuid, date, date, body.cart.status],
      );
      if (body.cart.items) {
        body.cart.items.forEach(async element => {
          await clientInsert(
            `INSERT INTO cart_items ("cart_id", "product_id", "count") VALUES ($1, $2, $3)`,
            [newCart.rows[0].id, element.product_id, element.count],
          );
        });
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: newCart.rows[0].id,
      };
    }
  }
}
