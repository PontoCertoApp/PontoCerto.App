import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'henriquemendonca060502@gmail.com'
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  })
  console.log('User elevated to ADMIN:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
