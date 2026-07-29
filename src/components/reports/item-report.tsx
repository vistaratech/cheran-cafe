"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18nStore } from '@/lib/stores/i18n-store';

interface ItemSale {
  name: string;
  quantity: number;
  revenue: number;
}

interface ItemReportProps {
  data: {
    bestSelling: ItemSale[];
    leastSelling: ItemSale[];
  } | null;
  loading: boolean;
}

export function ItemReport({ data, loading }: ItemReportProps) {
  const { t } = useI18nStore();

  const renderTable = (items: ItemSale[] | undefined, title: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.items.table.item')}</TableHead>
                  <TableHead className="text-right">{t('reports.items.table.quantity_sold')}</TableHead>
                  <TableHead className="text-right">{t('reports.items.table.total_revenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-semibold">₹{item.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground">{t('reports.no_data')}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]"><p>{t('reports.loading')}</p></div>;
  }
  
  if (!data) {
     return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <p>{t('reports.no_data')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {renderTable(data.bestSelling, t('reports.items.best_selling'))}
      {renderTable(data.leastSelling, t('reports.items.least_selling'))}
    </div>
  );
}