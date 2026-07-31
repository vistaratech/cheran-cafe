"use client"
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type OrderItem, type OrderType, type DeliveryInfo } from '@/lib/types'
import { useI18nStore } from '@/lib/stores/i18n-store'
import { useCurrentOrderStoreCompat as useCurrentOrderStore, useCurrentOrderTotalsCompat as useCurrentOrderTotals } from '@/lib/stores/current-order-store'
import { MinusCircle, Package, PersonStanding, PlusCircle, Send, StickyNote, CreditCard, Utensils } from 'lucide-react'
import { RupeeSymbol } from '@/components/ui/rupee-symbol'

// Define the type for our current order object
interface CurrentOrderType {
  items: OrderItem[];
  table: number;
  setTable: (value: number | ((prev: number) => number)) => void;
  notes: string;
  setNotes: (value: string | ((prev: string) => string)) => void;
  orderType: OrderType;
  setOrderType: (value: OrderType | ((prev: OrderType) => OrderType)) => void;
  deliveryInfo: DeliveryInfo;
  setDeliveryInfo: (value: DeliveryInfo | ((prev: DeliveryInfo) => DeliveryInfo)) => void;
  addItem: (itemToAdd: any, quantity: number, selectedExtras: any[], notes?: string) => void;
  updateItem: (itemId: string, newQuantity: number, newSelectedExtras: any[], notes?: string) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
  updateItemQuantity: (itemId: string, adjustment: number) => void;
  subtotal: number;
  tax: number;
  total: number;

}

interface CurrentOrderProps {
  order: CurrentOrderType;
  onSendToKitchen: () => void;
  onPayment: () => void;
  onEditItem: (item: OrderItem) => void;
}

