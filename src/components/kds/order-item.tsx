"use client";

import { type Order, type OrderItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import useKDSStore from '@/lib/stores/kds-store';
import { RotateCcw, CircleAlert, ChefHat, CircleCheckBig } from "lucide-react";
import { KDS_STATES } from "@/lib/constants";
import { debugKDS } from "@/lib/helpers";

interface OrderItemProps {
  item: OrderItem & { stackCount?: number; isStacked?: boolean };
  orderId: number;
  currentTab: 'kitchen' | 'serving';
  onUpdateItemStatus: (orderId: number, itemId: string, fromStatus: string) => void;
  onRevertItemStatus: (orderId: number, itemId: string, toStatus: string) => void;
  workstationIndex: number;
  totalWorkstations: number;
  workstationName?: string;
  isLastWorkstation?: boolean;
}

const statusColors: Record<string, string> = {
  [KDS_STATES.NEW]: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-800',
  [KDS_STATES.IN_PROGRESS]: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-800',
  [KDS_STATES.READY]: 'bg-green-500/10 text-green-800 hover:bg-green-500/20',
  'served': 'bg-gray-500/10 text-gray-800',
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case KDS_STATES.NEW: return <CircleAlert className="h-4 w-4" />;
    case KDS_STATES.IN_PROGRESS: return <ChefHat className="h-4 w-4" />;
    case KDS_STATES.READY: return <CircleCheckBig className="h-4 w-4" />;
    default: return null;
  }
};

