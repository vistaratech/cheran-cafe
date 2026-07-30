"use client"
import React, { useState, useCallback, useMemo, type DragEvent, useEffect } from 'react';
import Image from 'next/image'

import { useI18nStore } from '@/lib/stores/i18n-store'
import { useMenuStore } from '@/lib/stores/menu-store'
import { useUserStore } from '@/lib/stores/user-store'
import { useInventoryStore } from '@/lib/stores/inventory-store'
import { usePaymentsStore } from '@/lib/stores/payments-store'
import { useWorkstationsStore } from '@/lib/stores/workstations-store'
import { debugMenu, debugInventory } from '@/lib/helpers';
import { WorkstationDialog } from '@/components/restaurant/workstation-dialog'
import { RupeeSymbol } from '@/components/ui/rupee-symbol'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MoreHorizontal, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Utensils, 
  Search, 
  GripVertical, 
  Plus, 
  Minus, 
  FolderKanban,
  Edit,
  Package,
  CreditCard,
  Monitor,
  ChevronDown,
  Settings,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { type MenuItem, type Payment, type Category, type InventoryItem } from "@/lib/types"
import { type IWorkstation } from '@/models/Workstation'
import { WorkstationList } from "@/components/restaurant/workstation-list";
import { RolesList } from "@/components/restaurant/roles-list";
import { UsersList } from "@/components/restaurant/users-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { MenuItemDialog } from "@/components/restaurant/menu-item-dialog";
import { CategoryDialog } from "@/components/restaurant/category-dialog";
import { PaymentMethodDialog } from "@/components/restaurant/payment-method-dialog";
import { InventoryItemDialog } from "@/components/restaurant/inventory-item-dialog";
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/helpers'
import { Checkbox } from '@/components/ui/checkbox'
import { BatchActionsToolbar } from "@/components/restaurant/batch-actions-toolbar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface RenderedCategory extends Category {
  depth: number;
}

