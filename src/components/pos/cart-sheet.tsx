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
      <div className="flex flex-col h-full bg-white/95 backdrop-blur-md rounded-2xl border border-amber-900/15 shadow-xl overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 border-b border-amber-900/10 flex items-center justify-between bg-gradient-to-r from-amber-900/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#593722] text-white shadow-sm">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#362217]">
                {t('pos.current_order.title')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? t('pos.current_order.item') : t('pos.current_order.items')} selected
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              if (onOpenChange) onOpenChange(false);
            }}
            className="h-8 w-8 rounded-full hover:bg-amber-900/10 text-muted-foreground hover:text-[#593722] transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Cart Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-4">
          {renderCartContent()}
        </div>
      </div>
    );
  }

  // Original sheet behavior when used as a standalone component
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full bg-[#593722] text-white">
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent {...({} as any)} className="p-0 w-full md:max-w-md [&>button]:hidden bg-transparent border-0 shadow-none">
        <div className="flex flex-col h-full bg-white/95 backdrop-blur-md rounded-2xl border border-amber-900/15 shadow-2xl overflow-hidden m-2">
          <div className="p-4 border-b border-amber-900/10 flex items-center justify-between bg-gradient-to-r from-amber-900/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#593722] text-white shadow-sm">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h3 className="font-headline text-lg font-bold text-[#362217]">
                {t('pos.current_order.title')}
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                if (onOpenChange) onOpenChange(false);
              }}
              className="h-8 w-8 rounded-full hover:bg-amber-900/10 text-muted-foreground hover:text-[#593722]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-4">
            {renderCartContent()}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  function renderCartContent() {
    return (
      <div className="h-full flex flex-col justify-between min-h-0">
        {/* Order Setup Controls */}
        <div className="space-y-3 flex-shrink-0">
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
                <Label htmlFor="table-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('pos.current_order.table')}
                </Label>
                <Select value={String(table)} onValueChange={(value) => setTable(Number(value))} name="table-select">
                  <SelectTrigger id="table-select" className="rounded-xl border-amber-900/15 bg-white shadow-xs focus:ring-amber-900/20">
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
                <Label htmlFor="customer-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('pos.delivery.name')}
                </Label>
                <Input 
                  id="customer-name" 
                  value={deliveryInfo.name || ''} 
                  onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})} 
                  className="rounded-xl border-amber-900/15 bg-white h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer-address" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('pos.delivery.address')}
                </Label>
                <Input 
                  id="customer-address" 
                  value={deliveryInfo.address || ''} 
                  onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} 
                  className="rounded-xl border-amber-900/15 bg-white h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('pos.delivery.phone')}
                </Label>
                <Input 
                  id="customer-phone" 
                  type="tel" 
                  value={deliveryInfo.phone || ''} 
                  onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} 
                  className="rounded-xl border-amber-900/15 bg-white h-9"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="space-y-1.5">
            <Label htmlFor="order-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('pos.current_order.order_notes')}
            </Label>
            <Textarea 
              id="order-notes"
              placeholder={t('pos.current_order.order_notes_placeholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl border-amber-900/15 bg-white resize-none text-xs h-16 focus:ring-amber-900/20"
            />
          </div>
        </div>

        <Separator className="my-2 bg-amber-900/10" />

        {/* Scrollable Order Items List */}
        <div className="flex-1 overflow-hidden min-h-0 my-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6 rounded-2xl bg-amber-900/[0.02] border border-dashed border-amber-900/15">
              <div className="p-3 rounded-full bg-amber-900/5 mb-3 text-[#593722]">
                <Utensils className="w-8 h-8 opacity-60" />
              </div>
              <p className="font-semibold text-sm text-[#362217]">{t('pos.current_order.no_items')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('pos.current_order.select_items')}</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-1">
              <div className="space-y-2">
                {items.map((item: OrderItem) => (
                  <div 
                    key={item.id} 
                    onClick={() => onEditItem(item)} 
                    className="p-2.5 rounded-xl bg-amber-900/[0.03] border border-amber-900/10 hover:border-[#C5A059]/40 hover:bg-amber-900/[0.06] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-white rounded-lg border border-amber-900/10 p-0.5 shadow-xs flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-md hover:bg-amber-900/10 text-muted-foreground hover:text-[#593722]"
                          onClick={(e) => handleQuantityChange(item.id, -1, e)}
                        >
                          <MinusCircle className="h-3.5 w-3.5"/>
                        </Button>
                        <span className="font-bold text-sm w-5 text-center text-[#362217]">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-md hover:bg-amber-900/10 text-muted-foreground hover:text-[#593722]"
                          onClick={(e) => handleQuantityChange(item.id, 1, e)}
                        >
                          <PlusCircle className="h-3.5 w-3.5"/>
                        </Button>
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-grow min-w-0 px-1">
                        <p className="font-bold text-sm leading-tight text-[#362217] group-hover:text-[#593722] transition-colors">
                          {item.menuItem.name}
                        </p>
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {item.selectedExtras.map((extra: MenuItem) => (
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
                      
                      {/* Price & Remove */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="text-sm font-bold text-[#593722] flex items-center bg-amber-900/5 px-2 py-0.5 rounded-lg border border-amber-900/10">
                          <RupeeSymbol className="h-3 w-3 mr-0.5 inline-block" />
                          {((item.menuItem.price + (item.selectedExtras?.reduce((acc: number, e: MenuItem) => acc + e.price, 0) || 0)) * item.quantity).toFixed(2)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 rounded-md opacity-40 hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Order Summary & Actions */}
        {items.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-amber-900/10 flex-shrink-0">
            {/* Totals Box */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-900/5 to-amber-900/[0.02] border border-amber-900/10 space-y-1.5 text-sm">
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

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearOrder} 
                  className="rounded-xl border-amber-900/20 hover:bg-amber-900/5 text-muted-foreground text-xs font-semibold py-2"
                >
                  {t('pos.current_order.clear_order')}
                </Button>
                <Button 
                  onClick={onPayment} 
                  disabled={!canMakePayment} 
                  className="gold-gradient hover:opacity-95 text-white font-semibold shadow-md rounded-xl text-xs py-2 border-0"
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  {t('pos.current_order.payment')}
                </Button>
              </div>
              
              <Button 
                className="w-full bg-[#593722] hover:bg-[#4a2e1c] text-white font-bold shadow-lg rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]" 
                onClick={onSendToKitchen} 
                disabled={isEditingOrder ? false : !canSendToKitchen}
              >
                {isEditingOrder ? (
                  <>
                    <Save className="h-4 w-4" />
                    {sendButtonText || t('dialog.save')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {sendButtonText || t('pos.current_order.send_to_kitchen')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