export function CurrentOrder({ order, onSendToKitchen, onPayment, onEditItem }: CurrentOrderProps) {
  const { t } = useI18nStore();
  const { 
    items, subtotal, tax, total, clearOrder, 
    table, setTable, notes, setNotes,
    orderType, setOrderType, deliveryInfo, setDeliveryInfo,
    updateItemQuantity
  } = order;
  
  const isDeliveryInfoComplete = !!(deliveryInfo.name && deliveryInfo.address && deliveryInfo.phone);
  const canSendToKitchen = items.length > 0 && (orderType === 'dine-in' || isDeliveryInfoComplete);
  const canMakePayment = items.length > 0;
  
  const handleQuantityChange = (itemId: string, adjustment: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateItemQuantity(itemId, adjustment);
  }

  return (
    <Card className="h-full flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-amber-900/15 shadow-xl overflow-hidden">
      <CardHeader className="p-4 border-b border-amber-900/10 bg-gradient-to-r from-amber-900/5 to-transparent">
        <CardTitle className="font-headline text-lg font-bold text-[#362217] flex items-center justify-between">
          <span>{t('pos.current_order.title')}</span>
          {items.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground bg-amber-900/10 px-2.5 py-1 rounded-full text-[#593722]">
              {items.length} {items.length === 1 ? t('pos.current_order.item') : t('pos.current_order.items')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-4 space-y-3">
        <ScrollArea className="flex-grow pr-1">
          <div className="flex-shrink-0 space-y-3">
            <Tabs value={orderType} onValueChange={(value) => setOrderType(value as OrderType)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-amber-900/5 p-1 rounded-xl border border-amber-900/10">
                <TabsTrigger 
                  value="dine-in" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#593722] data-[state=active]:shadow-sm font-medium transition-all"
                >
                  <PersonStanding className="mr-2 h-4 w-4 text-[#593722]"/>
                  {t('pos.order_type.dine_in')}
                </TabsTrigger>
                <TabsTrigger 
                  value="delivery" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#593722] data-[state=active]:shadow-sm font-medium transition-all"
                >
                  <Package className="mr-2 h-4 w-4 text-[#593722]"/>
                  {t('pos.order_type.delivery')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dine-in" className="mt-2 pt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="table-select-panel" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('pos.current_order.table')}
                  </Label>
                  <Select value={String(table)} onValueChange={(value) => setTable(Number(value))} name="table-select">
                    <SelectTrigger id="table-select-panel" className="rounded-xl border-amber-900/15 bg-white shadow-xs focus:ring-amber-900/20">
                      <SelectValue placeholder={t('pos.current_order.select_table')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-amber-900/15">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(tableNum => (
                        <SelectItem key={tableNum} value={String(tableNum)} className="rounded-lg">
                          {t('pos.current_order.table')} {tableNum}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="delivery" className="mt-2 pt-0 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="customer-name-panel" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('pos.delivery.name')}
                  </Label>
                  <Input id="customer-name-panel" value={deliveryInfo.name} onChange={(e) => setDeliveryInfo(d => ({...d, name: e.target.value}))} className="rounded-xl border-amber-900/15 bg-white h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customer-address-panel" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('pos.delivery.address')}
                  </Label>
                  <Input id="customer-address-panel" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo(d => ({...d, address: e.target.value}))} className="rounded-xl border-amber-900/15 bg-white h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customer-phone-panel" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('pos.delivery.phone')}
                  </Label>
                  <Input id="customer-phone-panel" type="tel" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo(d => ({...d, phone: e.target.value}))} className="rounded-xl border-amber-900/15 bg-white h-9" />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-1.5">
              <Label htmlFor="order-notes-panel" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('pos.current_order.order_notes')}
              </Label>
              <Textarea 
                id="order-notes-panel"
                placeholder={t('pos.current_order.order_notes_placeholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl border-amber-900/15 bg-white resize-none text-xs h-16 focus:ring-amber-900/20"
              />
            </div>
          
            <Separator className="my-2 bg-amber-900/10" />

            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6 rounded-2xl bg-amber-900/[0.02] border border-dashed border-amber-900/15">
                  <div className="p-3 rounded-full bg-amber-900/5 mb-3 text-[#593722]">
                    <Utensils className="w-8 h-8 opacity-60" />
                  </div>
                  <p className="font-semibold text-sm text-[#362217]">{t('pos.current_order.no_items')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('pos.current_order.select_items')}</p>
                </div>
              ) : (
                items.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => onEditItem(item)} 
                    className="p-2.5 rounded-xl bg-amber-900/[0.03] border border-amber-900/10 hover:border-[#C5A059]/40 hover:bg-amber-900/[0.06] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center bg-white rounded-lg border border-amber-900/10 p-0.5 shadow-xs flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-amber-900/10 text-muted-foreground hover:text-[#593722]" onClick={(e) => handleQuantityChange(item.id, -1, e)}>
                          <MinusCircle className="h-3.5 w-3.5"/>
                        </Button>
                        <span className="font-bold text-sm w-5 text-center text-[#362217]">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-amber-900/10 text-muted-foreground hover:text-[#593722]" onClick={(e) => handleQuantityChange(item.id, 1, e)}>
                          <PlusCircle className="h-3.5 w-3.5"/>
                        </Button>
                      </div>
                      <div className="flex-grow min-w-0 px-1">
                        <p className="font-bold text-sm leading-tight text-[#362217] group-hover:text-[#593722] transition-colors">{item.menuItem.name}</p>
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {item.selectedExtras.map(extra => (
                              <div key={extra.id} className="flex items-center text-[11px]">+ {extra.name} (<RupeeSymbol className="h-2.5 w-2.5 mx-0.5 inline-block" />{extra.price.toFixed(2)})</div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="mt-0.5 text-xs text-muted-foreground flex items-start gap-1">
                            <StickyNote className="w-3 h-3 mt-0.5 text-[#593722]/80 flex-shrink-0"/>
                            <p className="italic text-[11px] truncate">{item.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-[#593722] flex items-center bg-amber-900/5 px-2 py-0.5 rounded-lg border border-amber-900/10">
                        <RupeeSymbol className="h-3 w-3 mr-0.5 inline-block" />
                        {((item.menuItem.price + (item.selectedExtras?.reduce((acc, e) => acc + e.price, 0) || 0)) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="flex-col p-4 border-t border-amber-900/10 bg-card space-y-3">
          <div className="w-full p-3 rounded-xl bg-gradient-to-br from-amber-900/5 to-amber-900/[0.02] border border-amber-900/10 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>{t('pos.current_order.subtotal')}</span>
              <span className="font-semibold text-[#362217] flex items-center">
                <RupeeSymbol className="h-3 w-3 mr-0.5 inline-block" />
                {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>{t('pos.current_order.tax')}</span>
              <span className="font-semibold text-[#362217] flex items-center">
                <RupeeSymbol className="h-3 w-3 mr-0.5 inline-block" />
                {tax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base text-[#593722] pt-1.5 border-t border-amber-900/10">
              <span>{t('pos.current_order.total')}</span>
              <span className="flex items-center text-lg">
                <RupeeSymbol className="h-4 w-4 mr-0.5 inline-block" />
                {total.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="w-full grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearOrder} className="rounded-xl border-amber-900/20 hover:bg-amber-900/5 text-muted-foreground text-xs font-semibold py-2">{t('pos.current_order.clear_order')}</Button>
            <Button className="gold-gradient hover:opacity-95 text-white font-semibold shadow-md rounded-xl text-xs py-2 border-0" onClick={onPayment} disabled={!canMakePayment}>
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              {t('pos.current_order.payment')}
            </Button>
          </div>
          <Button className="w-full bg-[#593722] hover:bg-[#4a2e1c] text-white font-bold shadow-lg rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]" onClick={onSendToKitchen} disabled={!canSendToKitchen}>
            <Send className="h-4 w-4"/>
            {t('pos.current_order.send_to_kitchen')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}