export function OrderItem({ item, orderId, currentTab, onUpdateItemStatus, onRevertItemStatus, workstationIndex, totalWorkstations, workstationName, isLastWorkstation }: OrderItemProps) {
  debugKDS('OrderItem rendered:', { 
    orderId, 
    itemId: item.id,
    itemName: item.menuItem.name,
    status: item.status,
    workstationId: item.workstationId,
    workstationIndex,
    totalWorkstations,
    workstationName,
    isStacked: item.isStacked,
    stackCount: item.stackCount
  });

  const ItemInfo = () => (
    <div className="flex-1 min-w-0">
      {/* Number and icon in a column, item name centered vertically */}
      <div className="flex items-center gap-1.5">
        <div className="text-center" style={{ minWidth: '2rem' }}>
          <div className="font-bold text-xl leading-tight">
            {item.isStacked ? (
              // Show stack count for stacked items
              <span className="text-blue-600">{item.stackCount}×</span>
            ) : (
              // Show individual quantity
              <>{item.quantity}x</>
            )}
          </div>
          <div className="mt-1 flex justify-center">
            {/* Status icon removed from here as it's now shown in the button group */}
          </div>
        </div>
        <span className="font-semibold text-xl whitespace-normal break-words leading-tight">
          {item.menuItem.name}
        </span>
      </div>
      {item.selectedExtras && item.selectedExtras.length > 0 && (
        <div className="pl-8 text-sm text-muted-foreground font-medium">
          {item.selectedExtras.map(extra => (
            <div key={extra.id}>+ {extra.name}</div>
          ))}
        </div>
      )}
      {item.notes && (
        <p className="pl-8 text-sm text-primary/80 font-medium italic whitespace-pre-wrap">Notes: {item.notes}</p>
      )}
    </div>
  );

  const StatusRow = ({
    status,
    displayStatus,
    onClick,
    onRevert,
  }: {
    status: string,
    displayStatus?: string,
    onClick?: () => void,
    onRevert?: () => void,
  }) => {
    const canRevert = !!onRevert;
    const label = displayStatus || status;
    
    // Add visual indicator for stacked items
    const isStackedItem = item.isStacked && item.stackCount && item.stackCount > 1;
    
    return (
      <div
        className={cn(
          "p-0.5 rounded-md transition-all group h-full",
          statusColors[status] || 'bg-muted',
          onClick && "cursor-pointer",
          isStackedItem && "border-l-4 border-blue-400"
        )}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <div className="flex justify-between items-center gap-2 h-full">
          <ItemInfo />
          <div className="flex items-center gap-1">
            {/* Rollback button on the right */}
            {canRevert && (
              <button
                onClick={(e) => { e.stopPropagation(); onRevert(); }}
                className="p-1 -m-1 rounded-full hover:bg-black/10"
                aria-label={`Revert status`}
              >
                <RotateCcw className={cn("h-4 w-4", {
                  "text-yellow-700": status === KDS_STATES.IN_PROGRESS,
                  "text-green-700": status === KDS_STATES.READY,
                  "text-gray-700": status === 'served',
                })} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get current state index
  const getCurrentStateIndex = (status: string | undefined): number => {
    if (!status) return 0; // Default to New

    // Normalize the status for comparison
    const normalizedStatus = status.toString().toLowerCase();
    const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
    const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
    const kdsReady = KDS_STATES.READY?.toString().toLowerCase();

    if (normalizedStatus === kdsNew || normalizedStatus === 'new') return 0;
    if (normalizedStatus === kdsInProgress || normalizedStatus === 'in-progress') return 1;
    if (normalizedStatus === kdsReady || normalizedStatus === 'ready') return 2;

    return 0; // Default to New
  };

  const currentStateIndex = getCurrentStateIndex(item.status);
  
  // Special handling for items in the Ready workstation
  const isInReadyWorkstation = isLastWorkstation;

  // Switch case for rendering based on current state
  switch (currentStateIndex) {
    case 0: // New state
      // In Ready workstation, items should not be in New state
      if (isInReadyWorkstation) {
        return (
          <div className="space-y-0.5">
            <StatusRow
              status={KDS_STATES.READY}
              displayStatus="Ready"
              onRevert={() => {
                debugKDS('READY item reverted:', { orderId, itemId: item.id, toStatus: KDS_STATES.IN_PROGRESS });
                onRevertItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS);
              }}
            />
          </div>
        );
      }
      
      // Check if we can rollback (i.e., if there's a previous workstation)
      const { getPreviousWorkstation } = useKDSStore.getState();
      const canRollback = item.workstationId && getPreviousWorkstation(item.workstationId);
      
      return (
        <div className="space-y-0.5">
          <StatusRow
            status={KDS_STATES.NEW}
            onClick={() => {
              debugKDS('NEW item clicked:', { orderId, itemId: item.id, status: KDS_STATES.NEW });
              onUpdateItemStatus(orderId, item.id, KDS_STATES.NEW);
            }}
            onRevert={canRollback ? () => {
              debugKDS('NEW item reverted:', { orderId, itemId: item.id, toStatus: KDS_STATES.IN_PROGRESS });
              onRevertItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS);
            } : undefined}
          />
        </div>
      );
    
    case 1: // In Progress state
      // In Ready workstation, items should not be in In Progress state
      if (isInReadyWorkstation) {
        return (
          <div className="space-y-0.5">
            <StatusRow
              status={KDS_STATES.READY}
              displayStatus="Ready"
              onRevert={() => {
                debugKDS('READY item reverted:', { orderId, itemId: item.id, toStatus: KDS_STATES.IN_PROGRESS });
                onRevertItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS);
              }}
            />
          </div>
        );
      }
      
      return (
        <div className="space-y-0.5">
          <StatusRow
            status={KDS_STATES.IN_PROGRESS}
            onClick={() => {
              debugKDS('IN_PROGRESS item clicked:', { orderId, itemId: item.id, status: KDS_STATES.IN_PROGRESS });
              // When clicking on In Progress, advance to next workstation with New status
              onUpdateItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS);
            }}
            onRevert={() => {
              debugKDS('IN_PROGRESS item reverted:', { orderId, itemId: item.id, toStatus: KDS_STATES.NEW });
              onRevertItemStatus(orderId, item.id, KDS_STATES.NEW);
            }}
          />
        </div>
      );
    
    case 2: // Ready state
      // Only show Ready status in the last workstation
      if (isInReadyWorkstation) {
        return (
          <div className="space-y-0.5">
            <StatusRow
              status={KDS_STATES.READY}
              displayStatus="Ready"
              onClick={() => {
                // Only allow advancing to next workstation if not in the Ready workstation
                if (!isInReadyWorkstation) {
                  debugKDS('READY item clicked:', { orderId, itemId: item.id, status: KDS_STATES.READY });
                  // When a ready item is clicked, we want to move it to the next workstation
                  // So we pass 'Ready' as the fromStatus to trigger the moveToNextWorkstation logic
                  onUpdateItemStatus(orderId, item.id, KDS_STATES.READY);
                }
              }}
              onRevert={() => {
                debugKDS('READY item reverted:', { orderId, itemId: item.id, toStatus: KDS_STATES.IN_PROGRESS });
                onRevertItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS);
              }}
            />
          </div>
        );
      } else {
        // If somehow an item has Ready status in a non-last workstation,
        // show it as New with rollback functionality to previous workstation
        const { getPreviousWorkstation } = useKDSStore.getState();
        const canRollback = item.workstationId && getPreviousWorkstation(item.workstationId);
        
        return (
          <div className="space-y-0.5">
            <StatusRow
              status={KDS_STATES.NEW}
              onClick={() => {
                debugKDS('NEW item clicked:', { orderId, itemId: item.id, status: KDS_STATES.NEW });
                onUpdateItemStatus(orderId, item.id, KDS_STATES.NEW);
              }}
              onRevert={canRollback ? () => {
                debugKDS('NEW item reverted:', { orderId, itemId: item.id, toStatus: KDS_STATES.IN_PROGRESS });
                onRevertItemStatus(orderId, item.id, KDS_STATES.IN_PROGRESS);
              } : undefined}
            />
          </div>
        );
      }
    
    default:
      return (
        <div className="space-y-0.5">
          <StatusRow
            status={KDS_STATES.NEW}
            onClick={() => {
              debugKDS('DEFAULT item clicked:', { orderId, itemId: item.id, status: KDS_STATES.NEW });
              onUpdateItemStatus(orderId, item.id, KDS_STATES.NEW);
            }}
          />
        </div>
      );
  }
}