// prisma/seed.ts
import { PrismaClient, Role, Status } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.time('seed')

  // Limpa em ordem de dependência
  await prisma.checklistAnswer.deleteMany()
  await prisma.serviceOrderPhoto.deleteMany()
  await prisma.serviceOrderChecklist.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.checklistTemplate.deleteMany()
  await prisma.serviceOrder.deleteMany()
  await prisma.user.deleteMany()

  // ===== USERS =====
  const usersData = [
    { id: randomUUID(), name: 'Admin', email: 'admin@example.com', role: Role.ADMIN, pass: 'admin123' },
    { id: randomUUID(), name: 'Gestor', email: 'manager@example.com', role: Role.MANAGER, pass: 'manager123' },
    { id: randomUUID(), name: 'Técnico', email: 'tech@example.com', role: Role.TECH, pass: 'tech123' },
    { id: randomUUID(), name: 'Leitor', email: 'viewer@example.com', role: Role.VIEWER, pass: 'viewer123' },
  ]

  const users = await Promise.all(
    usersData.map(async (u) =>
      prisma.user.create({
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          passwordHash: await bcrypt.hash(u.pass, 10),
        },
      }),
    ),
  )

  const admin = users.find((u) => u.email === 'admin@example.com')!
  const tech = users.find((u) => u.email === 'tech@example.com')!

  // ===== CHECKLIST TEMPLATES =====
  const tplPadraoId = randomUUID()
  const tplInstalacaoId = randomUUID()

  await prisma.checklistTemplate.create({
    data: {
      id: tplPadraoId,
      name: 'Checklist Padrão',
      items: {
        create: [
          { id: randomUUID(), label: 'Registrar horário de início', required: true },
          { id: randomUUID(), label: 'Validar ambiente/equipamentos', required: true },
          { id: randomUUID(), label: 'Observações finais', required: false },
        ],
      },
    },
  })

  await prisma.checklistTemplate.create({
    data: {
      id: tplInstalacaoId,
      name: 'Instalação de Equipamento',
      items: {
        create: [
          { id: randomUUID(), label: 'Conferir tensão de alimentação', required: true },
          { id: randomUUID(), label: 'Fixar equipamento no rack', required: true },
          { id: randomUUID(), label: 'Configurar IP e hostname', required: true },
          { id: randomUUID(), label: 'Checklist visual de cabos', required: false },
        ],
      },
    },
  })

  const tplInstalacao = await prisma.checklistTemplate.findUnique({
    where: { id: tplInstalacaoId },
    include: { items: true },
  })

  // ===== SERVICE ORDERS =====
  const soData = [
    {
      id: randomUUID(),
      title: 'Instalação inicial',
      description: 'Preparar ambiente e validar acesso.',
      status: Status.OPEN,
      createdById: admin.id,
    },
    {
      id: randomUUID(),
      title: 'Troca de hardware',
      description: 'Substituir HD com falha no servidor A.',
      status: Status.IN_PROGRESS,
      createdById: tech.id,
    },
    {
      id: randomUUID(),
      title: 'Configuração de rede',
      description: 'Ajustar VLANs no switch core.',
      status: Status.DONE,
      createdById: admin.id,
    },
    {
      id: randomUUID(),
      title: 'Atualização de firmware',
      description: 'Atualizar firmware do roteador da filial.',
      status: Status.OPEN,
      createdById: tech.id,
    },
    {
      id: randomUUID(),
      title: 'Auditoria de segurança',
      description: 'Executar checklist de hardening.',
      status: Status.IN_PROGRESS,
      createdById: admin.id,
    },
  ]

  const serviceOrders = await prisma.$transaction(
    soData.map((s) =>
      prisma.serviceOrder.create({ data: s }),
    ),
  )

  // ===== CHECKLIST INICIADO EM UMA OS IN_PROGRESS =====
  const targetSO = serviceOrders.find((s) => s.status === Status.IN_PROGRESS)!
  const soChecklistId = randomUUID()

  if (tplInstalacao && tplInstalacao.items.length > 0) {
    await prisma.serviceOrderChecklist.create({
      data: {
        id: soChecklistId,
        serviceOrderId: targetSO.id,
        templateId: tplInstalacao.id,
        startedAt: new Date(),
      },
    })

    const answers = tplInstalacao.items.slice(0, 2).map((item) => ({
      id: randomUUID(),
      soChecklistId,
      itemId: item.id,
      boolValue: true,
      textValue: 'OK',
      note: 'Verificado durante a visita',
    }))

    await prisma.checklistAnswer.createMany({ data: answers })
  }

  // ===== LOG =====
  console.log('Seed ok:')
  console.table(users.map((u) => ({ id: u.id, email: u.email, role: u.role })))
  console.table(serviceOrders.map((s) => ({ id: s.id, title: s.title, status: s.status })))

  console.timeEnd('seed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
