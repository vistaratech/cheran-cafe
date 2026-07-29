"use client";

import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { CreditCard, Landmark, DollarSign, Check, Users, Loader2 } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { type OrderItem, type Payment } from '@/lib/types';
import { useCurrentOrderTotalsCompat as useCurrentOrderTotals } from '@/lib/stores/current-order-store';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { SimplifiedSplitBillSelector } from '@/components/billing/bill-splitter';
import { ConsolidatedSplitBillCalculator, type SplitConfig as SimpleSplitConfig, type SplitCalculationResult as SimpleSplitResult, type CustomerItemAssignmentConfig } from '@/lib/consolidated-split-bill-calculator';
import { CustomerItemAssignment } from '@/components/billing/customer-assignment';
import { toast } from "sonner";

interface PaymentDialogRefactoredProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  totalAmount: number;
  onConfirmPayment: (paymentData: { 
    method: Payment; 
    amount: number; 
    splitDetails?: any;
  }) => void;
  paymentMethods: Payment[];
  onClose?: () => void;
}

const getIconForMethod = (type: string) => {
  switch (type) {
    case 'card': return <CreditCard className="h-4 w-4" />;
    case 'bank_transfer': return <Landmark className="h-4 w-4" />;
    default: return <DollarSign className="h-4 w-4" />;
  }
};

