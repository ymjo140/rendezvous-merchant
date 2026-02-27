import { create } from "zustand";

type AppState = {
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
  isReservationModalOpen: boolean;
  setReservationModalOpen: (isOpen: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedStoreId: null,
  setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),
  isReservationModalOpen: false,
  setReservationModalOpen: (isOpen) => set({ isReservationModalOpen: isOpen }),
}));
