export interface Promotion {
  id: string;
  storeId: string;
  title: string;
  benefit: string;
  endTime: string;
  storeName?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfferRulePayload {
  storeId: string;
  title: string;
  benefit: string;
  endTime: string;
  storeName?: string;
  imageUrl?: string;
}
