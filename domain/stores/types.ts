export type StoreSummary = {
  id: number | string;
  name: string;
  address?: string;
};

export type TableUnit = {
  id: string;
  name: string;
  min_capacity: number;
  max_capacity: number;
  quantity: number;
  is_private: boolean;
};
