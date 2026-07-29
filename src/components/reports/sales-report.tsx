
"use client"

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useI18nStore } from '@/lib/stores/i18n-store';

interface SalesReportProps {
  data: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    dailySales: { date: string; total: number }[];
  } | null;
  loading: boolean;
}

export function SalesReport({ data, loading }: SalesReportProps) {
  const { t } = useI18nStore();

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]"><p>{t('reports.loading')}</p></div>;
  }

  if (!data || data.totalOrders === 0) {
     return (
        <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
          <p>{t('reports.no_data')}</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('reports.sales.total_revenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${data.totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('reports.sales.total_orders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{data.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('reports.sales.avg_order_value')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${data.avgOrderValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('reports.sales.daily_sales')}</CardTitle>
          <CardDescription>{t('reports.sales.daily_sales_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  formatter={(value) => [`₹${(value as number).toFixed(2)}`, t('reports.sales.revenue')]}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
