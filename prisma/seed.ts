import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@qr-sos.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@qr-sos.com',
      phone: '+15550001234',
      passwordHash: await bcrypt.hash('demo1234', 12),
      emergencyContacts: {
        create: [
          {
            name: 'Jane Demo',
            phone: '+15550005678',
            relationship: 'Spouse',
            isPrimary: true,
          },
          {
            name: 'Bob Demo',
            phone: '+15550009012',
            relationship: 'Parent',
            isPrimary: false,
          },
        ],
      },
    },
  });

  console.log(`Seeded demo user: ${demoUser.email} (password: demo1234)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