export function PaymentDialogRefactored({ 
  isOpen, 
  onOpenChange, 
  orderItems, 
  totalAmount, 
  onConfirmPayment, 
  paymentMethods,
  onClose
}: PaymentDialogRefactoredProps) {
  const { t } = useI18nStore();
  const { subtotal, tax } = useCurrentOrderTotals();
  
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [useSplitBill, setUseSplitBill] = useState<boolean>(false);
  const [splitConfig, setSplitConfig] = useState<SimpleSplitConfig | null>(null);
  const [splitValid, setSplitValid] = useState<boolean>(true);
  
  // Enhanced payment states
  const [enhancedSplitMethod, setEnhancedSplitMethod] = useState<'simple' | 'item_assignment'>('simple');
  const [enhancedSplitConfig, setEnhancedSplitConfig] = useState<CustomerItemAssignmentConfig | null>(null);
  const [enhancedSplitValid, setEnhancedSplitValid] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
  
  // Calculate split results when config changes
  const splitResult = useMemo(() => {
    if (!splitConfig || !useSplitBill || enhancedSplitMethod !== 'simple') return null;
    
    const calculator = new ConsolidatedSplitBillCalculator(orderItems, subtotal, tax, 0);
    return calculator.calculate(splitConfig);
  }, [splitConfig, useSplitBill, enhancedSplitMethod, orderItems, subtotal, tax]);

  // Enhanced split results
  const enhancedSplitResult = useMemo(() => {
    if (!enhancedSplitConfig || !useSplitBill || enhancedSplitMethod === 'simple') return null;
    
    const calculator = new ConsolidatedSplitBillCalculator(orderItems, subtotal, tax, 0);
    return calculator.calculate(enhancedSplitConfig);
  }, [enhancedSplitConfig, useSplitBill, enhancedSplitMethod, orderItems, subtotal, tax, paymentMethods]);

  const handleMethodChange = (value: string) => {
    setSelectedMethodId(value);
    setSelectedBank('');
  }

  const handleSplitConfigChange = useCallback((config: SimpleSplitConfig | null) => {
    setSplitConfig(config);
    setSplitValid(config !== null);
    // Clear enhanced config when switching to simple
    if (config) {
      setEnhancedSplitConfig(null);
      setEnhancedSplitValid(true);
    }
  }, []);

  const handleEnhancedSplitConfigChange = useCallback((config: CustomerItemAssignmentConfig | null) => {
    setEnhancedSplitConfig(config);
    setEnhancedSplitValid(config !== null);
    // Clear simple config when switching to enhanced
    if (config) {
      setSplitConfig(null);
      setSplitValid(true);
    }
  }, []);

  const handleEnhancedSplitMethodChange = useCallback((method: 'simple' | 'item_assignment') => {
    setEnhancedSplitMethod(method);
    setEnhancedSplitConfig(null);
    setEnhancedSplitValid(true);
    // Also clear simple split config
    setSplitConfig(null);
    setSplitValid(true);
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  }

  const handleBankChange = (value: string) => {
    setSelectedBank(value);
  }

  const handleConfirm = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
  
    try {
      // Handle payment methods (existing logic)
      onConfirmPayment({
        method: selectedMethod,
        amount: totalAmount,
        splitDetails: useSplitBill 
          ? (enhancedSplitMethod === 'simple' ? splitConfig : enhancedSplitConfig)
          : undefined,
      });
    
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Payment Error', {
        description: error.message || 'Failed to process payment',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const canConfirm = useCallback(() => {
    if (!selectedMethodId) return false;
    if (selectedMethod?.type === 'bank_transfer' && !selectedBank) return false;
    
    if (useSplitBill) {
      if (enhancedSplitMethod === 'simple') {
        return splitConfig !== null && splitValid;
      } else {
        return enhancedSplitConfig !== null && enhancedSplitValid;
      }
    }
    return true;
  }, [selectedMethodId, selectedMethod, selectedBank, useSplitBill, enhancedSplitMethod, splitConfig, splitValid, enhancedSplitConfig, enhancedSplitValid]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-auto w-[95vw] sm:w-auto">
        {/* Header */}
        <DialogHeader className="p-3 sm:p-4 pb-0">
          <div>
            <DialogTitle className="font-headline text-2xl">
              {t('pos.payment_dialog.title')}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {t('pos.payment_dialog.total_due')}: 
              <span className="font-bold text-primary ml-2 text-lg">
                ${totalAmount.toFixed(2)}
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 h-full min-h-0">
            {/* Payment Methods and Controls */}
            <div className="flex flex-col space-y-3 h-full">
              <ScrollArea className="flex-1 h-full">
                <div className="space-y-3 pr-1 pb-1">
                  {/* Payment Methods - Only show when NOT splitting bill */}
                  {!useSplitBill && (
                    <>
                      <div>
                        <Label className="font-semibold text-sm mb-2 block">
                          {t('pos.payment_dialog.method')}
                        </Label>
                        <RadioGroup 
                          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                          onValueChange={handleMethodChange}
                          value={selectedMethodId}
                        >
                          {paymentMethods.map(method => (
                            <div key={method.id}>
                              <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                              <Label
                                htmlFor={method.id}
                                className="flex flex-col items-center gap-1 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-1">
                                  {getIconForMethod(method.type)}
                                  <span className="font-semibold text-xs">{method.name}</span>
                                </div>
                                <Check className="h-5 w-5 text-primary opacity-0 peer-data-[state=checked]:opacity-100 transition-opacity" />
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Bank Selection */}
                      {selectedMethod?.type === 'bank_transfer' && (
                        <div className="space-y-1">
                          <Label htmlFor="bank" className="font-semibold text-sm">
                            {t('pos.payment_dialog.bank')}
                          </Label>
                          <Select value={selectedBank} onValueChange={handleBankChange}>
                            <SelectTrigger id="bank">
                              <SelectValue placeholder={t('pos.payment_dialog.select_bank')} />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedMethod.banks?.map(bank => (
                                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <Separator />
                    </>
                  )}
                  
                  {/* Split Bill Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="split-bill-switch" 
                          checked={useSplitBill} 
                          onCheckedChange={setUseSplitBill}
                        />
                        <Label htmlFor="split-bill-switch" className="font-semibold flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4"/>{t('pos.payment_dialog.split_bill')}
                        </Label>
                      </div>
                    </div>
                    
                    {useSplitBill && (
                      <div className="space-y-3">
                        {/* Enhanced Split Method Selection */}
                        <div>
                          <Label className="font-semibold text-sm mb-2 block">
                            {t('pos.payment_dialog.enhanced_split_method')}
                          </Label>
                          <RadioGroup 
                            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                            value={enhancedSplitMethod}
                            onValueChange={handleEnhancedSplitMethodChange}
                          >
                            <div>
                              <RadioGroupItem value="simple" id="simple" className="peer sr-only" />
                              <Label
                                htmlFor="simple"
                                className="flex flex-col items-center gap-1 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                              >
                                <span className="font-semibold text-xs">{t('pos.payment_dialog.simple_split')}</span>
                                <span className="text-xs text-muted-foreground text-center">
                                  {t('pos.payment_dialog.simple_split_desc')}
                                </span>
                              </Label>
                            </div>
                            
                            
                            
                            <div>
                              <RadioGroupItem value="item_assignment" id="item_assignment" className="peer sr-only" />
                              <Label
                                htmlFor="item_assignment"
                                className="flex flex-col items-center gap-1 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                              >
                                <span className="font-semibold text-xs">{t('pos.payment_dialog.item_assignment')}</span>
                                <span className="text-xs text-muted-foreground text-center">
                                  {t('pos.payment_dialog.item_assignment_desc')}
                                </span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                                            
                        {/* Split Method Content */}
                        {enhancedSplitMethod === 'simple' && (
                          <div className="bg-muted/30 rounded-md p-2">
                            <SimplifiedSplitBillSelector
                              orderItems={orderItems}
                              subtotal={subtotal}
                              tax={tax}
                              tip={0}
                              paymentMethods={paymentMethods}
                              onConfigChange={handleSplitConfigChange}
                              initialMethod="equal"
                            />
                          </div>
                        )}
                                            

                                            
                        {enhancedSplitMethod === 'item_assignment' && (
                          <div className="bg-muted/30 rounded-md p-2">
                            <CustomerItemAssignment
                              orderItems={orderItems}
                              subtotal={subtotal}
                              tax={tax}
                              tip={0}
                              paymentMethods={paymentMethods}
                              onConfigChange={handleEnhancedSplitConfigChange}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 sm:p-4 pt-0 border-t bg-background flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
          <div className="text-lg font-bold">
            {t('pos.payment_dialog.total_due')}: 
            <span className="text-primary ml-2">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              {t('dialog.cancel')}
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!canConfirm() || isProcessing}
              className="min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                t('pos.payment_dialog.confirm')
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}