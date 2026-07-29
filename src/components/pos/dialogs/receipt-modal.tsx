
"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { type Order, type OrderItem } from "@/lib/types"
import { useI18nStore } from "@/lib/stores/i18n-store"
import { format } from "date-fns"
import { getItemTotal, getOrderTotal } from "@/lib/helpers"
import { Download, Printer } from "lucide-react"
import { CheranLogo } from "@/components/ui/cheran-logo"
import { toast } from "sonner"

interface ReceiptDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

export function ReceiptDialog({ isOpen, onOpenChange, order }: ReceiptDialogProps) {
  const { t } = useI18nStore()

  if (!order) return null

  const handlePrint = () => {
    toast.info(t('orders.receipt.print_toast_title'), {
      description: t('orders.receipt.print_toast_desc'),
      duration: 3000,
    });
  }
  
  const handleDownload = () => {
     toast.info(t('orders.receipt.download_toast_title'), {
      description: t('orders.receipt.download_toast_desc'),
      duration: 3000,
    });
  }

  const renderItem = (item: OrderItem) => (
    <div key={item.id} className="flex justify-between items-start text-sm py-1">
        <div className="flex-1">
            <p>{item.quantity}x {item.menuItem.name}</p>
            {item.selectedExtras && item.selectedExtras.length > 0 && (
                <div className="pl-4 text-xs text-muted-foreground">
                    {item.selectedExtras.map(extra => <div key={extra.id}>+ {extra.name}</div>)}
                </div>
            )}
        </div>
        <p>₹{getItemTotal(item).toFixed(2)}</p>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm flex flex-col max-h-[90vh]">
        <DialogHeader className="text-center items-center pt-6">
            <CheranLogo size={48} className="mb-2"/>
            <DialogTitle className="font-headline text-2xl text-[#603B26]">Cheran Cafe</DialogTitle>
            <p className="text-sm text-muted-foreground">{t('orders.receipt.thank_you')}</p>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 font-mono text-xs">
            <ScrollArea className="h-full -mx-6">
                <div className="px-6 space-y-3">
                    <div className="text-center text-muted-foreground">
                        <p>#{order.id}</p>
                        <p>{format(new Date(order.createdAt), 'PPp')}</p>
                    </div>

                    <Separator className="border-dashed"/>

                    <div className="space-y-1">
                        {order.items.map(renderItem)}
                    </div>
                    
                    <Separator className="border-dashed"/>

                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>{t('pos.current_order.subtotal')}</span>
                            <span>₹{(getOrderTotal(order) / 1.08).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{t('pos.current_order.tax')}</span>
                            <span>₹{(getOrderTotal(order) - (getOrderTotal(order) / 1.08)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t pt-1 mt-1 border-dashed">
                            <span>{t('pos.current_order.total')}</span>
                            <span>₹{getOrderTotal(order).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
        
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> {t('orders.receipt.download')}
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> {t('orders.receipt.print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
