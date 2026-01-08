import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create or update admin user
  const adminEmail = 'admin@deebop.com';
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: adminEmail,
      username: 'admin',
      displayName: 'Admin User',
      passwordHash: hashedPassword,
      tier: 'pro',
    },
  });

  console.log('Admin user created/updated:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`  Username: ${adminUser.username}`);
  console.log(`  ID: ${adminUser.id}`);

  // Create a test post
  const testPost = await prisma.post.create({
    data: {
      userId: adminUser.id,
      contentType: 'shout',
      description: 'Hello from the admin! This is a test post to verify the admin panel works correctly. #deebop #test',
      provenance: 'original',
      visibility: 'public',
    },
  });

  console.log('\nTest post created:');
  console.log(`  ID: ${testPost.id}`);
  console.log(`  Content: ${testPost.description}`);

  // Create another test user with some posts
  const testEmail = 'testuser@deebop.com';
  const testPassword = 'test123';
  const testHashedPassword = await bcrypt.hash(testPassword, 10);

  const testUser = await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      email: testEmail,
      username: 'testuser',
      displayName: 'Test User',
      passwordHash: testHashedPassword,
      tier: 'free',
    },
  });

  // Create some posts for test user
  await prisma.post.createMany({
    data: [
      {
        userId: testUser.id,
        contentType: 'shout',
        description: 'Just joined Deebop! Excited to share my thoughts here. #newbie',
        provenance: 'original',
        visibility: 'public',
      },
      {
        userId: testUser.id,
        contentType: 'shout',
        description: 'What a beautiful day! #sunshine #happy',
        provenance: 'original',
        visibility: 'public',
      },
    ],
    skipDuplicates: true,
  });

  console.log('\nTest user created:');
  console.log(`  Email: ${testEmail}`);
  console.log(`  Password: ${testPassword}`);
  console.log(`  Username: ${testUser.username}`);

  console.log('\n✅ Setup complete! You can now login at http://localhost:3001/login');
  console.log('   Admin credentials: admin@deebop.com / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
