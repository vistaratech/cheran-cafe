import { create } from 'zustand';
import { DateRange } from 'react-day-picker';

interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dailySales: { date: string; total: number }[];
}

interface ItemsReportData {
  bestSelling: { name: string; quantity: number; revenue: number }[];
  leastSelling: { name: string; quantity: number; revenue: number }[];
}

interface KitchenReportData {
  avgPrepTime: number;
  mostDelayed: { name: string; avgTime: number }[];
}

// Define normalized entities
interface NormalizedEntities {
  salesReports: Record<string, SalesReportData>;
  itemsReports: Record<string, ItemsReportData>;
  kitchenReports: Record<string, KitchenReportData>;
}

interface NormalizedState {
  entities: NormalizedEntities;
  loading: boolean;
  error: string | null;
}

interface NormalizedReportsState extends NormalizedState {
  fetchReports: (dateRange?: DateRange) => Promise<void>;
  clearReports: () => void;
  
  // Selector helpers
  getSalesReport: () => SalesReportData | null;
  getItemsReport: () => ItemsReportData | null;
  getKitchenReport: () => KitchenReportData | null;
}

// Initial state
const initialState: NormalizedState = {
  entities: {
    salesReports: {},
    itemsReports: {},
    kitchenReports: {}
  },
  loading: false,
  error: null
};

export const useReportsStore = create<NormalizedReportsState>()((set, get) => ({
  ...initialState,
  
  fetchReports: async (dateRange?: DateRange) => {
    set({ loading: true, error: null });
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('to', dateRange.to.toISOString());
      }
      
      const response = await fetch(`/api/reports?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        // Create unique IDs for reports
        const reportId = dateRange 
          ? `${dateRange.from?.toISOString()}-${dateRange.to?.toISOString()}`
          : 'default';
          
        set({
          entities: {
            ...get().entities,
            salesReports: {
              ...get().entities.salesReports,
              [reportId]: result.data.sales
            },
            itemsReports: {
              ...get().entities.itemsReports,
              [reportId]: result.data.items
            },
            kitchenReports: {
              ...get().entities.kitchenReports,
              [reportId]: result.data.kitchen
            }
          },
          loading: false
        });
      } else {
        set({
          error: result.error || 'Failed to fetch reports',
          loading: false
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false
      });
    }
  },
  
  clearReports: () => {
    set({
      entities: {
        salesReports: {},
        itemsReports: {},
        kitchenReports: {}
      },
      loading: false,
      error: null
    });
  },
  
  // Selector helpers
  getSalesReport: () => {
    const { entities } = get();
    const reportIds = Object.keys(entities.salesReports);
    return reportIds.length > 0 ? entities.salesReports[reportIds[0]] : null;
  },
  
  getItemsReport: () => {
    const { entities } = get();
    const reportIds = Object.keys(entities.itemsReports);
    return reportIds.length > 0 ? entities.itemsReports[reportIds[0]] : null;
  },
  
  getKitchenReport: () => {
    const { entities } = get();
    const reportIds = Object.keys(entities.kitchenReports);
    return reportIds.length > 0 ? entities.kitchenReports[reportIds[0]] : null;
  }
}));