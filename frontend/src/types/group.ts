export interface Group {
  id: number;
  name: string;
  parentId?: number;
  type: string;
  description?: string;
}