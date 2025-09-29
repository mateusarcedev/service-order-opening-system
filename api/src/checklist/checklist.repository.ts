import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import type {
  ChecklistAnswerEntity,
  ChecklistItemEntity,
  ChecklistTemplateEntity,
  ServiceOrderChecklistEntity,
} from './entities/checklist.entity';

export const CHECKLIST_REPOSITORY = Symbol('CHECKLIST_REPOSITORY');

export interface ChecklistRepository {
  listTemplates(): Promise<ChecklistTemplateEntity[]>;
  getTemplateItems(templateId: string): Promise<ChecklistItemEntity[]>;
  createTemplateWithItems(input: {
    name: string;
    items: { label: string; required: boolean }[];
  }): Promise<ChecklistTemplateEntity & { items: ChecklistItemEntity[] }>;
  getChecklistByServiceOrder(serviceOrderId: string): Promise<ServiceOrderChecklistEntity | null>;
  getChecklistDetailForSO(serviceOrderId: string): Promise<{
    template: { name: string; items: Array<{ id: string; label: string; required: boolean }> } | null;
    answers: Array<{ itemId: string; boolValue: boolean | null; textValue: string | null; note: string | null }>;
  } | null>;
  startChecklist(serviceOrderId: string, templateId: string): Promise<ServiceOrderChecklistEntity>;
  finishChecklist(checklistId: string): Promise<ServiceOrderChecklistEntity>;
  upsertAnswers(
    checklistId: string,
    inputs: Array<{ itemId: string; boolValue?: boolean | null; textValue?: string | null; note?: string | null }>,
  ): Promise<ChecklistAnswerEntity[]>;
  countRequiredItems(templateId: string): Promise<number>;
  countRequiredAnswered(checklistId: string): Promise<number>;
  getServiceOrderCreator(serviceOrderId: string): Promise<{ createdById: string } | null>;
}

@Injectable()
export class PrismaChecklistRepository implements ChecklistRepository {
  constructor(private readonly prisma: PrismaService) { }

  async listTemplates() {
    const rows = await this.prisma.checklistTemplate.findMany({ orderBy: { name: 'asc' } });
    return rows.map((t) => ({ id: t.id, name: t.name }));
  }

  async getTemplateItems(templateId: string) {
    const rows = await this.prisma.checklistItem.findMany({
      where: { templateId },
      orderBy: { label: 'asc' },
    });
    return rows.map((i) => ({
      id: i.id,
      templateId: i.templateId,
      label: i.label,
      required: i.required,
    }));
  }

  async createTemplateWithItems(input: { name: string; items: { label: string; required: boolean }[] }) {
    const t = await this.prisma.checklistTemplate.create({
      data: {
        name: input.name,
        items: { create: input.items.map((i) => ({ label: i.label, required: i.required })) },
      },
      include: { items: true },
    });
    return {
      id: t.id,
      name: t.name,
      items: t.items.map((i) => ({ id: i.id, templateId: i.templateId, label: i.label, required: i.required })),
    };
  }

  async getChecklistByServiceOrder(serviceOrderId: string) {
    const c = await this.prisma.serviceOrderChecklist.findFirst({ where: { serviceOrderId } });
    return c
      ? { id: c.id, serviceOrderId: c.serviceOrderId, templateId: c.templateId, startedAt: c.startedAt, finishedAt: c.finishedAt }
      : null;
  }

  async getChecklistDetailForSO(serviceOrderId: string) {
    const inst = await this.prisma.serviceOrderChecklist.findFirst({
      where: { serviceOrderId },
      include: {
        template: { include: { items: { orderBy: { label: 'asc' } } } },
        answers: true,
      },
    });
    if (!inst) return null;
    return {
      template: inst.template
        ? {
          name: inst.template.name,
          items: inst.template.items.map((i) => ({ id: i.id, label: i.label, required: i.required })),
        }
        : null,
      answers: (inst.answers ?? []).map((a) => ({
        itemId: a.itemId,
        boolValue: a.boolValue,
        textValue: a.textValue,
        note: a.note,
      })),
    };
  }

  async startChecklist(serviceOrderId: string, templateId: string) {
    const c = await this.prisma.serviceOrderChecklist.create({ data: { serviceOrderId, templateId } });
    return { id: c.id, serviceOrderId: c.serviceOrderId, templateId: c.templateId, startedAt: c.startedAt, finishedAt: c.finishedAt };
  }

  async finishChecklist(checklistId: string) {
    const c = await this.prisma.serviceOrderChecklist.update({
      where: { id: checklistId },
      data: { finishedAt: new Date() },
    });
    return { id: c.id, serviceOrderId: c.serviceOrderId, templateId: c.templateId, startedAt: c.startedAt, finishedAt: c.finishedAt };
  }

  async upsertAnswers(
    checklistId: string,
    inputs: Array<{ itemId: string; boolValue?: boolean | null; textValue?: string | null; note?: string | null }>,
  ) {
    const ops = inputs.map((a) =>
      this.prisma.checklistAnswer.upsert({
        where: { soChecklistId_itemId: { soChecklistId: checklistId, itemId: a.itemId } },
        update: { boolValue: a.boolValue ?? null, textValue: a.textValue ?? null, note: a.note ?? null },
        create: { soChecklistId: checklistId, itemId: a.itemId, boolValue: a.boolValue ?? null, textValue: a.textValue ?? null, note: a.note ?? null },
      }),
    );
    const rows = await this.prisma.$transaction(ops);
    return rows.map((r) => ({ id: r.id, soChecklistId: r.soChecklistId, itemId: r.itemId, boolValue: r.boolValue, textValue: r.textValue, note: r.note }));
  }

  async countRequiredItems(templateId: string) {
    return this.prisma.checklistItem.count({ where: { templateId, required: true } });
  }

  async countRequiredAnswered(checklistId: string) {
    return this.prisma.checklistAnswer.count({
      where: {
        soChecklistId: checklistId,
        item: { required: true },
        OR: [{ boolValue: true }, { textValue: { not: null } }],
      },
    });
  }

  async getServiceOrderCreator(serviceOrderId: string) {
    const so = await this.prisma.serviceOrder.findUnique({ where: { id: serviceOrderId }, select: { createdById: true } });
    return so ?? null;
  }
}
