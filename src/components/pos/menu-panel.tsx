"use client"
import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { type MenuItem, type Category, type OrderItem } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Utensils } from 'lucide-react'
import { useI18nStore } from '@/lib/stores/i18n-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCurrentOrderStoreCompat as useCurrentOrderStore } from '@/lib/stores/current-order-store'
import { RupeeSymbol } from '@/components/ui/rupee-symbol'

interface RenderedCategory extends Category {
  depth: number;
}

interface MenuSelectionProps {
  menuItems: MenuItem[];
  categories: Category[];
  onAddItem: (item: MenuItem) => void;
}

export function MenuSelection({ menuItems, categories, onAddItem }: MenuSelectionProps) {
  const { t } = useI18nStore();
  
  // Get current order items to display badges
  const { items: orderItems, addItem: addItemToOrder } = useCurrentOrderStore();

  // Memoize badge counts to avoid recalculating for each item
  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orderItems.forEach((orderItem: OrderItem) => {
      const itemId = orderItem.menuItem?.id;
      if (itemId) {
        counts[itemId] = (counts[itemId] || 0) + orderItem.quantity;
      }
    });
    return counts;
  }, [orderItems]);

  const renderedCategories = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, {...c, children: [] as Category[]}]));
    const roots: Category[] = [];

    categories.forEach(category => {
        if (category.parentId && categoryMap.has(category.parentId)) {
            (categoryMap.get(category.parentId) as any).children.push(category);
        } else {
            roots.push(category);
        }
    });
    
    const flattened: RenderedCategory[] = [];
    const traverse = (category: Category, depth: number) => {
        flattened.push({ ...category, depth });
        const children = (categoryMap.get(category.id) as any)?.children || [];
        children.sort((a: Category,b: Category) => a.name.localeCompare(b.name)).forEach((child: Category) => traverse(child, depth + 1));
    };

    roots.sort((a,b) => a.name.localeCompare(b.name)).forEach(root => traverse(root, 0));
    return flattened;
  }, [categories]);

  const [activeCategoryName, setActiveCategoryName] = useState<string>(() => {
    // Try to get the last selected category from localStorage
    if (typeof window !== 'undefined') {
      const savedCategory = localStorage.getItem('pos-last-category');
      if (savedCategory && (savedCategory === 'all' || categories.some(c => c.name === savedCategory))) {
        return savedCategory;
      }
    }
    // Default to first category or 'all' if no categories exist
    return renderedCategories[0]?.name || 'all';
  });

  // Save the selected category to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos-last-category', activeCategoryName);
    }
  }, [activeCategoryName]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const categoryChildrenMap = useMemo(() => {
    const map = new Map<number, number[]>();
    categories.forEach(c => {
        if (c.parentId) {
            if (!map.has(c.parentId)) {
                map.set(c.parentId, []);
            }
            map.get(c.parentId)!.push(c.id);
        }
    });
    return map;
  }, [categories]);

  const getDescendantCategoryNames = useMemo(() => {
    return (categoryId: number): string[] => {
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
    };
  }, [categoryMap, categoryChildrenMap]);

  const itemsForActiveCategory = useMemo(() => {
    if (activeCategoryName === 'all') return menuItems;
    
    const activeCategory = categories.find(c => c.name === activeCategoryName);
    if (!activeCategory) return [];

    const relevantCategoryNames = getDescendantCategoryNames(activeCategory.id);
    
    return menuItems.filter(item => relevantCategoryNames.includes(item.category));
  }, [activeCategoryName, menuItems, categories, getDescendantCategoryNames]);
  
  // New function to directly add item to cart without opening dialog
  const handleItemClick = (item: MenuItem) => {
    // Add directly to the store
    addItemToOrder(item, 1, [], undefined, undefined);
  };
  
  if (categories.filter(c => !c.isModifierGroup).length === 0) {
    return (
       <Card className="h-full flex flex-col items-center justify-center">
        <CardHeader>
          <CardTitle className="font-headline">{t('pos.menu_selection.no_categories_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('pos.menu_selection.no_categories_desc_1')}</p>
          <p className="text-sm text-muted-foreground">{t('pos.menu_selection.no_categories_desc_2')}</p>
        </CardContent>
       </Card>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-row items-center justify-between mb-4">
        <Select value={activeCategoryName} onValueChange={setActiveCategoryName}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder={t('restaurant.menu.filter_by_category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('restaurant.menu.all_categories')}</SelectItem>
            {renderedCategories.filter(c => !c.isModifierGroup).map(cat => (
              <SelectItem key={cat.id} value={cat.name}>
                <span style={{ paddingLeft: `${cat.depth * 1.25}rem` }}>{cat.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-grow flex flex-col min-h-0">
          <div className="flex-grow relative mt-4">
            <ScrollArea className="absolute inset-0">
              {/* Grid view for larger screens */}
              <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3.5 p-1">
                {itemsForActiveCategory.map(item => {
                  // Get badge count from memoized counts
                  const itemCount = badgeCounts[item.id] || 0;
                  
                  return (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer bg-white/90 border border-amber-900/10 rounded-2xl hover:border-[#C5A059] hover:shadow-xl hover:shadow-amber-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group relative"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="w-full aspect-square relative bg-amber-900/5 flex items-center justify-center overflow-hidden">
                          {item.imageUrl && !item.imageUrl.startsWith("https://placehold.co") && item.imageUrl !== '/placeholder-menu-item.jpg' ? (
                              <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                              <Utensils className="w-1/2 h-1/2 text-amber-900/30" />
                          )}
                          {itemCount > 0 && (
                            <Badge className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full bg-[#593722] text-white shadow-md border border-white">
                              {itemCount}
                            </Badge>
                          )}
                      </div>
                      <CardFooter className="p-3 flex-grow flex flex-col items-start justify-between bg-white">
                        <p className="font-medium font-body text-sm leading-tight text-[#362217] line-clamp-1">{item.name}</p>
                        <p className="text-sm text-[#593722] font-bold mt-1 flex items-center bg-amber-900/5 px-2 py-0.5 rounded-full border border-amber-900/10">
                          <RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block text-[#593722]" />
                          {item.price.toFixed(2)}
                        </p>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              
              {/* List view for small screens */}
              <div className="sm:hidden space-y-2.5 p-1">
                {itemsForActiveCategory.map(item => {
                  // Get badge count from memoized counts
                  const itemCount = badgeCounts[item.id] || 0;
                  
                  return (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer bg-white border border-amber-900/10 rounded-2xl hover:shadow-md hover:border-[#C5A059] transition-all flex items-center gap-3 p-3"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-amber-900/5 flex items-center justify-center overflow-hidden">
                          {item.imageUrl && !item.imageUrl.startsWith("https://placehold.co") && item.imageUrl !== '/placeholder-menu-item.jpg' ? (
                            <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-xl object-cover" />
                          ) : (
                            <Utensils className="w-6 h-6 text-amber-900/40" />
                          )}
                        </div>
                        {itemCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold rounded-full bg-[#593722] text-white">
                            {itemCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm leading-tight truncate text-[#362217]">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                      </div>
                      <div className="text-sm font-bold text-[#593722] flex-shrink-0 flex items-center bg-amber-900/5 px-2 py-0.5 rounded-full border border-amber-900/10">
                        <RupeeSymbol className="h-3.5 w-3.5 mr-0.5 inline-block text-[#593722]" />
                        {item.price.toFixed(2)}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
      </div>
    </div>
  )
}