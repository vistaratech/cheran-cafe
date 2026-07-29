'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useI18nStore } from '@/lib/stores/i18n-store';
import { type OrderItem, type CustomerPaymentAssignment, type Payment } from '@/lib/types';
import { ConsolidatedSplitBillCalculator, type CustomerItemAssignmentConfig } from '@/lib/consolidated-split-bill-calculator';
import { Plus, X, ShoppingCart, CreditCard, Landmark, DollarSign } from 'lucide-react';

interface CustomerItemAssignmentProps {
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  paymentMethods: Payment[];
  onConfigChange: (config: CustomerItemAssignmentConfig | null) => void;
  initialAssignments?: CustomerPaymentAssignment[];
}

export function CustomerItemAssignment({
  orderItems,
  subtotal,
  tax,
  tip,
  paymentMethods,
  onConfigChange,
  initialAssignments = []
}: CustomerItemAssignmentProps) {
  const { t } = useI18nStore();
  const [assignments, setAssignments] = useState<(CustomerPaymentAssignment & { bankId?: string })[]>(initialAssignments);
  const [calculator] = useState(() => new ConsolidatedSplitBillCalculator(orderItems, subtotal, tax, tip));
  
  // Initialize with one customer if empty
  useEffect(() => {
    if (assignments.length === 0) {
      addCustomer();
    }
  }, []);

  // Auto-update customer names when assignments change
  useEffect(() => {
    const updatedAssignments = assignments.map((assignment, index) => ({
      ...assignment,
      customerName: assignment.customerName || `Customer ${index + 1}`
    }));
    
    // Only update if names actually changed
    if (JSON.stringify(assignments) !== JSON.stringify(updatedAssignments)) {
      setAssignments(updatedAssignments);
    }
  }, [assignments]);

  // Calculate result and notify parent
  useEffect(() => {
    const config: CustomerItemAssignmentConfig = {
      method: 'customer_item_assignment',
      assignments,
      includeTaxTips: true
    };
    
    const result = calculator.calculate(config);
    onConfigChange(result.isValid ? config : null);
  }, [assignments, calculator, onConfigChange]);

  const addCustomer = () => {
    const customerIndex = assignments.length + 1;
    const newCustomer: CustomerPaymentAssignment = {
      customerId: `customer_${Date.now()}`,
      customerName: `Customer ${customerIndex}`,
      items: [],
      amount: 0,
      status: 'pending'
    };
    setAssignments([...assignments, newCustomer]);
  };

  const removeCustomer = (customerId: string) => {
    if (assignments.length <= 1) return;
    setAssignments(assignments.filter(a => a.customerId !== customerId));
  };


  const updateCustomerName = (customerId: string, name: string) => {
    if (name.length > 50) return;
    setAssignments(assignments.map(a => 
      a.customerId === customerId ? { ...a, customerName: name } : a
    ));
  };

  const updateCustomerPaymentMethod = (customerId: string, paymentMethodId: string) => {
    setAssignments(assignments.map(a => 
      a.customerId === customerId ? { ...a, paymentMethodId, bankId: undefined } : a
    ));
  };

  const addItemToCustomer = (customerId: string, orderItemId: string) => {
    setAssignments(assignments.map(assignment => {
      if (assignment.customerId === customerId) {
        const existingItem = assignment.items?.find(item => item.orderItemId === orderItemId);
        if (existingItem) {
          // Increase quantity if item already assigned
          return {
            ...assignment,
            items: assignment.items!.map(item => 
              item.orderItemId === orderItemId 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          };
        } else {
          // Add new item
          return {
            ...assignment,
            items: [...(assignment.items || []), { orderItemId, quantity: 1 }]
          };
        }
      }
      return assignment;
    }));
  };

  const removeItemFromCustomer = (customerId: string, orderItemId: string) => {
    setAssignments(assignments.map(assignment => {
      if (assignment.customerId === customerId) {
        return {
          ...assignment,
          items: assignment.items!.filter(item => item.orderItemId !== orderItemId)
        };
      }
      return assignment;
    }));
  };

  const updateItemQuantity = (customerId: string, orderItemId: string, quantity: number) => {
    if (quantity <= 0) return;
    
    const orderItem = orderItems.find(item => item.id === orderItemId);
    if (orderItem && quantity > orderItem.quantity) return;

    setAssignments(assignments.map(assignment => {
      if (assignment.customerId === customerId) {
        return {
          ...assignment,
          items: assignment.items!.map(item => 
            item.orderItemId === orderItemId ? { ...item, quantity } : item
          )
        };
      }
      return assignment;
    }));
  };

  const getIconForMethod = (type: string) => {
    switch (type) {
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Landmark className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getUnassignedItems = () => {
    return calculator.getUnassignedItems(assignments);
  };

  const areAllItemsAssigned = calculator.areAllItemsAssigned(assignments);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('pos.payment_dialog.customer_assignments')}</h3>
        <Button onClick={addCustomer} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('pos.payment_dialog.add_customer')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Assignment Cards */}
        <div className="space-y-3">
          {assignments.map((assignment, index) => (
            <Card key={assignment.customerId} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>👤</span>
                      <Input
                        value={assignment.customerName}
                        onChange={(e) => updateCustomerName(assignment.customerId, e.target.value)}
                        placeholder={t('pos.payment_dialog.person_name_placeholder')}
                        className="text-base font-normal px-2 py-1 h-8"
                      />
                    </CardTitle>
                  </div>
                  {assignments.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomer(assignment.customerId)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="mt-2">
                  <Label className="text-sm font-medium">{t('pos.payment_dialog.method')}</Label>
                  <Select 
                    value={assignment.paymentMethodId || ''} 
                    onValueChange={(value) => updateCustomerPaymentMethod(assignment.customerId, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('pos.payment_dialog.payment')} />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.filter(pm => pm.enabled).map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getIconForMethod(method.type)}
                            <span>{method.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Bank Selection for Bank Transfer Methods */}
                {assignment.paymentMethodId && 
                  (() => {
                    const selectedPaymentMethod = paymentMethods.find(pm => pm.id === assignment.paymentMethodId);
                    if (!selectedPaymentMethod || 
                        selectedPaymentMethod.type !== 'bank_transfer' || 
                        !Array.isArray(selectedPaymentMethod.banks) || 
                        selectedPaymentMethod.banks.length === 0) {
                      return null;
                    }
                    return (
                      <div className="mt-3">
                        <Label className="text-sm font-medium">{t('pos.payment_dialog.bank')}</Label>
                        <Select 
                          value={assignment.bankId || ''} 
                          onValueChange={(bankId) => {
                            setAssignments(assignments.map(a => 
                              a.customerId === assignment.customerId ? { ...a, bankId: bankId } : a
                            ));
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t('pos.payment_dialog.select_bank')} />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedPaymentMethod.banks.map(bank => (
                              <SelectItem key={bank} value={bank}>
                                {bank}
                              </SelectItem>
))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })()}
              </CardHeader>
              
              <CardContent className="pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('pos.payment_dialog.assigned_items')}</span>
                    <span className="text-sm text-muted-foreground">
                      {assignment.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                    </span>
                  </div>
                  
                  {assignment.items && assignment.items.length > 0 ? (
                    <div className="space-y-2">
                      {assignment.items.map(itemAssignment => {
                        const orderItem = orderItems.find(item => item.id === itemAssignment.orderItemId);
                        if (!orderItem) return null;
                        
                        return (
                          <div key={itemAssignment.orderItemId} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{orderItem.menuItem.name}</div>
                              <div className="text-xs text-muted-foreground">
                                ₹{(orderItem.menuItem.price * itemAssignment.quantity).toFixed(2)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateItemQuantity(assignment.customerId, itemAssignment.orderItemId, itemAssignment.quantity - 1)}
                                disabled={itemAssignment.quantity <= 1}
                              >
                                <span className="text-xs">-</span>
                              </Button>
                              <span className="text-sm w-8 text-center">{itemAssignment.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateItemQuantity(assignment.customerId, itemAssignment.orderItemId, itemAssignment.quantity + 1)}
                                disabled={itemAssignment.quantity >= orderItem.quantity}
                              >
                                <span className="text-xs">+</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeItemFromCustomer(assignment.customerId, itemAssignment.orderItemId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {t('pos.payment_dialog.no_items_assigned')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available Items Panel */}
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t('pos.payment_dialog.available_items')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getUnassignedItems().map((orderItem: any) => (
                  <div key={orderItem.id} className="flex items-center justify-between p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{orderItem.menuItem.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ₹{orderItem.menuItem.price.toFixed(2)} × {orderItem.quantity} = ₹{(orderItem.menuItem.price * orderItem.quantity).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Add to first customer (or could show selection dialog)
                        if (assignments.length > 0) {
                          addItemToCustomer(assignments[0].customerId, orderItem.id);
                        }
                      }}
                      disabled={assignments.length === 0}
                    >
                      {t('pos.payment_dialog.assign')}
                    </Button>
                  </div>
                ))}
                
                {getUnassignedItems().length === 0 && (
                  <div className="text-center py-4 text-green-600">
                    <div className="font-medium">✅ {t('pos.payment_dialog.all_items_assigned')}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('pos.payment_dialog.ready_to_process')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('pos.payment_dialog.assignment_summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('pos.payment_dialog.customers')}:</span>
                  <span className="font-medium">{assignments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('pos.payment_dialog.assigned_items')}:</span>
                  <span className="font-medium">
                    {assignments.reduce((sum, a) => sum + (a.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('pos.payment_dialog.unassigned_items')}:</span>
                  <span className="font-medium">{getUnassignedItems().reduce((sum: number, item: any) => sum + item.quantity, 0)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>{t('pos.payment_dialog.total')}:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {!areAllItemsAssigned && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ {t('pos.payment_dialog.warning_unassigned_items')}
          </p>
        </div>
      )}
    </div>
  );
}