export type PhotoEntity = {
  id?: string;
  serviceOrderId: string;
  key: string;
  url?: string | null;
  takenAt?: Date;
  mimetype: string;
  size: number;
};
