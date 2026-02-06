import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not found in environment');
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const projectCount = await prisma.project.count();
        const taskCount = await prisma.task.count();
        const userCount = await prisma.user.count();

        console.log(`Projects: ${projectCount}`);
        console.log(`Tasks: ${taskCount}`);
        console.log(`Users: ${userCount}`);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main().catch(e => console.error(e));
