"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { type Order, type OrderItem } from "@/lib/types"
import { useI18nStore } from "@/lib/stores/i18n-store"
import { format } from "date-fns"
import { getItemTotal, getOrderTotal } from "@/lib/helpers"
import { Package, PersonStanding } from "lucide-react"

interface OrderDetailsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onViewReceipt: (order: Order) => void
}

const getStatusVariant = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'secondary'
    case 'completed': return 'default'
    default: return 'outline'
  }
}

export function OrderDetailsDialog({ isOpen, onOpenChange, order, onViewReceipt }: OrderDetailsDialogProps) {
  const { t } = useI18nStore()

  if (!order) return null

  const handleViewReceiptClick = () => {
    onOpenChange(false);
    onViewReceipt(order);
  }

  const renderItem = (item: OrderItem) => (
    <div key={item.id} className="py-2">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <p className="font-semibold">{item.quantity}x {item.menuItem.name}</p>
                {item.selectedExtras && item.selectedExtras.length > 0 && (
                    <div className="pl-4 text-sm text-muted-foreground">
                        {item.selectedExtras.map(extra => <div key={extra.id}>+ {extra.name}</div>)}
                    </div>
                )}
                 {item.notes && (
                    <p className="pl-4 text-sm text-primary/80 italic">Notes: {item.notes}</p>
                )}
            </div>
            <p className="font-medium">${getItemTotal(item).toFixed(2)}</p>
        </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{t('orders.details.title')} #{order.id}</DialogTitle>
          <DialogDescription>{t('orders.details.description')}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-semibold">{t('orders.table.date')}</p>
                        <p className="text-muted-foreground">{format(new Date(order.createdAt), 'PPp')}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t('orders.table.status')}</p>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{t(`orders.status.${order.status}`)}</Badge>
                    </div>
                    <div>
                        <p className="font-semibold">{t('orders.table.staff')}</p>
                        <p className="text-muted-foreground">{order.staffName || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{order.orderType === 'dine-in' ? t('pos.current_order.table') : t('pos.order_type.delivery')}</p>
                        <p className="text-muted-foreground flex items-center gap-2">
                            {order.orderType === 'dine-in' ? <PersonStanding/> : <Package/>}
                            {order.orderType === 'dine-in' ? `${t('pos.current_order.table')} ${order.table}` : t('pos.order_type.delivery')}
                        </p>
                    </div>
                </div>

                {order.orderType === 'delivery' && order.deliveryInfo && (
                    <div>
                         <h4 className="font-semibold mb-2">{t('orders.details.delivery_info')}</h4>
                         <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                            <p><strong>{t('pos.delivery.name')}:</strong> {order.deliveryInfo.name}</p>
                            <p><strong>{t('pos.delivery.address')}:</strong> {order.deliveryInfo.address}</p>
                            <p><strong>{t('pos.delivery.phone')}:</strong> {order.deliveryInfo.phone}</p>
                         </div>
                    </div>
                )}

                <Separator />
                
                <div>
                    <h4 className="font-semibold mb-1">{t('orders.details.items')}</h4>
                    <div className="divide-y max-w-md mx-auto">
                        {order.items.map(renderItem)}
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('pos.current_order.subtotal')}</span>
                        <span>${(getOrderTotal(order) / 1.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('pos.current_order.tax')}</span>
                        <span>${(getOrderTotal(order) - (getOrderTotal(order) / 1.08)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                        <span>{t('pos.current_order.total')}</span>
                        <span>${getOrderTotal(order).toFixed(2)}</span>
                    </div>
                </div>

                {order.statusHistory && order.statusHistory.length > 0 && (
                    <div>
                        <Separator />
                        <h4 className="font-semibold my-2">{t('orders.details.status_history')}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {order.statusHistory.map((status, index) => (
                                <li key={index} className="flex justify-between">
                                    <span className="capitalize">{status.status}</span>
                                    <span>{format(new Date(status.timestamp), 'Pp')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>
        </div>
        
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.close')}</Button>
          {order.status === 'completed' && (
             <Button onClick={handleViewReceiptClick}>{t('orders.details.view_receipt')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}