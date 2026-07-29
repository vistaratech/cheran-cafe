"use client"
import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil, Trash2, Save } from "lucide-react"
import { type Category } from "@/lib/types"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { useMenuStore } from '@/lib/stores/menu-store'
import { useUserStore } from '@/lib/stores/user-store'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MultiSelect } from './multi-select'

interface RenderedCategory extends Category {
  depth: number;
}

export function CategoryDialog({ categories, onUpdate, trigger }: { categories: Category[], onUpdate: (category: Omit<Category, "id">) => void, trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryModifier, setIsNewCategoryModifier] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [originalCategory, setOriginalCategory] = useState<Category | null>(null);
  const { t } = useI18nStore();
  const { addCategory, updateCategory, deleteCategory, isCategoryInUse } = useMenuStore();
  const currentUser = useUserStore((state) => state.getCurrentUser());
  const restaurantId = currentUser?.restaurantId;
  
  const modifierGroups = useMemo(() => 
    categories
        .filter(c => c.isModifierGroup)
        .map(c => ({ value: c.name, label: c.name })), 
    [categories]
  );

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCategory({
        name: newCategoryName,
        isModifierGroup: isNewCategoryModifier
      }, restaurantId);
      setNewCategoryName('');
      setIsNewCategoryModifier(false);
    } catch(error: any) {
      console.error('Category add failed:', error);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    try {
      if (await isCategoryInUse(id)) {
        throw new Error(`Cannot delete category "${name}" because it is still in use.`);
      }
      await deleteCategory(id, restaurantId);
    } catch(error: any) {
      console.error('Category delete failed:', error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    // Check if there are actual changes
    const hasChanges = JSON.stringify(editingCategory) !== JSON.stringify(originalCategory);

    if (!hasChanges) {
      setEditingCategory(null);
      return;
    }

    try {
      await updateCategory(editingCategory.id, editingCategory, restaurantId);
      setEditingCategory(null);
    } catch(error: any) {
      console.error('Category update failed:', error);
    }
  };
  
  const startEditing = (category: Category) => {
    if (editingCategory) {
      handleUpdateCategory();
    }
    setEditingCategory(JSON.parse(JSON.stringify(category)));
    // Store original category for change detection
    setOriginalCategory(JSON.parse(JSON.stringify(category)));
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingCategory(null);
    }
  };
  
  const renderedCategories = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, {...c, children: [] as Category[]}]));
    const roots: Category[] = [];

    categories.forEach(category => {
        if (category.parentId && categoryMap.has(category.parentId)) {
            categoryMap.get(category.parentId)!.children.push(category as any);
        } else {
            roots.push(category);
        }
    });
    
    const flattened: RenderedCategory[] = [];
    const traverse = (category: Category, depth: number) => {
        flattened.push({ ...category, depth });
        const children = categoryMap.get(category.id)?.children || [];
        children.sort((a,b) => a.name.localeCompare(b.name)).forEach(child => traverse(child, depth + 1));
    };

    roots.sort((a,b) => a.name.localeCompare(b.name)).forEach(root => traverse(root, 0));
    return flattened;
  }, [categories]);

  const parentCategoryOptions = useMemo(() => {
    return renderedCategories.filter(c => c.id !== editingCategory?.id);
  }, [renderedCategories, editingCategory]);


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col bg-background border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="flex-shrink-0 pt-6 pb-4 px-6 border-b border-border/50">
          <DialogTitle className="text-2xl font-bold text-foreground">{t('restaurant.category_dialog.title')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t('restaurant.category_dialog.desc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 flex-1 flex flex-col min-h-0 pt-2">
          <div className="space-y-3">
            <div className="flex gap-3">
              <Input
                placeholder={t('restaurant.category_dialog.new_name')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="h-12 px-4 text-base border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <Button 
                onClick={handleAddCategory}
                className="h-12 px-6 bg-primary hover:bg-primary/90 transition-colors"
              >
                {t('restaurant.category_dialog.add')}
              </Button>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Checkbox 
                id="isModifierNew" 
                checked={isNewCategoryModifier} 
                onCheckedChange={(checked) => setIsNewCategoryModifier(!!checked)} 
                className="rounded border-border/50"
              />
              <Label 
                htmlFor="isModifierNew" 
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                {t('restaurant.category_dialog.is_modifier')}
              </Label>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto border border-border/50 rounded-lg bg-background">
            <div className="p-3 space-y-2">
              {renderedCategories.map(category => (
                <div key={category.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  {editingCategory?.id === category.id ? (
                    <div className='flex-1 space-y-3'>
                       <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') { handleUpdateCategory(); e.preventDefault(); e.stopPropagation(); } }}
                        autoFocus
                        className="h-10 text-base border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                            <Checkbox 
                              id={`isModifier-${category.id}`} 
                              checked={editingCategory.isModifierGroup} 
                              onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, isModifierGroup: !!checked })}
                              className="rounded border-border/50"
                            />
                            <Label 
                              htmlFor={`isModifier-${category.id}`} 
                              className="text-sm font-medium text-foreground cursor-pointer"
                            >
                              {t('restaurant.category_dialog.is_modifier')}
                            </Label>
                        </div>
                      </div>

                       {!editingCategory.isModifierGroup && (
                        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                          <Label className="text-sm font-semibold text-foreground">{t('restaurant.category_dialog.parent_category')}</Label>
                          <Select
                            value={String(editingCategory.parentId || 'null')}
                            onValueChange={(value) => {
                               if(editingCategory) {
                                  setEditingCategory({...editingCategory, parentId: value === 'null' ? null : Number(value)})
                               }
                            }}
                          >
                             <SelectTrigger className="h-10 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                                <SelectValue placeholder={t('restaurant.category_dialog.select_parent')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="null">{t('restaurant.category_dialog.no_parent')}</SelectItem>
                                {parentCategoryOptions.map(opt => (
                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                        <span style={{ paddingLeft: `${opt.depth * 1.25}rem` }}>{opt.name}</span>
                                    </SelectItem>
                                ))}
                              </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {!editingCategory.isModifierGroup && (
                        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                          <Label className="text-sm font-semibold text-foreground">{t('restaurant.category_dialog.linked_modifiers')}</Label>
                          <MultiSelect
                            options={modifierGroups}
                            selected={editingCategory.linkedModifiers || []}
                            onChange={(selected) => {
                               if (editingCategory) {
                                setEditingCategory({
                                  ...editingCategory, 
                                  linkedModifiers: Array.isArray(selected) ? selected : []
                                })
                               }
                            }}
                            className="border-border/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className='flex-1 flex items-center gap-2 cursor-pointer group-hover:text-foreground transition-colors' 
                      onDoubleClick={() => startEditing(category)} 
                      style={{ paddingLeft: `${category.depth * 1.25}rem` }}
                    >
                      <span className="font-medium">{category.name}</span>
                      {category.isModifierGroup && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {t('restaurant.category_dialog.is_modifier')}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     {editingCategory?.id === category.id ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50" 
                        onClick={handleUpdateCategory}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                     ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted" 
                        onClick={() => startEditing(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                     )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border/50">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            className="h-11 px-6 border-border/50 hover:bg-muted transition-colors"
          >
            {t('dialog.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}