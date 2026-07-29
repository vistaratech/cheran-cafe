"use client";
import useSWR from 'swr';
import { useMemo, useEffect, type DragEvent } from "react";
import { OrderCard } from "@/components/kds/order-card";
import { type Order, type OrderItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { useUserStore } from '@/lib/stores/user-store';
import { fetcher } from '@/lib/swr-fetcher';
import { type IWorkstation } from '@/models/Workstation';
import { debugKDS } from '@/lib/helpers';
import { KDS_STATES } from '@/lib/constants';
import useKDSStore from '@/lib/stores/kds-store';
import { usePermissions } from '@/lib/hooks/use-permissions';

export default function KdsPage() {
  const { t } = useI18nStore();
  const user = useUserStore((state) => state.getCurrentUser());
  const { can, getAllowedWorkstations } = usePermissions();
  const kdsStore = useKDSStore();
  const allWorkstations = kdsStore.getSortedWorkstations();

  // Filter workstations based on role permissions
  const allowedWsIds = getAllowedWorkstations(); // empty = all
  const workstations = allowedWsIds.length > 0
    ? allWorkstations.filter(ws => allowedWsIds.includes(ws.id))
    : allWorkstations;
  const orders = kdsStore.getTodayOrders(); // Filter orders to only show items from the current day (< 24 hours old)
  
  const {
    activeTab,
    draggedOrderId,
    dragOverOrderId,
    setWorkstations,
    setOrders,
    setActiveTab,
    setDraggedOrderId,
    setDragOverOrderId,
    transitionItem,
    updateItemStatus,
    revertItemStatus,
    togglePinOrder,
    getWorkstationById,
    getWorkstationIndex,
    getNextWorkstation,
    getPreviousWorkstation,
    getOrderByID,
    getItemsByWorkstation,
    reorderOrderItems,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragEnter,
    handleDragLeave,
    getStackedItemsForWorkstation
  } = kdsStore;

  // Using SWR with optimized configuration for faster loading
  const { data: ordersData = [], error, isLoading: loading, mutate } = useSWR<Order[]>(
    user?.restaurantId ? `/api/orders?restaurantId=${encodeURIComponent(user.restaurantId)}` : null,
    fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true,
    refreshInterval: 0, // Disable polling since we're using SSE
    dedupingInterval: 1000,
    loadingTimeout: 2000,
    errorRetryCount: 2,
    errorRetryInterval: 3000,
    keepPreviousData: true
  });

  // Fetch workstations with optimized configuration
  const { data: workstationsData = [], isLoading: workstationsLoading } = useSWR<IWorkstation[]>(
    user?.restaurantId ? `/api/workstations?restaurantId=${encodeURIComponent(user.restaurantId)}` : null,
    fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true,
    refreshInterval: 0,
    dedupingInterval: 3000,
    loadingTimeout: 3000,
    errorRetryCount: 2,
    errorRetryInterval: 5000,
    keepPreviousData: true
  });

  // Update store when data changes
  useEffect(() => {
    if (Array.isArray(ordersData)) {
      setOrders(ordersData);
    }
  }, [ordersData, setOrders]);

  useEffect(() => {
    if (Array.isArray(workstationsData)) {
      setWorkstations(workstationsData);
    }
  }, [workstationsData, setWorkstations]);

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/orders/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        debugKDS('SSE message received:', data);
        if (data.type === 'orders_update') {
          mutate();
        }
      } catch (error) {
        debugKDS('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      debugKDS('SSE error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [mutate]);

  // Set the first workstation as the default tab when workstations load
  useEffect(() => {
    if (!workstationsLoading && Array.isArray(workstationsData) && workstationsData.length > 0 && activeTab === "") {
      setActiveTab(`workstation-${workstationsData[0].id || 1}`);
    } else if (!workstationsLoading && Array.isArray(workstationsData) && workstationsData.length === 0 && activeTab === "") {
      setActiveTab('workstation-1');
    }
  }, [workstationsData, workstationsLoading, activeTab, setActiveTab]);

  // Memoize workstation orders computation - simplified with explicit workstation IDs
  const workstationOrdersMemo = useMemo(() => {
    // Ensure orders is an array
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeWorkstations = Array.isArray(workstations) ? workstations : [];
    
    const wsOrders: Record<string, Order[]> = {};

    // Initialize with all workstations
    safeWorkstations.forEach((ws) => {
      const wsId = `workstation-${ws.id}`;
      wsOrders[wsId] = [];
    });

    // Distribute orders based on explicit workstation assignments
    safeOrders.forEach((order: Order) => {
      if (order.status === 'completed') {
        return;
      }

      // Group items by their workstation
      const itemsByWorkstation: Record<string, OrderItem[]> = {};

      // Sort items by position before grouping
      const sortedItems = [...order.items].sort((a, b) => {
        // Sort by position if available
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        // If position is not available, sort by creation timestamp or ID
        return a.id.localeCompare(b.id);
      });

      sortedItems.forEach((item: OrderItem) => {
        // Assign to workstation based on workstationId or default to first workstation
        const workstationId = item.workstationId || (safeWorkstations[0]?.id);
        if (!workstationId) return;

        if (!itemsByWorkstation[workstationId]) {
          itemsByWorkstation[workstationId] = [];
        }
        itemsByWorkstation[workstationId].push(item);
      });

      // Create order copies for each workstation with items
      Object.entries(itemsByWorkstation).forEach(([workstationId, items]) => {
        // Find workstation by id
        const ws = safeWorkstations.find(w => w.id === workstationId);
        if (!ws) return;

        const wsId = `workstation-${ws.id}`;
        if (!wsOrders[wsId]) wsOrders[wsId] = [];

        const orderCopy: Order = {
          ...order,
          items: items
        };

        wsOrders[wsId].push(orderCopy);
      });
    });

    // Handle case with no workstations
    if (safeWorkstations.length === 0) {
      wsOrders['workstation-1'] = safeOrders.filter((order: Order) => order.status === 'pending');
    }

    // Sort each workstation's orders by state (priority: New > In Progress > Ready > Served)
    Object.keys(wsOrders).forEach(key => {
      wsOrders[key] = wsOrders[key].sort((a: Order, b: Order) => {
        // First, check if either order is pinned (pinned orders should always come first regardless of state)
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Define state priorities
        const getStatePriority = (order: Order) => {
          // Look for the highest priority state among the order's items
          // Priority: New (1) > In Progress (2) > Ready (3) > Served (4)
          let highestPriority = 4; // Default to lowest priority (served)

          for (const item of order.items) {
            const itemStatus = item.status.toLowerCase();
            
            // Check for 'new' status (highest priority)
            if (itemStatus === 'new' || itemStatus === KDS_STATES.NEW.toLowerCase()) {
              // New status has highest priority - return immediately
              return 1;
            } 
            // Check for 'in progress' status (second priority)
            else if (itemStatus === 'in progress' || itemStatus === 'in-progress' || 
                     itemStatus === 'in_progress' || itemStatus === KDS_STATES.IN_PROGRESS.toLowerCase()) {
              // Don't return immediately as there might be 'new' items later
              highestPriority = Math.min(highestPriority, 2);
            } 
            // Check for 'ready' status (third priority)
            else if (itemStatus === 'ready' || itemStatus === KDS_STATES.READY.toLowerCase()) {
              // Ready status has third priority
              highestPriority = Math.min(highestPriority, 3);
            } 
            // Check for 'served' status (lowest priority)
            else if (itemStatus === 'served') {
              // Served status has lowest priority
              highestPriority = Math.min(highestPriority, 4);
            }
          }

          return highestPriority;
        };

        const aPriority = getStatePriority(a);
        const bPriority = getStatePriority(b);

        // If both orders have the same state priority, use secondary sorting
        if (aPriority === bPriority) {
          // Secondary sorting: by position, then by creation date
          if (a.position !== undefined && b.position !== undefined) {
            return a.position - b.position;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }

        // Sort by state priority (lower number means higher priority)
        return aPriority - bPriority;
      });
    });

    debugKDS('workstationOrders computed:', wsOrders);
    return wsOrders;
  }, [orders, workstations]);

  const renderOrderList = (orderList: Order[], workstationIndex: number) => {
    // Ensure orderList is an array
    const safeOrderList = Array.isArray(orderList) ? orderList : [];
    
    if (loading) {
      return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><p>{t('kds.loading')}</p></div>
    }
    if (safeOrderList.length === 0) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
          <p>{t('kds.no_orders')}</p>
        </div>
      );
    }
    const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-1 items-start" onDragOver={handleContainerDragOver}>
        {safeOrderList.map((order) => {
          // Get the workstation ID for this index
          const workstation = workstations[workstationIndex];
          const workstationId = workstation?.id || 'default';
          
          // Get stacked items for this workstation
          const stackedItems = getStackedItemsForWorkstation(order.id, workstationId);
          
          return (
            <OrderCard
              key={`${order.id}-${workstationIndex}`}
              order={order}
              items={stackedItems} // Pass stacked items instead of individual items
              onUpdateItemStatus={updateItemStatus}
              onRevertItemStatus={revertItemStatus}
              onDragStart={(e) => handleDragStart(e, order.id)}
              onDrop={(e) => handleDrop(e, order.id)}
              onDragEnter={(e) => handleDragEnter(e, order.id)}
              onDragLeave={(e) => handleDragLeave(e, order.id)}
              onDragEnd={handleDragEnd}
              isDraggingOver={dragOverOrderId === order.id}
              onTogglePin={togglePinOrder}
              workstationIndex={workstationIndex}
              totalWorkstations={workstations.length}
              workstationName={workstations[workstationIndex]?.name}
              isLastWorkstation={workstationIndex === workstations.length - 1}
            />
          );
        })}
      </div>
    );
  };

  // Render workstations dynamically
  const renderWorkstations = () => {
    if (activeTab === "" && workstationsLoading) {
      return (
        <div key="loading-card">
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <p>{t('kds.loading')}</p>
          </div>
        </div>
      );
    }

    if (activeTab === "" && !workstationsLoading && workstations.length === 0) {
      return (
        <div key="empty-card">
          <Tabs value="workstation-1" onValueChange={setActiveTab} className="p-4 sm:p-6">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(1, minmax(0, 1fr))` }}>
              <TabsTrigger value="workstation-1" key="workstation-1">
                {t('kds.tabs.kitchen')} (0)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="workstation-1" key="content-workstation-1" className="pt-4 sm:p-6">
              {renderOrderList([], 0)}
            </TabsContent>
          </Tabs>
        </div>
      );
    }

    // Dynamic rendering for all workstation counts
    return (
      <div key="workstations-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-2 sm:p-3 sm:px-0">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.max(workstations.length, 1)}, minmax(0, 1fr))` }}>
            {workstations.map((ws, index) => {
              const wsId = `workstation-${ws.id}`;
              // Count orders for this workstation (using stacked items)
              const workstationOrders = workstationOrdersMemo[wsId] || [];
              let orderCount = 0;
              workstationOrders.forEach(order => {
                const stackedItems = getStackedItemsForWorkstation(order.id, ws.id);
                orderCount += stackedItems.length > 0 ? 1 : 0;
              });

              return (
                <TabsTrigger key={`trigger-${ws.id}`} value={wsId}>
                  {ws.name} ({orderCount})
                </TabsTrigger>
              );
            })}
            {workstations.length === 0 && (
              <TabsTrigger value="workstation-1" key="workstation-1-empty">
                {t('kds.tabs.kitchen')} ({workstationOrdersMemo['workstation-1']?.length || 0})
              </TabsTrigger>
            )}
          </TabsList>
          {workstations.map((ws, index) => {
            const wsId = `workstation-${ws.id}`;
            return (
              <TabsContent key={`content-${ws.id}`} value={wsId} className="pt-2 sm:p-3 sm:px-0">
                {renderOrderList(workstationOrdersMemo[wsId] || [], index)}
              </TabsContent>
            );
          })}
          {workstations.length === 0 && (
            <TabsContent value="workstation-1" key="content-workstation-1-empty" className="pt-2 sm:p-3 sm:px-0">
              {renderOrderList(workstationOrdersMemo['workstation-1'] || [], 0)}
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  };

  // Access guard — shown if user lacks kds_access permission
  if (!can('kds_access')) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
        <p>{t('kds.access_denied') || 'You do not have permission to access the Kitchen Display.'}</p>
      </div>
    );
  }

  return renderWorkstations();
}