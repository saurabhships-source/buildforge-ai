import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a test admin user (replace clerkId with your actual Clerk user ID)
  const admin = await db.user.upsert({
    where: { email: 'admin@buildforge.ai' },
    update: {},
    create: {
      clerkId: 'clerk_admin_placeholder',
      email: 'admin@buildforge.ai',
      name: 'Admin User',
      role: 'admin',
      subscription: {
        create: {
          plan: 'enterprise',
          creditsRemaining: 9999,
          creditsTotal: 9999,
        },
      },
    },
  })

  console.log('Created admin user:', admin.email)
  console.log('Seeding complete.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
