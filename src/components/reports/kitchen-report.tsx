"use client"

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { Badge } from '@/components/ui/badge';

interface PerformanceData {
  avgPrepTime: number;
  mostDelayed: { name: string; avgTime: number }[];
}

interface KitchenReportProps {
  data: PerformanceData | null;
  loading: boolean;
}

export function KitchenReport({ data, loading }: KitchenReportProps) {
  const { t } = useI18nStore();

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

  const formatTime = (minutes: number) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    return `${Math.round(minutes)}m`;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('reports.kitchen.avg_prep_time')}</CardTitle>
          <CardDescription>{t('reports.kitchen.avg_prep_time_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatTime(data.avgPrepTime)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('reports.kitchen.most_delayed')}</CardTitle>
          <CardDescription>{t('reports.kitchen.most_delayed_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.mostDelayed && data.mostDelayed.length > 0 ? (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('reports.kitchen.table.item')}</TableHead>
                            <TableHead className="text-right">{t('reports.kitchen.table.avg_time')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.mostDelayed.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="destructive">{formatTime(item.avgTime)}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">{t('reports.no_data')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}