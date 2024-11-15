import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export const createPgClient = () => {
  return new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: parseInt(process.env.PG_PORT || '5432'),
  });
};
