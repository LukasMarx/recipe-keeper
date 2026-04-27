export interface CustomItem {
  id: number;
  name: string;
  category: string;
  defaultUnit: string | null;
  imageUrl: string | null;
  householdId: number | null;
  userId: number;
}
