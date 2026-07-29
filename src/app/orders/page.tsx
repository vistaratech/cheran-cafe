"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { useI18nStore } from '@/lib/stores/i18n-store';
import { useUserStore } from '@/lib/stores/user-store';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-fetcher';
import { type Order } from '@/lib/types';
import { getOrderTotal } from '@/lib/helpers';
import { debugOrders } from '@/lib/helpers';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

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
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner';
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Home } from "lucide-react"
import { OrderDetailsDialog } from '@/components/pos/dialogs/order-details-modal';
import { ReceiptDialog } from '@/components/pos/dialogs/receipt-modal';

const getStatusVariant = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'completed':
      return 'default'
    default:
      return 'outline'
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.getCurrentUser());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const itemsPerPage = 10;
  
  const { t } = useI18nStore();
  


  // Using SWR to fetch orders
  const { data: orders, error: ordersError, isLoading: ordersLoading, mutate: mutateOrders } = useSWR<Order[]>(
    user?.restaurantId ? `/api/orders?restaurantId=${encodeURIComponent(user.restaurantId)}` : null,
    fetcher, {
    fallbackData: [],
    revalidateOnMount: true,
    shouldRetryOnError: true
  });
  
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    let filtered = orders.filter(order => 
      order.id.toString().includes(searchQuery) ||
      (order.staffName && order.staffName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    return filtered;
  }, [orders, searchQuery, activeTab]);
  
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);
  
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  }
  
  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setIsReceiptOpen(true);
  }
  
  const handleDeleteOrder = async (orderId: number) => {
    try {
      debugOrders('Attempting to delete order with ID: %d', orderId);
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        debugOrders('Failed to delete order %d: %O', orderId, errorData);
        throw new Error(errorData.error || 'Failed to delete order');
      }
      
      const result = await response.json();
      debugOrders('Successfully deleted order %d: %O', orderId, result);
      
      // Refresh the orders list
      mutateOrders();
      
      toast.success(t('orders.toast.deleted'), {
        description: t('orders.toast.deleted_desc'),
        duration: 3000,
      });
    } catch (error: any) {
      debugOrders('Error deleting order %d: %O', orderId, error);
      console.error('Error deleting order:', error);
      
      toast.error(t('toast.error'), {
        description: error.message || t('orders.toast.delete_error'),
        duration: 3000,
      });
    }
  }
  
  const handleEditOrder = (order: Order) => {
    // Navigate to POS page with the order to edit
    router.push(`/pos?editOrder=${order.id}`);
  }
  
  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
          <p className="text-muted-foreground">{t('orders.description')}</p>
        </div>
        <Button onClick={() => router.push('/pos')} variant="outline" size="sm">
          <Home className="h-4 w-4 mr-2" />
          {t('orders.back_to_pos')}
        </Button>
      </div>
      
      <OrderDetailsDialog 
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        order={selectedOrder}
        onViewReceipt={handleViewReceipt}
      />
      
      <ReceiptDialog
        isOpen={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        order={selectedOrder}
      />
      
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeTab === 'all' ? 'default' : 'outline'} 
              onClick={() => setActiveTab('all')}
              className="flex-1 min-w-[120px]"
            >
              {t('orders.tabs.all')}
            </Button>
            <Button 
              variant={activeTab === 'pending' ? 'default' : 'outline'} 
              onClick={() => setActiveTab('pending')}
              className="flex-1 min-w-[120px]"
            >
              {t('orders.tabs.pending')}
            </Button>
            <Button 
              variant={activeTab === 'completed' ? 'default' : 'outline'} 
              onClick={() => setActiveTab('completed')}
              className="flex-1 min-w-[120px]"
            >
              {t('orders.tabs.completed')}
            </Button>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('orders.table.search_placeholder')}
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {ordersLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>{t('orders.loading')}</p>
          </div>
        ) : ordersError ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-destructive">{t('orders.error')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('orders.table.order_id')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('orders.table.date')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('orders.table.table')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('orders.table.status')}</TableHead>
                    <TableHead>{t('orders.table.staff')}</TableHead>
                    <TableHead className="text-right">{t('orders.table.total')}</TableHead>
                    <TableHead><span className="sr-only">{t('orders.table.actions')}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {t('orders.no_orders_found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentOrders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer">
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell className="hidden sm:table-cell">{format(new Date(order.createdAt), 'PPp')}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {order.orderType === 'dine-in' ? `${t('pos.current_order.table')} ${order.table}` : t('pos.order_type.delivery')}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={getStatusVariant(order.status)} className="capitalize">
                            {t(`orders.status.${order.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.staffName || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{getOrderTotal(order).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">{t('orders.table.toggle_menu')}</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t('orders.table.actions')}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                  {t('orders.table.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                  {t('orders.table.view_details')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteOrder(order.id)}>
                                  {t('orders.table.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {currentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p>{t('orders.no_orders_found')}</p>
                </div>
              ) : (
                currentOrders.map((order) => (
                  <Card key={order.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">#{order.id}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.orderType === 'dine-in' ? `${t('pos.current_order.table')} ${order.table}` : t('pos.order_type.delivery')}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize">
                          {t(`orders.status.${order.status}`)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-3 space-y-1">
                        <p>{format(new Date(order.createdAt), 'PPp')}</p>
                        <p>{t('orders.table.staff')}: {order.staffName || 'N/A'}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-lg font-bold text-primary">₹{getOrderTotal(order).toFixed(2)}</p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrder(order);
                            }}
                          >
                            {t('orders.table.edit')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(order);
                            }}
                          >
                            {t('orders.table.view_details')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order.id);
                            }}
                            className="col-span-2"
                          >
                            {t('orders.table.delete')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  {t('orders.pagination.showing')} {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} {t('orders.pagination.of')} {filteredOrders.length} {t('orders.pagination.results')}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('orders.pagination.previous')}
                  </Button>
                  <div className="text-sm font-medium">
                    {t('orders.pagination.page')} {currentPage} {t('orders.pagination.of')} {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    {t('orders.pagination.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}