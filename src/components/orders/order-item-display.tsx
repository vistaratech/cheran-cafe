"use client";

import { type OrderItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RotateCcw, Clock, CookingPot, Check } from "lucide-react";
import { KDS_STATES } from "@/lib/constants";

interface OrderItemDisplayProps {
    item: OrderItem;
    orderId?: number;
    currentTab?: 'kitchen' | 'serving';
    onUpdateItemStatus?: (orderId: number, itemId: string, fromStatus: string) => void;
    onRevertItemStatus?: (orderId: number, itemId: string, toStatus: string) => void;
    compact?: boolean;
}

const statusColors: Record<string, string> = {
  [KDS_STATES.NEW]: 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-800',
  [KDS_STATES.IN_PROGRESS]: 'bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-800',
  [KDS_STATES.READY]: 'bg-green-500/15 text-green-800 hover:bg-green-500/25',
  'Served': 'bg-gray-500/15 text-gray-800 hover:bg-gray-500/25',
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case KDS_STATES.NEW: return <Clock className="h-4 w-4" />;
    case KDS_STATES.IN_PROGRESS: return <CookingPot className="h-4 w-4" />;
    case KDS_STATES.READY: return <Check className="h-4 w-4" />;
    default: return null;
  }
};

export function OrderItemDisplay({ item, orderId, currentTab, onUpdateItemStatus, onRevertItemStatus, compact = false }: OrderItemDisplayProps) {

  const ItemInfo = ({ count }: { count: number }) => (
    <div className="flex-1 min-w-0 w-full" data-testid="order-item">
      {/* Number and icon in a column, item name centered vertically */}
      <div className="flex items-center gap-2">
        <div className={cn("text-center", {
          "min-w-[2rem]": !compact,
          "min-w-[1.5rem]": compact
        })}>
          <div className={cn("font-bold leading-tight", {
            "text-xl": !compact,
            "text-lg": compact
          })}>
            {count}x
          </div>
          <div className="mt-1 flex justify-center">
            {getStatusIcon(item.status)}
          </div>
        </div>
        <span className={cn("font-bold whitespace-normal break-words leading-tight", {
          "text-xl": !compact,
          "text-lg": compact
        })}>
          {item.menuItem.name}
        </span>
      </div>
      {item.selectedExtras && item.selectedExtras.length > 0 && (
        <div className={cn("text-muted-foreground font-bold", {
          "pl-8 text-lg": !compact,
          "pl-7 text-base": compact
        })}>
          {item.selectedExtras.map(extra => (
            <div key={extra.id}>+ {extra.name}</div>
          ))}
        </div>
      )}
      {item.notes && (
          <p className={cn("font-bold italic whitespace-pre-wrap", {
            "pl-8 text-lg text-primary": !compact,
            "pl-7 text-base text-primary": compact
          })}>
            Notes: {item.notes}
          </p>
      )}
    </div>
  );

  const StatusRow = ({ 
      status, 
      onClick, 
      onRevert, 
    }: {
      status: string,
      onClick?: () => void,
      onRevert?: () => void,
  }) => {
    const canRevert = !!onRevert;
    
    return (
      <div 
        className={cn(
            "w-full p-1 rounded-md transition-all group", 
            statusColors[status] || 'bg-muted',
            onClick && "cursor-pointer"
        )}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <div className="flex justify-between items-center gap-2">
            <ItemInfo count={item.quantity} />
            <div className="flex items-center gap-2">
              {/* Removed text label */}
              <div className="font-bold text-xs uppercase w-16 text-center shrink-0"></div>
              {canRevert && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRevert(); }}
                    className="p-1 -m-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Revert status`}
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 w-full">
      {currentTab === 'kitchen' && item.status === KDS_STATES.NEW && (
        <StatusRow 
            status={KDS_STATES.NEW}
            onClick={() => onUpdateItemStatus?.(orderId!, item.id, KDS_STATES.NEW)}
        />
      )}
      {currentTab === 'kitchen' && item.status === KDS_STATES.IN_PROGRESS && (
        <StatusRow 
            status={KDS_STATES.IN_PROGRESS}
            onClick={() => onUpdateItemStatus?.(orderId!, item.id, KDS_STATES.IN_PROGRESS)}
            onRevert={() => onRevertItemStatus?.(orderId!, item.id, KDS_STATES.NEW)}
        />
      )}
      {currentTab === 'serving' && item.status === KDS_STATES.READY && (
        <StatusRow 
            status={KDS_STATES.READY}
            onClick={() => onUpdateItemStatus?.(orderId!, item.id, KDS_STATES.READY)}
            onRevert={() => onRevertItemStatus?.(orderId!, item.id, KDS_STATES.IN_PROGRESS)}
        />
      )}
      {item.status === 'served' && (
        <StatusRow 
            status="Served"
            onRevert={() => onRevertItemStatus?.(orderId!, item.id, KDS_STATES.READY)}
        />
      )}
    </div>
  )
}