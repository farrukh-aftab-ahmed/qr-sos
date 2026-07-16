import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Demo Admin User
  const demoAdmin = await prisma.user.upsert({
    where: { email: 'admin@qr-sos.com' },
    update: { isAdmin: true },
    create: {
      name: 'Demo Admin',
      email: 'admin@qr-sos.com',
      phone: '+15550009999',
      passwordHash: await bcrypt.hash('admin1234', 12),
      isAdmin: true,
      emergencyContacts: {
        create: [
          {
            name: 'Admin Contact 1',
            phone: '+15550001111',
            relationship: 'Spouse',
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log(`Seeded demo admin: ${demoAdmin.email} (password: admin1234)`);

  // Demo Regular User
  const demoUser = await prisma.user.upsert({
    where: { email: 'user@qr-sos.com' },
    update: { isAdmin: false },
    create: {
      name: 'Demo User',
      email: 'user@qr-sos.com',
      phone: '+15550008888',
      passwordHash: await bcrypt.hash('user1234', 12),
      isAdmin: false,
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

  console.log(`Seeded demo user: ${demoUser.email} (password: user1234)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
