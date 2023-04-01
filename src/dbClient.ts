import { Pool, QueryResult } from 'pg';

const { DB_PASSWORD, DB_NAME, DB_USERNAME, DB_PORT, DB_HOST } = process.env;

const options = {
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 5000,
};
let pool;
if (!pool) {
  pool = new Pool(options);
}

export const client = async (action: string) => {
  const client = await pool.connect();

  let result: QueryResult;

  try {
    result = await client.query(action);
  } catch (err) {
    console.log(err);
    return err;
  } finally {
    client.release();
  }
  return result;
};

export const clientInsert = async (action: string, values: any) => {
  const client = await pool.connect();

  let result: QueryResult;

  try {
    result = await client.query(action, values);
  } catch (err) {
    console.log(err);
    return err;
  } finally {
    client.release();
  }
  return result;
};