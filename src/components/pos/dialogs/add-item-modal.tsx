"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { type MenuItem, type Category, type OrderItem } from '@/lib/types';
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  orderItem?: OrderItem | null;
  onSave: (quantity: number, selectedExtras: MenuItem[], notes: string, workstationId?: string) => void;
  onRemove?: (itemId: string) => void;
  menuItems: MenuItem[];
  categories: Category[];
  workstations?: any[];
}

export function AddItemDialog({ isOpen, onOpenChange, item, orderItem, onSave, onRemove, menuItems, categories, workstations }: AddItemDialogProps) {
  const { t } = useI18nStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<MenuItem[]>([]);
  const [notes, setNotes] = useState('');
  const [workstationId, setWorkstationId] = useState<string | undefined>(undefined);
  
  const isEditMode = !!orderItem;

  const availableModifierGroups = useMemo(() => {
    if (!item) return {};

    const categoryMap = new Map(categories.map(c => [c.name, c]));
    
    const getParentModifiers = (categoryName: string): string[] => {
        const category = categoryMap.get(categoryName);
        if (!category) return [];

        const ownModifiers = category.linkedModifiers || [];
        
        const parentCategory = categories.find(c => c.id === category.parentId);
        if (parentCategory) {
            return [...ownModifiers, ...getParentModifiers(parentCategory.name)];
        }
        
        return ownModifiers;
    }

    const itemCategory = categories.find(c => c.name === item.category);
    
    const allInheritedModifiers = itemCategory ? getParentModifiers(itemCategory.name) : [];

    const modifierCategoryNames = new Set([
      ...(item.linkedModifiers || []),
      ...allInheritedModifiers
    ]);

    const groups: Record<string, MenuItem[]> = {};
    
    modifierCategoryNames.forEach(catName => {
        const category = categoryMap.get(catName);
        if (category && category.isModifierGroup) {
            groups[catName] = menuItems.filter(i => i.category === catName);
        }
    });

    return groups;
  }, [item, categories, menuItems]);

  useEffect(() => {
    if (isOpen) {
      setQuantity(orderItem?.quantity || 1);
      setSelectedExtras(orderItem?.selectedExtras || []);
      setNotes(orderItem?.notes || '');
      setWorkstationId(orderItem?.workstationId || undefined);
    }
  }, [isOpen, orderItem]);
  
  const handleExtraChange = (extra: MenuItem, checked: boolean) => {
    setSelectedExtras(prev => 
      checked ? [...prev, extra] : prev.filter(e => e.id !== extra.id)
    );
  };
  
  const isExtraSelected = (extraId: string) => {
    return selectedExtras.some(e => e.id === extraId);
  }

  const handleConfirm = () => {
    onSave(quantity, selectedExtras, notes, workstationId);
  };
  
  const handleRemove = () => {
    if (onRemove && orderItem) {
      onRemove(orderItem.id);
    }
    onOpenChange(false);
  }
  
  const extrasPrice = selectedExtras.reduce((acc, extra) => acc + extra.price, 0);
  const totalItemPrice = (item.price + extrasPrice) * quantity;

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('pos.add_item_dialog.update_item') : t('pos.add_item_dialog.customize')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 h-full -mx-6">
            <div className="px-4 space-y-4">
                {Object.entries(availableModifierGroups).map(([groupName, modifiers], index) => {
                  if (modifiers.length === 0) return null;
                  return (
                    <div key={`${groupName}-${index}`} className="space-y-2">
                        <Label className="font-semibold text-base">{groupName}</Label>
                        <div className="space-y-2">
                            {modifiers.map(modifier => (
                                <div key={modifier.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`extra-${modifier.id}`}
                                        checked={isExtraSelected(modifier.id)}
                                        onCheckedChange={(checked) => handleExtraChange(modifier, !!checked)}
                                    />
                                    <label
                                        htmlFor={`extra-${modifier.id}`}
                                        className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                    >
                                        {modifier.name}
                                    </label>
                                     <span className="text-base text-muted-foreground">+₹{modifier.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                  )
                })}
                
                <Separator />

                <div className="space-y-2">
                    <Label className="font-semibold text-base" htmlFor="item-notes">{t('pos.add_item_dialog.item_notes')}</Label>
                    <Textarea id="item-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('pos.add_item_dialog.item_notes_placeholder')} />
                </div>
                
                {workstations && workstations.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-semibold text-base">{t('pos.add_item_dialog.workstation')}</Label>
                    <Select value={workstationId ?? "default"} onValueChange={(value) => setWorkstationId(value === "default" ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pos.add_item_dialog.select_workstation')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">{t('pos.add_item_dialog.default_workstation')}</SelectItem>
                        {workstations.map((ws: any, index: number) => (
                          <SelectItem key={`${ws.id}-${index}`} value={ws.id}>
                            {ws.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                    <Label className="font-semibold text-base">{t('pos.add_item_dialog.quantity')}</Label>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input className="w-16 text-center text-base" value={quantity} readOnly />
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="!flex-row !justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
                 {isEditMode && onRemove && (
                    <Button variant="destructive" size="icon" onClick={handleRemove}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('pos.add_item_dialog.remove_item')}</span>
                    </Button>
                 )}
                 <div className="text-xl font-bold">
                    Total: <span className="text-primary">₹{totalItemPrice.toFixed(2)}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
                <Button onClick={handleConfirm}>{isEditMode ? t('dialog.save') : t('pos.add_item_dialog.add_to_order')}</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}