'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useI18nStore } from '@/lib/stores/i18n-store';
import { type SplitConfig, type EqualSplitConfig, type CustomAmountSplitConfig, ConsolidatedSplitBillCalculator } from '@/lib/consolidated-split-bill-calculator';
import { CreditCard, Landmark, DollarSign } from 'lucide-react';

interface SimplifiedSplitBillSelectorProps {
  orderItems: any[];
  subtotal: number;
  tax: number;
  tip: number;
  paymentMethods: any[];
  onConfigChange: (config: SplitConfig | null) => void;
  initialMethod?: 'equal' | 'custom_amount';
}

export function SimplifiedSplitBillSelector({
  orderItems,
  subtotal,
  tax,
  tip,
  paymentMethods,
  onConfigChange,
  initialMethod = 'equal'
}: SimplifiedSplitBillSelectorProps) {
  const { t } = useI18nStore();
  const [selectedMethod, setSelectedMethod] = useState<'equal' | 'custom_amount'>(initialMethod);
  const [config, setConfig] = useState<SplitConfig>(getDefaultConfig(initialMethod));

  
  const calculator = new ConsolidatedSplitBillCalculator(orderItems, subtotal, tax, tip);
  const result = calculator.calculate(config);

  useEffect(() => {
    onConfigChange(result.isValid ? config : null);
  }, [config, result.isValid]);

  function getDefaultConfig(method: 'equal' | 'custom_amount'): SplitConfig {
    switch (method) {
      case 'equal':
        return {
          method: 'equal',
          numberOfPeople: 2,
          includeTaxTips: true
        };
      case 'custom_amount':
        return {
          method: 'custom_amount',
          allocations: [{ personId: 'person_1', personName: '', amount: 0 }],
          includeTaxTips: true
        };
    }
  }

  const updateConfig = (newConfig: SplitConfig) => {
    setConfig(newConfig);
  };

  const getIconForMethod = (type: string) => {
    switch (type) {
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Landmark className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };



  // Pass config to parent
  useEffect(() => {
    onConfigChange(result.isValid ? config : null);
  }, [config, result.isValid, onConfigChange]);

  return (
    <div className="space-y-6">
      <RadioGroup 
        value={selectedMethod} 
        onValueChange={(value: 'equal' | 'custom_amount') => {
          setSelectedMethod(value);
          const newConfig = getDefaultConfig(value);
          setConfig(newConfig);
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <RadioGroupItem value="equal" id="equal" className="peer sr-only" />
          <Label
            htmlFor="equal"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold">{t('pos.payment_dialog.equal_split')}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t('pos.payment_dialog.equal_description')}
            </p>
          </Label>
        </div>

        <div>
          <RadioGroupItem value="custom_amount" id="custom_amount" className="peer sr-only" />
          <Label
            htmlFor="custom_amount"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="font-semibold">{t('pos.payment_dialog.custom_amount')}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t('pos.payment_dialog.custom_amount_description')}
            </p>
          </Label>
        </div>
      </RadioGroup>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{t('pos.payment_dialog.configure_split')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedMethod === 'equal' && (
            <EqualSplitConfigurator 
              config={config as EqualSplitConfig}
              onUpdate={updateConfig}
              totalAmount={subtotal}
              tax={tax}
              tip={tip}
            />
          )}
          
          {selectedMethod === 'custom_amount' && (
            <CustomAmountConfigurator 
              config={config as CustomAmountSplitConfig}
              onUpdate={updateConfig}
              totalAmount={subtotal}
              tax={tax}
              tip={tip}
            />
          )}
        </CardContent>
      </Card>

      {!result.isValid && result.errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <p className="text-sm text-destructive">{result.errorMessage}</p>
        </div>
      )}

      {result.isValid && (
        <Card>
          <CardHeader>
            <CardTitle>{t('pos.payment_dialog.split_summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.results.map((split, index) => (
                <div key={split.personId} className="space-y-2 p-3 bg-muted rounded border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{split.personName}:</span>
                    <span className="font-bold">${split.amount.toFixed(2)}</span>
                  </div>
                  

                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t('pos.payment_dialog.total')}:</span>
                <span>${result.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EqualSplitConfigurator({ 
  config, 
  onUpdate,
  totalAmount,
  tax,
  tip
}: { 
  config: EqualSplitConfig; 
  onUpdate: (config: SplitConfig) => void;
  totalAmount: number;
  tax: number;
  tip: number;
}) {
  const { t } = useI18nStore();
  const calculator = new ConsolidatedSplitBillCalculator([], totalAmount, tax, tip);
  const result = calculator.calculate(config);
  
  const handleNumberOfPeopleChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1 || numValue > 50) return;
    
    onUpdate({
      ...config,
      numberOfPeople: numValue
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="num-people">Number of People</Label>
          <Input
            id="num-people"
            type="number"
            min="1"
            max="50"
            value={config.numberOfPeople}
            onChange={(e) => handleNumberOfPeopleChange(e.target.value)}
            className={config.numberOfPeople <= 0 || config.numberOfPeople > 50 ? 'border-red-500' : ''}
          />
          {(config.numberOfPeople <= 0 || config.numberOfPeople > 50) && (
            <p className="text-sm text-red-500 mt-1">
              Must be between 1 and 50 people
            </p>
          )}
        </div>
        <div>
          <Label>Include Tax & Tips</Label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="include-tax-tips"
              checked={config.includeTaxTips}
              onChange={(e) => onUpdate({
                ...config,
                includeTaxTips: e.target.checked
              })}
              className="h-4 w-4"
            />
            <Label htmlFor="include-tax-tips" className="font-normal">
              Split tax and tips proportionally
            </Label>
          </div>
        </div>
      </div>
      
      {result.isValid && (
        <div className="bg-muted/50 p-3 rounded-md">
          <h4 className="font-medium mb-2">Split Preview</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Per person amount:</span>
              <span className="font-semibold">₹{(result.totalAmount / config.numberOfPeople).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total (including tax/tips):</span>
              <span className="font-semibold">₹{result.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomAmountConfigurator({ 
  config, 
  onUpdate,
  totalAmount,
  tax,
  tip
}: { 
  config: CustomAmountSplitConfig; 
  onUpdate: (config: SplitConfig) => void;
  totalAmount: number;
  tax: number;
  tip: number;
}) {
  const { t } = useI18nStore();
  const calculator = new ConsolidatedSplitBillCalculator([], totalAmount, tax, tip);
  const result = calculator.calculate(config);
  
  // Auto-update person names when allocations change
  useEffect(() => {
    const updatedAllocations = config.allocations.map((allocation, index) => ({
      ...allocation,
      personName: allocation.personName || `Person ${index + 1}`
    }));
    
    // Only update if names actually changed
    if (JSON.stringify(config.allocations) !== JSON.stringify(updatedAllocations)) {
      onUpdate({
        ...config,
        allocations: updatedAllocations
      });
    }
  }, [config.allocations]);
  
  const addPerson = () => {
    const personIndex = config.allocations.length + 1;
    onUpdate({
      ...config,
      allocations: [...config.allocations, { personId: `person_${personIndex}`, personName: `Person ${personIndex}`, amount: 0 }]
    });
  };

  const removePerson = (index: number) => {
    if (config.allocations.length <= 1) return;
    onUpdate({
      ...config,
      allocations: config.allocations.filter((_, i) => i !== index)
    });
  };

  const updatePerson = (index: number, field: 'personName' | 'amount', value: string | number) => {
    if (field === 'personName') {
      // Validate name length
      if (typeof value === 'string' && value.length > 50) return;
    } else if (field === 'amount') {
      // Validate amount
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue < 0 || numValue > 10000) return;
      
      // Ensure we store the numeric value, not the string
      value = numValue;
    }
    
    onUpdate({
      ...config,
      allocations: config.allocations.map((alloc, i) => 
        i === index 
          ? { ...alloc, [field]: value }
          : alloc
      )
    });
  };

  const totalAllocated = config.allocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
  const expectedTotal = config.includeTaxTips ? totalAmount + tax + tip : totalAmount;
  const difference = Math.abs(totalAllocated - expectedTotal);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>People and Amounts</Label>
        <Button onClick={addPerson} variant="outline" size="sm">
          Add Person
        </Button>
      </div>
      
      <div className="space-y-3">
        {config.allocations.map((allocation, index) => (
          <div key={index} className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Person Name</Label>
              <Input
                value={allocation.personName}
                onChange={(e) => updatePerson(index, 'personName', e.target.value)}
                placeholder={`Person ${index + 1} (optional)`}
                className={(allocation.personName || '').length > 50 ? 'border-red-500' : ''}
              />
              {(allocation.personName || '').length > 50 && (
                <p className="text-xs text-red-500 mt-1">
                  Name too long (max 50 characters)
                </p>
              )}
            </div>
            <div className="flex-1">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10000"
                value={allocation.amount || ''}
                onChange={(e) => updatePerson(index, 'amount', e.target.value)}
                placeholder="0.00"
                className={allocation.amount < 0 || allocation.amount > 10000 ? 'border-red-500' : ''}
              />
              {(allocation.amount < 0 || allocation.amount > 10000) && (
                <p className="text-xs text-red-500 mt-1">
                  Amount must be between ₹0 and ₹10,000
                </p>
              )}
            </div>
            {config.allocations.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => removePerson(index)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="custom-include-tax-tips"
          checked={config.includeTaxTips}
          onChange={(e) => onUpdate({
            ...config,
            includeTaxTips: e.target.checked
          })}
          className="h-4 w-4"
        />
        <Label htmlFor="custom-include-tax-tips" className="font-normal">
          Include tax and tips in custom amounts
        </Label>
      </div>

      <div className="bg-muted/50 p-3 rounded-md">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Total allocated:</span>
            <span className={`font-semibold ${Math.abs(difference) > 0.01 ? 'text-orange-600' : 'text-green-600'}`}>
              ₹{totalAllocated.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Bill total:</span>
            <span className="font-semibold">₹{expectedTotal.toFixed(2)}</span>
          </div>
          {Math.abs(difference) > 0.01 && (
            <div className="flex justify-between text-orange-600">
              <span>Difference:</span>
              <span className="font-semibold">₹{difference.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}