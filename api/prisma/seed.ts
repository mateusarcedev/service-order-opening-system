import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })

  const template = await prisma.checklistTemplate.upsert({
    where: { id: 'seed-template-1' },
    update: {},
    create: {
      id: 'seed-template-1',
      name: 'Checklist Padrão',
      items: {
        create: [
          { label: 'Registrar horário de início', required: true },
          { label: 'Validar ambiente/equipamentos', required: true },
          { label: 'Observações finais', required: false },
        ],
      },
    },
    include: { items: true },
  })

  const so = await prisma.serviceOrder.create({
    data: {
      title: 'Instalação inicial',
      description: 'Preparar ambiente e validar acesso.',
      status: 'OPEN',
      createdById: admin.id,
    },
  })

  console.log('Seed ok:', {
    admin: { email: admin.email },
    template: { id: template.id, items: template.items.length },
    serviceOrder: { id: so.id, status: so.status },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
