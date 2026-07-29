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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">{t('pos.current_order.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-grow pr-4 -mr-4">
          <div className='flex-shrink-0 pr-4 space-y-4'>
            <Tabs value={orderType} onValueChange={(value) => setOrderType(value as OrderType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="dine-in">
                        <PersonStanding className="mr-2 h-4 w-4"/>
                        {t('pos.order_type.dine_in')}
                    </TabsTrigger>
                    <TabsTrigger value="delivery">
                        <Package className="mr-2 h-4 w-4"/>
                        {t('pos.order_type.delivery')}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="dine-in" className="pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="table-select">{t('pos.current_order.table')}</Label>
                        <Select value={String(table)} onValueChange={(value) => setTable(Number(value))} name="table-select">
                            <SelectTrigger id="table-select">
                                <SelectValue placeholder={t('pos.current_order.select_table')} />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 20 }, (_, i) => i + 1).map(tableNum => (
                                <SelectItem key={tableNum} value={String(tableNum)}>
                                    {t('pos.current_order.table')} {tableNum}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </TabsContent>
                <TabsContent value="delivery" className="pt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer-name">{t('pos.delivery.name')}</Label>
                            <Input id="customer-name" value={deliveryInfo.name} onChange={(e) => setDeliveryInfo(d => ({...d, name: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-address">{t('pos.delivery.address')}</Label>
                            <Input id="customer-address" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo(d => ({...d, address: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-phone">{t('pos.delivery.phone')}</Label>
                            <Input id="customer-phone" type="tel" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo(d => ({...d, phone: e.target.value}))} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            
            <div className="mt-2">
                <Label htmlFor="order-notes">{t('pos.current_order.order_notes')}</Label>
                <Textarea 
                    id="order-notes"
                    placeholder={t('pos.current_order.order_notes_placeholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                />
            </div>
          
            <Separator className="my-4" />

            <div className="space-y-2 pr-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                  <Utensils className="w-12 h-12 mb-4" />
                  <p className="font-semibold">{t('pos.current_order.no_items')}</p>
                  <p className="text-sm">{t('pos.current_order.select_items')}</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} onClick={() => onEditItem(item)} className="p-2 -mx-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-start gap-3">
                       <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleQuantityChange(item.id, -1, e)}>
                          <MinusCircle className="h-3.5 w-3.5"/>
                        </Button>
                        <span className="font-bold text-base w-5 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleQuantityChange(item.id, 1, e)}>
                          <PlusCircle className="h-3.5 w-3.5"/>
                        </Button>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-sm leading-tight">{item.menuItem.name}</p>
                         {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                              {item.selectedExtras.map(extra => (
                              <div key={extra.id} className="flex items-center">+ {extra.name} (<RupeeSymbol className="h-3 w-3 mr-0.5 inline-block" />{extra.price.toFixed(2)})</div>
                              ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="mt-0.5 text-xs text-muted-foreground flex items-start gap-1.5">
                            <StickyNote className="w-3 h-3 mt-0.5 text-primary/80 flex-shrink-0"/>
                            <p className="italic truncate">{item.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-semibold flex items-center">
                        <RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block" />
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
        <CardFooter className="flex-col !p-4 border-t bg-card">
          <div className="w-full space-y-1.5 text-sm py-2">
            <div className="flex justify-between text-muted-foreground">
              <span>{t('pos.current_order.subtotal')}</span>
              <span className="font-medium text-[#362217] flex items-center">
                <RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block" />
                {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t('pos.current_order.tax')}</span>
              <span className="font-medium text-[#362217] flex items-center">
                <RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block" />
                {tax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg text-[#593722] pt-1 border-t border-amber-900/10">
              <span>{t('pos.current_order.total')}</span>
              <span className="flex items-center">
                <RupeeSymbol className="h-4 w-4 mr-0.5 inline-block" />
                {total.toFixed(2)}
              </span>
            </div>
          </div>
          <Separator className="my-2 bg-amber-900/10" />
          <div className="w-full grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearOrder} className="rounded-xl border-amber-900/20 hover:bg-amber-900/5">{t('pos.current_order.clear_order')}</Button>
            <Button className="bg-[#D4AF37] hover:bg-[#C5A059] text-white font-medium shadow-md rounded-xl" onClick={onPayment} disabled={!canMakePayment}>
              <CreditCard className="mr-2 h-4 w-4" />
              {t('pos.current_order.payment')}
            </Button>
          </div>
          <Button className="w-full mt-2 bg-[#593722] hover:bg-[#593722]/90 text-white font-medium shadow-md rounded-xl" onClick={onSendToKitchen} disabled={!canSendToKitchen}>
            <Send className="mr-2 h-4 w-4"/>
            {t('pos.current_order.send_to_kitchen')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}