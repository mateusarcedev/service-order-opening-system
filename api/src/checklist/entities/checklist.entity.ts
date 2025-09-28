export type ChecklistTemplateEntity = {
  id: string;
  name: string;
};

export type ChecklistItemEntity = {
  id: string;
  templateId: string;
  label: string;
  required: boolean;
};

export type ServiceOrderChecklistEntity = {
  id: string;
  serviceOrderId: string;
  templateId: string;
  startedAt: Date;
  finishedAt?: Date | null;
};

export type ChecklistAnswerEntity = {
  id: string;
  soChecklistId: string;
  itemId: string;
  boolValue?: boolean | null;
  textValue?: string | null;
  note?: string | null;
};
