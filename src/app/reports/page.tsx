"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { SalesReport } from "@/components/reports/sales-report";
import { ItemReport } from "@/components/reports/item-report";
import { KitchenReport } from "@/components/reports/kitchen-report";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { useReportsStore } from '@/lib/stores/reports-store';
import { type DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { File } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { t } = useI18nStore();

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const reportsStore = useReportsStore();
  const sales = reportsStore.getSalesReport();
  const items = reportsStore.getItemsReport();
  const kitchen = reportsStore.getKitchenReport();
  const { loading, fetchReports } = reportsStore;

  // Fetch reports when date range changes
  useEffect(() => {
    fetchReports(date);
  }, [date]);

  const handleExport = () => {
    // This is a mock export. In a real app, this would trigger a download.
    toast.info(t('reports.toast.export_title'), {
      description: t('reports.toast.export_desc'),
      duration: 3000,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline font-bold">{t('reports.title')}</h1>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <DateRangePicker date={date} onDateChange={setDate} className="w-full sm:w-auto" />
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <File className="mr-2 h-4 w-4" />
            {t('reports.export')}
          </Button>
        </div>
      </div>
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">{t('reports.tabs.sales')}</TabsTrigger>
          <TabsTrigger value="items">{t('reports.tabs.items')}</TabsTrigger>
          <TabsTrigger value="kitchen">{t('reports.tabs.kitchen')}</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <SalesReport data={sales} loading={loading} />
        </TabsContent>
        <TabsContent value="items">
          <ItemReport data={items} loading={loading} />
        </TabsContent>
        <TabsContent value="kitchen">
          <KitchenReport data={kitchen} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}