import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as checklistRepository from './checklist.repository';

@Injectable()
export class ChecklistService {
  constructor(
    @Inject(checklistRepository.CHECKLIST_REPOSITORY)
    private readonly repo: checklistRepository.ChecklistRepository,
  ) { }

  listTemplates() {
    return this.repo.listTemplates();
  }

  createTemplateWithItems(input: { name: string; items: { label: string; required: boolean }[] }) {
    return this.repo.createTemplateWithItems(input);
  }

  async startChecklist(serviceOrderId: string, templateId: string, actor: { id: string; role?: string }) {
    const creator = await this.repo.getServiceOrderCreator(serviceOrderId);
    if (!creator) throw new NotFoundException('Service order not found');
    const isOwnerOrAdmin = actor.role === 'ADMIN' || creator.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');
    const existing = await this.repo.getChecklistByServiceOrder(serviceOrderId);
    if (existing) throw new BadRequestException('Checklist already started');
    const items = await this.repo.getTemplateItems(templateId);
    if (items.length === 0) throw new BadRequestException('Invalid or empty template');
    return this.repo.startChecklist(serviceOrderId, templateId);
  }

  async getDetailForSO(serviceOrderId: string) {
    return this.repo.getChecklistDetailForSO(serviceOrderId);
  }

  async patchAnswers(
    serviceOrderId: string,
    inputs: Array<{ itemId: string; boolValue?: boolean; textValue?: string | null; note?: string | null }>,
    actor: { id: string; role?: string },
  ) {
    const inst = await this.repo.getChecklistByServiceOrder(serviceOrderId);
    if (!inst) throw new NotFoundException('Checklist not started');
    const creator = await this.repo.getServiceOrderCreator(serviceOrderId);
    const isOwnerOrAdmin = actor.role === 'ADMIN' || creator?.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');

    const validItems = new Set((await this.repo.getTemplateItems(inst.templateId)).map((i) => i.id));
    for (const a of inputs) {
      if (!validItems.has(a.itemId)) {
        throw new BadRequestException(`Item does not belong to template: ${a.itemId}`);
      }
    }

    return this.repo.upsertAnswers(
      inst.id,
      inputs.map((i) => ({
        itemId: i.itemId,
        boolValue: i.boolValue ?? null,
        textValue: i.textValue ?? null,
        note: i.note ?? null,
      })),
    );
  }

  async finishChecklist(serviceOrderId: string, actor: { id: string; role?: string }) {
    const inst = await this.repo.getChecklistByServiceOrder(serviceOrderId);
    if (!inst) throw new NotFoundException('Checklist not started');
    const creator = await this.repo.getServiceOrderCreator(serviceOrderId);
    const isOwnerOrAdmin = actor.role === 'ADMIN' || creator?.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');

    const totalReq = await this.repo.countRequiredItems(inst.templateId);
    const answeredReq = await this.repo.countRequiredAnswered(inst.id);
    if (answeredReq < totalReq) {
      throw new BadRequestException('Required items missing');
    }

    return this.repo.finishChecklist(inst.id);
  }
}
