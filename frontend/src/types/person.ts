export interface Person {
  id: number;
  name: string;
  birthYear?: number;
  deathYear?: number;
  gender?: string;
  bioSummary?: string;
  groupIds?: number[];  // 所属群体ID
}