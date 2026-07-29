"use client"

import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from "sonner";
import { useI18nStore } from '@/lib/stores/i18n-store'
import { useMenuStore } from '@/lib/stores/menu-store'
import { type MenuItem, type Category } from "@/lib/types"
import { MultiSelect } from './multi-select'

interface MenuItemDialogProps {
  item?: MenuItem;
  categories: Category[];
  onSave: (item: MenuItem | Omit<MenuItem, "id">) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MenuItemDialog({ item, categories, onSave, trigger, isOpen: externalIsOpen, onOpenChange: externalOnOpenChange }: MenuItemDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const menuStore = useMenuStore();
  const { t } = useI18nStore();

  // Form state from store
  const formName = menuStore.getFormName();
  const formPrice = menuStore.getFormPrice();
  const formDescription = menuStore.getFormDescription();
  const formCategory = menuStore.getFormCategory();
  const formImageUrl = menuStore.getFormImageUrl();
  const formLinkedModifiers = menuStore.getFormLinkedModifiers();

  // Use external open state if provided, otherwise use internal state
  const open = externalIsOpen !== undefined ? externalIsOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  
  const modifierGroups = categories
    .filter(c => c.isModifierGroup)
    .map(c => ({ value: c.name, label: c.name }));

  // Reset form when item changes or dialog opens - avoid store in dependencies to prevent infinite loops
  useEffect(() => {
    if (open) {
      menuStore.resetForm(item);
    } else {
      menuStore.clearForm();
    }
  }, [open, item]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation using store validation
    const errors = menuStore.getFormErrors();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(t('toast.error'), { description: error, duration: 3000 }));
      return;
    }

    try {
      const priceNum = parseFloat(formPrice);

      if (item?.id) {
        // Update existing item
        await onSave({
          id: item.id,
          name: formName.trim(),
          price: priceNum,
          description: formDescription.trim() || undefined,
          category: formCategory,
          imageUrl: formImageUrl.trim() || '',
          linkedModifiers: formLinkedModifiers.length > 0 ? formLinkedModifiers : undefined,
          sortIndex: 0,
          available: item.available
        });
      } else {
        // Add new item
        await onSave({
          name: formName.trim(),
          price: priceNum,
          description: formDescription.trim() || undefined,
          category: formCategory,
          imageUrl: formImageUrl.trim() || '',
          linkedModifiers: formLinkedModifiers.length > 0 ? formLinkedModifiers : undefined,
          sortIndex: 0
        });
      }

      menuStore.clearForm();
      handleOpenChange(false);
    } catch (error: any) {
      // Handle error
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col bg-background border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="flex-shrink-0 pt-6 pb-4 px-6 border-b border-border/50">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {item ? t('restaurant.menu_item_dialog.edit_title') : t('restaurant.menu_item_dialog.add_title')}
          </DialogTitle>
          <DialogDescription>
            {item ? t('restaurant.menu_item_dialog.edit_desc') : t('restaurant.menu_item_dialog.add_desc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-6 px-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-foreground">
                {t('restaurant.menu_item_dialog.name')}
              </label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => menuStore.setFormName(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.name_placeholder')}
                className="text-lg h-12 px-4 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-semibold text-foreground">
                {t('restaurant.menu_item_dialog.price')}
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formPrice}
                onChange={(e) => menuStore.setFormPrice(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.price_placeholder')}
                className="text-lg h-12 px-4 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-foreground">
                {t('restaurant.menu_item_dialog.description')}
              </label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => menuStore.setFormDescription(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.description_placeholder')}
                className="min-h-[100px] text-base px-4 py-3 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-semibold text-foreground">
                {t('restaurant.menu_item_dialog.category')}
              </label>
              <Select value={formCategory} onValueChange={(value) => menuStore.setFormCategory(value)}>
                <SelectTrigger className="h-12 text-base border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder={t('restaurant.menu_item_dialog.category_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        <div className="flex items-center gap-2">
                          <span>{cat.name}</span>
                          {cat.isModifierGroup && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {t('restaurant.category_dialog.is_modifier')}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-semibold text-foreground">
                {t('restaurant.menu_item_dialog.image_url')}
              </label>
              <Input
                id="imageUrl"
                value={formImageUrl}
                onChange={(e) => menuStore.setFormImageUrl(e.target.value)}
                placeholder={t('restaurant.menu_item_dialog.image_url_placeholder')}
                className="text-sm h-10 px-4 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>


            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {t('restaurant.menu_item_dialog.linked_modifiers')}
              </label>
              <MultiSelect
                options={modifierGroups}
                selected={formLinkedModifiers}
                onChange={(values) => {
                                      // Handle both direct values and function updaters
                                      const actualValues = typeof values === 'function' 
                                        ? values(formLinkedModifiers)
                                        : values;
                                      menuStore.setFormLinkedModifiers(actualValues);
                                    }}
                className="border-border/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
              />
            </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t border-border/50">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => handleOpenChange(false)}
              className="h-11 px-6 border-border/50 hover:bg-muted transition-colors"
            >
              {t('dialog.cancel')}
            </Button>
            <Button 
              type="submit"
              className="h-11 px-6 bg-primary hover:bg-primary/90 transition-colors"
            >
              {item ? t('dialog.save') : t('dialog.add')}
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}