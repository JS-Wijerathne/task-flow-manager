import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from the root
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
