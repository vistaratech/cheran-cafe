"use client";

import React from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, PlusCircle, MinusCircle, X } from 'lucide-react';
import { useI18nStore } from '@/lib/stores/i18n-store';
import { type OrderItem, type OrderType, type DeliveryInfo, type MenuItem } from '@/lib/types';
import { useCurrentOrderStoreCompat as useCurrentOrderStore, useCurrentOrderTotalsCompat as useCurrentOrderTotals } from '@/lib/stores/current-order-store';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CreditCard, Save, Send, Utensils, Package, PersonStanding, StickyNote } from 'lucide-react';
import { RupeeSymbol } from '@/components/ui/rupee-symbol';

interface SheetCartProps {
  onSendToKitchen: () => void;
  onPayment: () => void;
  onEditItem: (item: OrderItem) => void;
  sendButtonText?: string;
  isEditingOrder?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SheetCart({ onSendToKitchen, onPayment, onEditItem, sendButtonText, isEditingOrder, open, onOpenChange }: SheetCartProps) {
  const { t } = useI18nStore();
  const { 
    items,
    table,
    setTable,
    notes,
    setNotes,
    orderType,
    setOrderType,
    deliveryInfo,
    setDeliveryInfo,
    clearOrder,
    updateItemQuantity,
    removeItem
  } = useCurrentOrderStore();
  
  const { subtotal, tax, total } = useCurrentOrderTotals();
  
  // Customer name is optional for delivery orders
  const isDeliveryInfoComplete = !!(deliveryInfo.address && deliveryInfo.phone);
  const canSendToKitchen = items.length > 0 && (orderType === 'dine-in' || isDeliveryInfoComplete);
  const canMakePayment = items.length > 0;
  
  const handleQuantityChange = (itemId: string, adjustment: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateItemQuantity(itemId, adjustment);
  };

  // When used in the persistent layout (open prop is always true), we don't want the sheet behavior
  if (open !== undefined) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-1 py-1 border-b flex flex-row items-center justify-between">
          <h3 className="font-headline text-lg">
            {t('pos.current_order.title')}
          </h3>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              if (onOpenChange) onOpenChange(false);
            }}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col px-1">
          {renderCartContent()}
        </div>
      </div>
    );
  }

  // Original sheet behavior when used as a standalone component
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent {...({} as any)} className="p-0 sm:p-0 sm:pt-0 w-full md:max-w-sm [&>button]:hidden">
        <div className="flex flex-col h-full">
          {renderCartContent()}
        </div>
      </SheetContent>
    </Sheet>
  );

  function renderCartContent() {
    return (
      <ScrollArea className="flex-1 p-0">
        <Card className="border-0 shadow-none h-full flex flex-col">
          {/* Only show header when in sheet mode (open is undefined) */}
          {open === undefined && (
            <CardHeader className="px-0 py-1 border-b">
              <div className="flex justify-between items-center">
                <SheetTitle className="font-headline text-lg">
                  {t('pos.current_order.title')}
                </SheetTitle>
                {items.length > 0 && (
                  <Badge variant="secondary">
                    {items.length} {items.length === 1 ? t('pos.current_order.item') : t('pos.current_order.items')}
                  </Badge>
                )}
              </div>
            </CardHeader>
          )}
          
          <CardContent className="px-0 py-1 flex-grow flex flex-col min-h-0">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground px-0 py-1">
                <Utensils className="w-10 h-10 mb-2" />
                <p className="font-semibold">{t('pos.current_order.no_items')}</p>
                <p className="text-sm">{t('pos.current_order.select_items')}</p>
              </div>
            ) : (
              <>
                <div className="px-0 pt-1 flex-shrink-0">
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
                    <TabsContent value="dine-in" className="pt-1 px-0">
                      <div className="space-y-1">
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
                    <TabsContent value="delivery" className="pt-1 px-0">
                      <div className="space-y-1">
                        <div className="space-y-1">
                          <Label htmlFor="customer-name">{t('pos.delivery.name')}</Label>
                          <Input 
                            id="customer-name" 
                            value={deliveryInfo.name || ''} 
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="customer-address">{t('pos.delivery.address')}</Label>
                          <Input 
                            id="customer-address" 
                            value={deliveryInfo.address || ''} 
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="customer-phone">{t('pos.delivery.phone')}</Label>
                          <Input 
                            id="customer-phone" 
                            type="tel" 
                            value={deliveryInfo.phone || ''} 
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} 
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-1 px-0">
                    <Label htmlFor="order-notes">{t('pos.current_order.order_notes')}</Label>
                    <Textarea 
                      id="order-notes"
                      placeholder={t('pos.current_order.order_notes_placeholder')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                
                  <Separator className="my-1" />
                  

                </div>
                
                <div className="px-0 flex-grow overflow-hidden">
                  <ScrollArea className="h-full pb-1">
                    <div className="space-y-1">
                      {items.map((item: OrderItem) => (
                        <div 
                          key={item.id} 
                          onClick={() => onEditItem(item)} 
                          className="py-1 rounded-md hover:bg-muted/50 cursor-pointer relative"
                        >

                          
                          <div className="flex items-start gap-1 w-full">
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={(e) => handleQuantityChange(item.id, -1, e)}
                              >
                                <MinusCircle className="h-3.5 w-3.5"/>
                              </Button>
                              <span className="font-bold text-base w-5 text-center">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={(e) => handleQuantityChange(item.id, 1, e)}
                              >
                                <PlusCircle className="h-3.5 w-3.5"/>
                              </Button>
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <p className="font-semibold text-sm leading-tight">{item.menuItem.name}</p>
                              {item.selectedExtras && item.selectedExtras.length > 0 && (
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  {item.selectedExtras.map((extra: MenuItem) => (
                                    <div key={extra.id} className="flex items-center">+ {extra.name} (<RupeeSymbol className="h-3 w-3 mr-0.5 inline-block" />{extra.price.toFixed(2)})</div>
                                  ))}
                                </div>
                              )}
                              {item.notes && (
                                <div className="mt-0.5 text-xs text-muted-foreground flex items-start gap-1">
                                  <StickyNote className="w-3 h-3 mt-0.5 text-primary/80 flex-shrink-0"/>
                                  <p className="italic truncate">{item.notes}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm font-semibold ml-auto pr-6 flex items-center">
                              <RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block" />
                              {((item.menuItem.price + (item.selectedExtras?.reduce((acc: number, e: MenuItem) => acc + e.price, 0) || 0)) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </CardContent>
          
          {items.length > 0 && (
            <CardFooter className="flex-col !px-0 !py-1 border-t bg-card flex-shrink-0">
              <div className="w-full space-y-1 text-sm py-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pos.current_order.subtotal')}</span>
                  <span className="flex items-center"><RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block" />{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pos.current_order.tax')}</span>
                  <span className="flex items-center"><RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block" />{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-primary">
                  <span>{t('pos.current_order.total')}</span>
                  <span className="flex items-center"><RupeeSymbol className="h-4 w-4 mr-0.5 inline-block" />{total.toFixed(2)}</span>
                </div>
              </div>
              <Separator className="my-1" />
              <div className="w-full grid grid-cols-2 gap-1">
                <Button variant="outline" onClick={clearOrder} className="py-1">{t('pos.current_order.clear_order')}</Button>
                <Button variant="secondary" onClick={onPayment} disabled={!canMakePayment} className="py-1">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('pos.current_order.payment')}
                </Button>
              </div>
              <Button className="w-full mt-1 py-1" onClick={onSendToKitchen} disabled={isEditingOrder ? false : !canSendToKitchen}>
                {isEditingOrder ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {sendButtonText || t('dialog.save')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {sendButtonText || t('pos.current_order.send_to_kitchen')}
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </ScrollArea>
    );
  }
}
