/**
 * Multi-Profile Migration Script
 *
 * This script migrates the database from single-profile (User) to multi-profile
 * (Identity + User/Profile) architecture.
 *
 * What it does:
 * 1. For each existing User, creates an Identity record with login/billing info
 * 2. Links the User to the new Identity via identityId
 * 3. Sets isDefault = true (first/only profile is the default)
 *
 * Run with: npx ts-node scripts/migrate-to-multi-profile.ts
 *
 * IMPORTANT: Backup your database before running this script!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Multi-Profile Migration...\n');

  // Get count of users without identity
  const usersWithoutIdentity = await prisma.user.count({
    where: { identityId: null },
  });

  console.log(`Found ${usersWithoutIdentity} users without an Identity.\n`);

  if (usersWithoutIdentity === 0) {
    console.log('✅ All users already have an Identity. Migration complete!');
    return;
  }

  // Get all users without identity in batches
  const batchSize = 100;
  let processed = 0;
  let errors = 0;

  // Process in batches to handle large datasets
  while (processed < usersWithoutIdentity) {
    const users = await prisma.user.findMany({
      where: { identityId: null },
      take: batchSize,
      select: {
        id: true,
        email: true,
        passwordHash: true,
        tier: true,
        stripeCustomerId: true,
        birthYear: true,
      },
    });

    if (users.length === 0) break;

    for (const user of users) {
      try {
        // Check if Identity with this email already exists
        // (could happen if migration was partially run before)
        let identity = await prisma.identity.findUnique({
          where: { email: user.email },
        });

        if (!identity) {
          // Create new Identity
          identity = await prisma.identity.create({
            data: {
              email: user.email,
              passwordHash: user.passwordHash,
              tier: user.tier,
              stripeCustomerId: user.stripeCustomerId,
              birthYear: user.birthYear,
            },
          });
          console.log(`  ✓ Created Identity for ${user.email}`);
        } else {
          console.log(`  ℹ Identity already exists for ${user.email}`);
        }

        // Link User to Identity
        await prisma.user.update({
          where: { id: user.id },
          data: {
            identityId: identity.id,
            isDefault: true,
          },
        });

        processed++;

        // Progress indicator
        if (processed % 10 === 0 || processed === usersWithoutIdentity) {
          console.log(`  Progress: ${processed}/${usersWithoutIdentity} users migrated`);
        }
      } catch (error) {
        console.error(`  ✗ Error migrating user ${user.email}:`, error);
        errors++;
      }
    }
  }

  console.log('\n========================================');
  console.log('Migration Summary:');
  console.log(`  Total processed: ${processed}`);
  console.log(`  Errors: ${errors}`);
  console.log('========================================\n');

  if (errors === 0) {
    console.log('✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data integrity');
    console.log('2. Update auth layer to use Identity for login');
    console.log('3. Update API routes to use getCurrentProfile()');
  } else {
    console.log('⚠️ Migration completed with errors. Please review the logs.');
  }
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
