"use client"
import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Payment } from "@/lib/types"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { usePaymentsStore } from '@/lib/stores/payments-store'
import { PlusCircle, Trash2 } from 'lucide-react'

export function PaymentMethodDialog({ 
  children, 
  method,
  onSave,
}: { 
  children: React.ReactNode, 
  method?: Payment,
  onSave: (method: Payment | Omit<Payment, 'id'>) => void,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isEditMode = !!method;
  const { t } = useI18nStore();
  const paymentsStore = usePaymentsStore();
  
  // Form state from store
  const formName = paymentsStore.getFormName();
  const formType = paymentsStore.getFormType();
  const formBanks = paymentsStore.getFormBanks();
  const formNewBank = paymentsStore.getFormNewBank();
  
  // Reset form when dialog opens/closes or method changes - exclude store from dependencies to prevent infinite loops
  useEffect(() => {
    if (isOpen) {
      paymentsStore.resetForm(method);
    } else {
      paymentsStore.clearForm();
    }
  }, [isOpen, method]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!paymentsStore.getIsFormValid()) {
      return;
    }
    
    const methodData = {
      name: formName,
      type: formType,
      enabled: true,
      banks: formType === 'bank_transfer' ? formBanks : [],
      restaurantId: method?.restaurantId || ''
    };

    onSave(methodData);
    paymentsStore.clearForm();
    setIsOpen(false);
  };

  const handleAddBank = () => {
    paymentsStore.addBank(formNewBank);
  };

  const handleDeleteBank = (bankToDelete: string) => {
    paymentsStore.deleteBank(bankToDelete);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode 
              ? t('restaurant.payment_method_dialog.edit_title') 
              : t('restaurant.payment_method_dialog.add_title')
            }
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? t('restaurant.payment_method_dialog.edit_desc') 
              : t('restaurant.payment_method_dialog.add_desc')
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('restaurant.payment_method_dialog.name')}</Label>
              <Input 
                id="name" 
                value={formName} 
                onChange={(e) => paymentsStore.setFormName(e.target.value)}
                placeholder={t('restaurant.payment_method_dialog.name_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t('restaurant.payment_method_dialog.type')}</Label>
              <Select value={formType} onValueChange={(value: any) => paymentsStore.setFormType(value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder={t('restaurant.payment_method_dialog.select_type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('restaurant.payment_methods.types.cash')}</SelectItem>
                  <SelectItem value="card">{t('restaurant.payment_methods.types.card')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('restaurant.payment_methods.types.bank_transfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formType === 'bank_transfer' && (
              <div className="space-y-2">
                  <Label>{t('restaurant.payment_method_dialog.banks')}</Label>
                  <div className="space-y-2">
                      {formBanks.map(bank => (
                          <div key={bank} className="flex items-center gap-2">
                              <Input value={bank} readOnly className="flex-1"/>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => handleDeleteBank(bank)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                      ))}
                      <div className="flex items-center gap-2">
                          <Input 
                              placeholder={t('restaurant.payment_method_dialog.add_bank')}
                              value={formNewBank}
                              onChange={(e) => paymentsStore.setFormNewBank(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddBank()}
                          />
                           <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleAddBank}>
                              <PlusCircle className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>
              </div>
            )}

          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('dialog.cancel')}</Button>
          <Button type="submit" onClick={handleSubmit}>
            {isEditMode ? t('dialog.save') : t('dialog.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}