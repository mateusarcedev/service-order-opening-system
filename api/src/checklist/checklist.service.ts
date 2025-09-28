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
    @Inject(checklistRepository.CHECKLIST_REPOSITORY) private readonly repo: checklistRepository.ChecklistRepository,
  ) { }

  // Templates
  listTemplates() {
    return this.repo.listTemplates();
  }

  // Start
  async startChecklist(serviceOrderId: string, templateId: string, actor: { id: string; role?: string }) {
    // valida dono/admin
    const creator = await this.repo.getServiceOrderCreator(serviceOrderId);
    if (!creator) throw new NotFoundException('Service order not found');
    const isOwnerOrAdmin = actor.role === 'ADMIN' || creator.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');

    // já existe instância?
    const existing = await this.repo.getChecklistByServiceOrder(serviceOrderId);
    if (existing) throw new BadRequestException('Checklist already started');

    // template precisa existir (checa ao menos se há itens; se quiser, valide existência explicitamente)
    const items = await this.repo.getTemplateItems(templateId);
    if (items.length === 0) {
      // pode significar template inválido ou sem itens
      throw new BadRequestException('Invalid or empty template');
    }

    return this.repo.startChecklist(serviceOrderId, templateId);
  }

  // Answer (patch)
  async patchAnswers(serviceOrderId: string, inputs: Array<{ itemId: string; boolValue?: boolean; textValue?: string; note?: string }>, actor: { id: string; role?: string }) {
    const inst = await this.repo.getChecklistByServiceOrder(serviceOrderId);
    if (!inst) throw new NotFoundException('Checklist not started');

    // valida dono/admin
    const creator = await this.repo.getServiceOrderCreator(serviceOrderId);
    const isOwnerOrAdmin = actor.role === 'ADMIN' || creator?.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');

    // valida itens pertencem ao template
    const validItems = new Set((await this.repo.getTemplateItems(inst.templateId)).map((i) => i.id));
    for (const a of inputs) {
      if (!validItems.has(a.itemId)) throw new BadRequestException(`Item does not belong to template: ${a.itemId}`);
    }

    return this.repo.upsertAnswers(inst.id, inputs);
  }

  // Finish
  async finishChecklist(serviceOrderId: string, actor: { id: string; role?: string }) {
    const inst = await this.repo.getChecklistByServiceOrder(serviceOrderId);
    if (!inst) throw new NotFoundException('Checklist not started');

    // valida dono/admin
    const creator = await this.repo.getServiceOrderCreator(serviceOrderId);
    const isOwnerOrAdmin = actor.role === 'ADMIN' || creator?.createdById === actor.id;
    if (!isOwnerOrAdmin) throw new ForbiddenException('Not allowed');

    // valida required
    const totalReq = await this.repo.countRequiredItems(inst.templateId);
    const answeredReq = await this.repo.countRequiredAnswered(inst.id);
    if (answeredReq < totalReq) {
      throw new BadRequestException('Required items missing');
    }

    return this.repo.finishChecklist(inst.id);
  }
}
