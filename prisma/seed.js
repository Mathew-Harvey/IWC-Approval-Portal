/**
 * Database Seed Script
 * Run with: npm run db:seed
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');
    
    // Note: Users are created through Google OAuth, not seeded
    // This seed file is for reference data only
    
    console.log('✅ Database seed completed');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