function InventoryList({ 
  items, 
  menuItems, 
  onSave, 
  onAdjustStock,
  onDeleteItem,
}: { 
  items: InventoryItem[], 
  menuItems: MenuItem[], 
  onSave: (item: Omit<InventoryItem, 'restaurantId'> | Omit<Omit<InventoryItem, 'restaurantId'>, 'id' | 'lastRestocked'>) => Promise<void>, 
  onAdjustStock: (itemId: string, adjustment: number) => Promise<void>,
  onDeleteItem: (itemId: string) => Promise<void>
}) {
    const { t } = useI18nStore();
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const handleOpenItemDialog = (item?: InventoryItem) => {
        setEditingItem(item);
        setIsItemDialogOpen(true);
    };
    
    const getStatusVariant = (item: InventoryItem) => {
        if (item.quantity <= 0) return 'destructive';
        if (item.quantity < item.reorderThreshold) return 'secondary';
        return 'default';
    }

    const getStatusText = (item: InventoryItem) => {
        if (item.quantity <= 0) return t('restaurant.inventory.status.out_of_stock');
        if (item.quantity < item.reorderThreshold) return t('restaurant.inventory.status.low_stock');
        return t('restaurant.inventory.status.in_stock');
    }

    const inventoryCategories = useMemo(() => {
        const cats = new Set(items.map(item => item.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [items, searchQuery, categoryFilter]);
    
    const renderContent = () => {
         if (filteredItems.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-10">
                    <p>{t('restaurant.inventory.no_items_found')}</p>
                </div>
            )
        }
        
        return (
            <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredItems.map(item => (
                        <Card key={item.id}>
                            <CardContent className="p-4 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.unit}</p>
                                    </div>
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">{t('restaurant.menu.table.toggle_menu')}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t('restaurant.menu.table.actions')}</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => handleOpenItemDialog(item)}>{t('restaurant.menu.table.edit')}</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => onDeleteItem(item.id)} className="text-destructive">{t('restaurant.menu.table.delete')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onAdjustStock(item.id, -1)}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onAdjustStock(item.id, 1)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Badge variant={getStatusVariant(item)}>{getStatusText(item)}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('restaurant.inventory.table.name')}</TableHead>
                                <TableHead>{t('restaurant.inventory.table.unit')}</TableHead>
                                <TableHead>{t('restaurant.inventory.table.status')}</TableHead>
                                <TableHead className="text-right w-[200px]">{t('restaurant.inventory.table.in_stock')}</TableHead>
                                <TableHead className="w-[100px]">
                                    <span className="sr-only">{t('restaurant.menu.table.actions')}</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(item)}>{getStatusText(item)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdjustStock(item.id, -1)}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdjustStock(item.id, 1)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">{t('restaurant.menu.table.toggle_menu')}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t('restaurant.menu.table.actions')}</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleOpenItemDialog(item)}>{t('restaurant.menu.table.edit')}</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => onDeleteItem(item.id)} className="text-destructive">{t('restaurant.menu.table.delete')}</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </>
        )
    }

    return (
        <>
        <InventoryItemDialog 
            isOpen={isItemDialogOpen}
            onOpenChange={setIsItemDialogOpen}
            item={editingItem}
            onSave={onSave}
            menuItems={menuItems}
        />
        {/* Removed CardHeader since we're showing this info in the dropdown menu */}
        <div className="p-6">
             {renderContent()}
        </div>
        </>
    )
}

function MenuList({ 
  menuItems, 
  categories, 
  onUpdateCategories,
  onSaveItem,
  onDeleteItem,
  onDeleteMultipleItems,
  onReorderItems
}: { 
  menuItems: MenuItem[], 
  categories: Category[], 
  onUpdateCategories: (category: Omit<Category, "id">) => Promise<any>,
  onSaveItem: (item: any) => Promise<any>,
  onDeleteItem: (id: string) => Promise<any>,
  onDeleteMultipleItems: (ids: string[]) => Promise<any>,
  onReorderItems: (items: MenuItem[]) => Promise<any>,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  
  const { t } = useI18nStore();

  const handleOpenItemDialog = (item?: MenuItem) => {
    debugMenu('handleOpenItemDialog called with item: %O', item);
    setEditingItem(item);
    setIsItemDialogOpen(true);
    debugMenu('Dialog state set - isOpen: %s', true);
  };
  
  const onDeleteMultiple = async () => {
    debugMenu('onDeleteMultiple called with selectedItemIds: %O', selectedItemIds);
    // Delete multiple menu items
    for (const id of selectedItemIds) {
      debugMenu('Deleting item with id: %s', id);
      await onDeleteItem(id);
    }
    setSelectedItemIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(filteredItems.map(item => item.id));
    } else {
      setSelectedItemIds([]);
    }
  }

  const handleRowSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds(prev => [...prev, itemId]);
    } else {
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    }
  }
  
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c: Category) => map.set(c.id, c));
    return map;
  }, [categories]);

  const categoryChildrenMap = useMemo(() => {
    const map = new Map<number, number[]>();
    categories.forEach((c: Category) => {
        if (c.parentId) {
            if (!map.has(c.parentId)) {
                map.set(c.parentId, []);
            }
            map.get(c.parentId)!.push(c.id);
        }
    });
    return map;
  }, [categories]);

  const getDescendantCategoryNames = useCallback((categoryId: number): string[] => {
    const names: string[] = [];
    const queue: number[] = [categoryId];
    const visited = new Set<number>();

    while(queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        
        const category = categoryMap.get(currentId);
        if (category) {
            names.push(category.name);
        }

        const children = categoryChildrenMap.get(currentId);
        if (children) {
            queue.push(...children);
        }
    }
    return names;
  }, [categoryMap, categoryChildrenMap]);
  
  const renderedCategories = useMemo(() => {
    const categoryIdMap = new Map(categories.map((c: Category) => [c.id, {...c, children: [] as Category[]}]));
    const roots: Category[] = [];

    categories.forEach((category: Category) => {
        if (category.parentId && categoryIdMap.has(category.parentId)) {
            categoryIdMap.get(category.parentId)!.children.push(category as any);
        } else {
            roots.push(category);
        }
    });
    
    const flattened: RenderedCategory[] = [];
    const traverse = (category: Category, depth: number) => {
        flattened.push({ ...category, depth });
        const children = categoryIdMap.get(category.id)?.children || [];
        children.sort((a: Category,b: Category) => a.name.localeCompare(b.name)).forEach((child: Category) => traverse(child, depth + 1));
    };

    roots.sort((a: Category,b: Category) => a.name.localeCompare(b.name)).forEach((root: Category) => traverse(root, 0));
    return flattened;
  }, [categories]);


  const filteredItems = useMemo(() => {
    let items = [...menuItems];
    
    if (categoryFilter !== 'all') {
      const selectedCategory = categories.find(c => c.name === categoryFilter);
      if (selectedCategory) {
        const relevantCategoryNames = getDescendantCategoryNames(selectedCategory.id);
        items = items.filter(item => relevantCategoryNames.includes(item.category));
      } else {
        items = [];
      }
    }

    if (searchQuery) {
      items = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Always sort items alphabetically since we're removing drag and drop
    items.sort((a, b) => a.name.localeCompare(b.name));

    return items;
  }, [menuItems, categoryFilter, searchQuery, categories, getDescendantCategoryNames]);


  const numSelected = selectedItemIds.length;
  const numVisible = filteredItems.length;
  const isAllSelected = numVisible > 0 && numSelected === numVisible;

  return (
    <>
      {/* Removed CardHeader since we're showing this info in the dropdown menu */}
      <div className="p-6">
        {numSelected > 0 && (
            <BatchActionsToolbar 
              selectedCount={numSelected}
              onDelete={onDeleteMultiple}
            />
        )}
        <div className="border rounded-lg overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label={t('restaurant.menu.table.select_all')}
                    />
                  </TableHead>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                      {t('restaurant.menu.table.image')}
                  </TableHead>
                  <TableHead>{t('restaurant.menu.table.name')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('restaurant.menu.table.category')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('restaurant.menu.table.status')}</TableHead>
                  <TableHead className="text-right">{t('restaurant.menu.table.price')}</TableHead>
                  <TableHead>
                      <span className="sr-only">{t('restaurant.menu.table.actions')}</span>
                  </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredItems.map((item) => (
                <TableRow 
                    key={item.id}
                    data-state={selectedItemIds.includes(item.id) && "selected"}
                >
                    <TableCell>
                      <Checkbox
                        checked={selectedItemIds.includes(item.id)}
                        onCheckedChange={(checked) => handleRowSelect(item.id, !!checked)}
                        aria-label={t('restaurant.menu.table.select_row')}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                    {item.imageUrl && !item.imageUrl.startsWith('https://placehold.co') ? (
                        <Image
                        alt={item.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={item.imageUrl}
                        width="64"
                        
                        />
                    ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        <Utensils className="w-8 h-8 text-muted-foreground" />
                        </div>
                    )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                    <Badge variant={item.available ? "default" : "destructive"}>
                        {item.available ? t('restaurant.menu.table.item_status.available') : t('restaurant.menu.table.item_status.unavailable')}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold flex items-center justify-end">
                      <RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block" />
                      {item.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                    <div className="flex justify-end">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('restaurant.menu.table.toggle_menu')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <DropdownMenuLabel>{t('restaurant.menu.table.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e: any) => { e.preventDefault(); handleOpenItemDialog(item); }}>{t('restaurant.menu.table.edit')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteItem(item.id)}>{t('restaurant.menu.table.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </div>
      <MenuItemDialog 
        item={editingItem}
        categories={categories} 
        onSave={onSaveItem}
        isOpen={isItemDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsItemDialogOpen(open);
          if (!open) {
            setEditingItem(undefined);
          }
        }}
      />
    </>
  )
}


function PaymentMethods({
  paymentMethods,
  onSave,
  onDelete,
  onToggle,
}: {
  paymentMethods: Payment[],
  onSave: (method: Payment | Omit<Payment, 'id'>) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onToggle: (id: string, enabled: boolean) => Promise<void>,
}) {
    const { t } = useI18nStore();
    
    return (
        <div className="p-6">
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{t('restaurant.payment_methods.table.name')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('restaurant.payment_methods.table.type')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('restaurant.payment_methods.table.enabled')}</TableHead>
                    <TableHead>
                        <span className="sr-only">{t('restaurant.payment_methods.table.actions')}</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                        <TableCell className="font-medium">
                            {method.name}
                            <div className="mt-1 flex items-center gap-2 sm:hidden">
                                <Badge variant="secondary">{t(`restaurant.payment_methods.types.${method.type}`)}</Badge>
                                <Switch 
                                  id={`enabled-switch-mobile-${method.id}`}
                                  checked={method.enabled} 
                                  onCheckedChange={(checked) => onToggle(method.id, checked)}
                                  aria-label={t('restaurant.payment_methods.aria_enable', { name: method.name })}
                                />
                            </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{t(`restaurant.payment_methods.types.${method.type}`)}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <Switch 
                            checked={method.enabled} 
                            onCheckedChange={(checked) => onToggle(method.id, checked)}
                            aria-label={t('restaurant.payment_methods.aria_enable', { name: method.name })}
                        />
                        </TableCell>
                        <TableCell>
                        <div className="flex justify-end items-center gap-2">
                            <PaymentMethodDialog method={method} onSave={onSave}>
                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                            </PaymentMethodDialog>
                            <Button variant="ghost" size="icon" className="text-destructive/80 hover:text-destructive" onClick={() => onDelete(method.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default function RestaurantPage() {
  const { t } = useI18nStore();
  const currentUser = useUserStore().getCurrentUser();

  // Check if current user is an Owner
  const isOwner = currentUser?.role === 'Owner';

  const menuStore = useMenuStore();
  const menuItemsObj = useMenuStore(state => state.entities.menuItems);
  const categoriesObj = useMenuStore(state => state.entities.categories);
  
  // Convert objects to arrays
  const menuItems = useMemo(() => Object.values(menuItemsObj), [menuItemsObj]);
  const categories = useMemo(() => Object.values(categoriesObj), [categoriesObj]);
  
  const {
    loading,
    error,
    
    addCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,

    fetchMenuData
  } = menuStore;
  
  const [activeTab, setActiveTab] = useState('menu');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // State for other dialogs
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | undefined>(undefined);
  const [isWorkstationDialogOpen, setIsWorkstationDialogOpen] = useState(false);
  const [editingWorkstation, setEditingWorkstation] = useState<IWorkstation | undefined>(undefined);

  const handleOpenItemDialog = (item?: MenuItem) => {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  };
  const handleOpenInventoryDialog = (item?: InventoryItem) => {
    setEditingInventoryItem(item);
    setIsInventoryDialogOpen(true);
  };

  const handleOpenWorkstationDialog = (workstation?: IWorkstation) => {
    setEditingWorkstation(workstation);
    setIsWorkstationDialogOpen(true);
  };
  
  const onDeleteMultiple = async () => {
    for (const id of selectedItemIds) {
      await deleteMenuItem(id);
    }
    setSelectedItemIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(filteredItems.map(item => item.id));
    } else {
      setSelectedItemIds([]);
    }
  }

  const handleRowSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds(prev => [...prev, itemId]);
    } else {
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    }
  }
  
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c: Category) => map.set(c.id, c));
    return map;
  }, [categories]);

  const categoryChildrenMap = useMemo(() => {
    const map = new Map<number, number[]>();
    categories.forEach((c: Category) => {
        if (c.parentId) {
            if (!map.has(c.parentId)) {
                map.set(c.parentId, []);
            }
            map.get(c.parentId)!.push(c.id);
        }
    });
    return map;
  }, [categories]);

  const getDescendantCategoryNames = useCallback((categoryId: number): string[] => {
    const names: string[] = [];
    const queue: number[] = [categoryId];
    const visited = new Set<number>();

    while(queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        
        const category = categoryMap.get(currentId);
        if (category) {
            names.push(category.name);
        }

        const children = categoryChildrenMap.get(currentId);
        if (children) {
            queue.push(...children);
        }
    }
    return names;
  }, [categoryMap, categoryChildrenMap]);
  
  const renderedCategories = useMemo(() => {
    const categoryIdMap = new Map(categories.map((c: Category) => [c.id, {...c, children: [] as Category[]}]));
    const roots: Category[] = [];

    categories.forEach((category: Category) => {
        if (category.parentId && categoryIdMap.has(category.parentId)) {
            categoryIdMap.get(category.parentId)!.children.push(category as any);
        } else {
            roots.push(category);
        }
    });
    
    const flattened: RenderedCategory[] = [];
    const traverse = (category: Category, depth: number) => {
        flattened.push({ ...category, depth });
        const children = categoryIdMap.get(category.id)?.children || [];
        children.sort((a: Category,b: Category) => a.name.localeCompare(b.name)).forEach((child: Category) => traverse(child, depth + 1));
    };

    roots.sort((a: Category,b: Category) => a.name.localeCompare(b.name)).forEach((root: Category) => traverse(root, 0));
    return flattened;
  }, [categories]);


  const filteredItems = useMemo(() => {
    let items = [...menuItems];
    
    if (categoryFilter !== 'all') {
      const selectedCategory = categories.find(c => c.name === categoryFilter);
      if (selectedCategory) {
        const relevantCategoryNames = getDescendantCategoryNames(selectedCategory.id);
        items = items.filter(item => relevantCategoryNames.includes(item.category));
      } else {
        items = [];
      }
    }

    if (searchQuery) {
      items = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Always sort items alphabetically since we're removing drag and drop
    items.sort((a, b) => a.name.localeCompare(b.name));

    return items;
  }, [menuItems, categoryFilter, searchQuery, categories, getDescendantCategoryNames]);


  const numSelected = selectedItemIds.length;
  const numVisible = filteredItems.length;
  const isAllSelected = numVisible > 0 && numSelected === numVisible;

  const handleSaveItem = async (itemData: Omit<MenuItem, "id"> & { restaurantId?: string }) => {
    if (editingItem) {
      // Update existing item
      await updateMenuItem(editingItem.id, itemData);
    } else {
      // Add new item with restaurantId
      await addMenuItem({ ...(itemData as any), restaurantId: currentUser?.restaurantId || '' });
    }
    setIsItemDialogOpen(false);
    setEditingItem(undefined);
  };

  // Use stores for inventory, payment methods, and workstations with memoized selectors
  const inventoryObj = useInventoryStore(state => state.entities.inventoryItems);
  const paymentsObj = usePaymentsStore(state => state.entities.paymentMethods);
  const workstationsObj = useWorkstationsStore(state => state.entities.workstations);

  const inventoryItems: InventoryItem[] = useMemo(() => Object.values(inventoryObj), [inventoryObj]);
  const paymentMethods: Payment[] = useMemo(() => Object.values(paymentsObj), [paymentsObj]);
  const workstationItems: IWorkstation[] = useMemo(() => Object.values(workstationsObj), [workstationsObj]);

  const fetchInventoryItems = useInventoryStore(state => state.fetchInventoryItems);
  const fetchPaymentMethods = usePaymentsStore(state => state.fetchPaymentMethods);
  const fetchWorkstations = useWorkstationsStore(state => state.fetchWorkstations);

  const addInventoryItemStore = useInventoryStore(state => state.addInventoryItem);
  const updateInventoryItemStore = useInventoryStore(state => state.updateInventoryItem);
  const deleteInventoryItemStore = useInventoryStore(state => state.deleteInventoryItem);
  const adjustStockStore = useInventoryStore(state => state.adjustStock);

  const addPaymentMethodStore = usePaymentsStore(state => state.addPaymentMethod);
  const updatePaymentMethodStore = usePaymentsStore(state => state.updatePaymentMethod);
  const deletePaymentMethodStore = usePaymentsStore(state => state.deletePaymentMethod);

  const addWorkstationStore = useWorkstationsStore(state => state.addWorkstation);
  const updateWorkstationStore = useWorkstationsStore(state => state.updateWorkstation);
  const deleteWorkstationStore = useWorkstationsStore(state => state.deleteWorkstation);
  const workstationsLoading = useWorkstationsStore(state => state.loading);
  const workstationsError = useWorkstationsStore(state => state.error);
  
  // Fetch initial data - avoid store objects in dependencies to prevent infinite loops
  useEffect(() => {
    const restaurantId = currentUser?.restaurantId || 'rest-default';
    fetchMenuData(restaurantId);
    fetchInventoryItems(restaurantId);
    fetchPaymentMethods(restaurantId);
    fetchWorkstations(restaurantId);
  }, [fetchMenuData, currentUser?.restaurantId, fetchInventoryItems, fetchPaymentMethods, fetchWorkstations]);
  
  // Inventory functions
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
    try {
      const restaurantId = currentUser?.restaurantId;
      if (!restaurantId) {
        throw new Error('No restaurant selected');
      }
      await addInventoryItemStore({ ...itemData, restaurantId });
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };
  
  const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>) => {
    try {
      await updateInventoryItemStore(id, itemData);
    } catch (error) {
      console.error('Error updating inventory item:', error);
    }
  };
  
  const deleteInventoryItem = async (id: string) => {
    try {
      await deleteInventoryItemStore(id);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    }
  };
  
  const adjustInventoryStock = async (id: string, adjustment: number) => {
    debugInventory('adjustInventoryStock: called with id %s and adjustment %d', id, adjustment);
    try {
      await adjustStockStore(id, adjustment);
      debugInventory('adjustInventoryStock: successfully adjusted stock for item %s', id);
    } catch (error) {
      debugInventory('adjustInventoryStock: error adjusting inventory stock: %O', error);
      console.error('Error adjusting inventory stock:', error);
    }
  };
  
  // Payment method functions
  const addPaymentMethod = async (methodData: Omit<Payment, 'id'>) => {
    try {
      const restaurantId = currentUser?.restaurantId;
      if (!restaurantId) throw new Error('No restaurant selected');
      await addPaymentMethodStore({ ...methodData, restaurantId });
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };
  
  const updatePaymentMethod = async (id: string, methodData: Partial<Payment>) => {
    try {
      await updatePaymentMethodStore(id, methodData);
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };
  
  const deletePaymentMethod = async (id: string) => {
    try {
      await deletePaymentMethodStore(id);
      toast.success(t('restaurant.payment_methods.delete_success'));
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error(t('restaurant.payment_methods.delete_error'));
    }
  };
  
  // Menu item functions
  const updateMenuItemOrder = async (categoryId: number, itemIds: string[]) => {
    // This is a placeholder - actual implementation would depend on how ordering works
    console.log('Update menu item order:', categoryId, itemIds);
  };
  
  const handleDeleteMenuItems = async (ids: string[]) => {
    // Delete multiple menu items
    for (const id of ids) {
      await deleteMenuItem(id);
    }
  };

  // Workstation CRUD operations
  const addWorkstation = async (workstationData: Partial<IWorkstation> & { name: string }) => {
    try {
      const restaurantId = currentUser?.restaurantId;
      if (!restaurantId) throw new Error('No restaurant selected');
      await addWorkstationStore({ ...workstationData, restaurantId });
    } catch (error) {
      throw error;
    }
  };

  const updateWorkstation = async (id: string, workstationData: Partial<IWorkstation> & { name: string }) => {
    try {
      await updateWorkstationStore(id, workstationData);
    } catch (error) {
      throw error;
    }
  };

  const deleteWorkstation = async (id: string) => {
    try {
      await deleteWorkstationStore(id);
    } catch (error) {
      throw error;
    }
  };

  // Render loading state - hooks must be called before any conditional return
  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <p>{t('restaurant.loading')}</p>
        </div>
    )
  }

  return (
    <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">{t('restaurant.title')}</h1>
        </div>

        {/* Replace Tabs with Dropdown Menu */}
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {activeTab === 'menu' && t('restaurant.menu.title')}
                    {activeTab === 'inventory' && t('restaurant.inventory.title')}
                    {activeTab === 'payments' && t('restaurant.payment_methods.title')}
                    {activeTab === 'workstations' && t('restaurant.workstations.title')}
                    {activeTab === 'roles' && 'Roles'}
                    {activeTab === 'users' && t('restaurant.users.title')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-full sm:w-56">
                  <DropdownMenuItem onSelect={() => setActiveTab('menu')}>
                    {t('restaurant.menu.title')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setActiveTab('inventory')}>
                    {t('restaurant.inventory.title')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setActiveTab('payments')}>
                    {t('restaurant.payment_methods.title')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setActiveTab('workstations')}>
                    {t('restaurant.workstations.title')}
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem onSelect={() => setActiveTab('roles')}>
                      Roles
                    </DropdownMenuItem>
                  )}
                  {isOwner && (
                    <DropdownMenuItem onSelect={() => setActiveTab('users')}>
                      {t('restaurant.users.title')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Action Buttons - Now responsive */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
              {activeTab === 'menu' && (
                <>
                  <CategoryDialog 
                    categories={categories}
                    onUpdate={addCategory}
                    trigger={
                      <Button variant="outline" className="flex-1 sm:flex-none">
                        {t('restaurant.menu.manage_categories')}
                      </Button>
                    }
                  />
                  <Button onClick={() => handleOpenItemDialog()} className="flex-1 sm:flex-none">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('restaurant.menu.add_item')}
                  </Button>
                </>
              )}            
              {activeTab === 'inventory' && (
                <Button onClick={() => handleOpenInventoryDialog()} className="flex-1 sm:flex-none">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('restaurant.inventory.add_item')}
                </Button>
              )}
              
              {activeTab === 'payments' && (
                <PaymentMethodDialog 
                  method={undefined}
                  onSave={async (methodData: any) => {
                    await addPaymentMethod(methodData);
                  }}
                >
                  <Button variant="default" className="flex-1 sm:flex-none">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('restaurant.payment_methods.add_method')}
                  </Button>
                </PaymentMethodDialog>
              )}
              
              {activeTab === 'workstations' && (
                <Button onClick={() => handleOpenWorkstationDialog()} className="flex-1 sm:flex-none">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('restaurant.workstations.add_workstation')}
                </Button>
              )}
              
              {activeTab === 'users' && (
                <Button
                  onClick={() => window.dispatchEvent(new CustomEvent('openInviteDialog'))}
                  className="flex-1 sm:flex-none"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('restaurant.users.add_user')}
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            {activeTab === 'menu' && (
              <>
                <MenuList
                  menuItems={menuItems}
                  categories={categories}
                  onUpdateCategories={addCategory}
                  onSaveItem={(item: any) => 'id' in item ? updateMenuItem(item.id, item) : addMenuItem({ ...item, restaurantId: currentUser?.restaurantId || '' })}
                  onDeleteItem={deleteMenuItem}
                  onDeleteMultipleItems={handleDeleteMenuItems}
                  onReorderItems={(items) => updateMenuItemOrder(0, items.map(i => i.id))}
                />
                <MenuItemDialog
                  item={editingItem}
                  categories={categories}
                  onSave={async (item: any) => {
                    if ('id' in item) {
                      await updateMenuItem(item.id, item);
                    } else {
                      await addMenuItem({ ...item, restaurantId: currentUser?.restaurantId || '' });
                    }
                    setIsItemDialogOpen(false);
                    setEditingItem(undefined);
                  }}
                  isOpen={isItemDialogOpen}
                  onOpenChange={(open: boolean) => {
                    setIsItemDialogOpen(open);
                    if (!open) {
                      setEditingItem(undefined);
                    }
                  }}
                />
              </>
            )}            
            {activeTab === 'inventory' && (
              <>
                <InventoryList 
                  items={inventoryItems} 
                  menuItems={menuItems} 
                  onSave={async (item) => {
                    if ('id' in item) {
                      await updateInventoryItem(item.id, item);
                    } else {
                      // Remove lastRestocked from the item before adding
                      const { lastRestocked, ...itemData } = item as any;
                      await addInventoryItem({ ...itemData, lastRestocked: new Date().toISOString() });
                    }
                  }}
                  onAdjustStock={adjustInventoryStock}
                  onDeleteItem={deleteInventoryItem}
                />
                <InventoryItemDialog
                  isOpen={isInventoryDialogOpen}
                  onOpenChange={setIsInventoryDialogOpen}
                  item={editingInventoryItem}
                  onSave={async (itemData: any) => {
                    if (editingInventoryItem && editingInventoryItem.id) {
                      // Update existing item
                      await updateInventoryItem(editingInventoryItem.id, itemData);
                    } else {
                      // Add new item
                      await addInventoryItem(itemData);
                    }
                    setIsInventoryDialogOpen(false);
                    setEditingInventoryItem(undefined);
                  }}
                  menuItems={menuItems}
                />
              </>
            )}
            
            {activeTab === 'payments' && (
              <>
                <PaymentMethods
                  paymentMethods={paymentMethods}
                  onSave={(method) => 'id' in method ? updatePaymentMethod(method.id, method) : addPaymentMethod(method)}
                  onDelete={deletePaymentMethod}
                  onToggle={(id, enabled) => updatePaymentMethod(id, {enabled})}
                />
              </>
            )}
            
            {activeTab === 'workstations' && (
              <>
                <WorkstationList
                  workstations={workstationItems}
                  loading={workstationsLoading}
                  error={workstationsError}
                  onAdd={addWorkstation}
                  onUpdate={updateWorkstation}
                  onDelete={deleteWorkstation}
                  onReorder={(updatedWorkstations) => {
                    useWorkstationsStore.setState((state) => ({
                      entities: {
                        ...state.entities,
                        workstations: Object.fromEntries(
                          updatedWorkstations.map(ws => [ws.id, ws])
                        )
                      }
                    }));
                  }}
                />
                <WorkstationDialog
                  workstation={editingWorkstation}
                  isOpen={isWorkstationDialogOpen}
                  onOpenChange={(open: boolean) => {
                    setIsWorkstationDialogOpen(open);
                    if (!open) {
                      setEditingWorkstation(undefined);
                    }
                  }}
                  onSave={async (workstationData) => {
                    try {
                      if (editingWorkstation?.id) {
                        await updateWorkstation(editingWorkstation.id, workstationData);
                      } else {
                        await addWorkstation(workstationData);
                      }
                    } catch (error) {
                      console.error('Error saving workstation:', error);
                    }
                  }}
                />
              </>
            )}
            
            {activeTab === 'roles' && (
              <div className="p-6">
                <RolesList />
              </div>
            )}
            
            {activeTab === 'users' && (
              <div className="p-6">
                <UsersList />
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
