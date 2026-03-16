import { NextRequest } from "next/server";
import * as shipmentRepo from "@/lib/db/repositories/shipment-repo";
import * as invoiceRepo from "@/lib/db/repositories/invoice-repo";
import * as conversionLogRepo from "@/lib/db/repositories/conversion-log-repo";
import { getDb } from "@/lib/db/connection";
import { ok, error } from "@/lib/api/response";
import type { DashboardStats } from "@/lib/types";

/**
 * GET /api/dashboard/stats
 * 대시보드 통계 조회
 * query params: date (기본값: 오늘, YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const today = new Date().toISOString().slice(0, 10);
    const date = searchParams.get("date") ?? today;

    // 오늘 통계
    const todayOrders = shipmentRepo.countByDate(date);
    const todayConverted = conversionLogRepo.countByDate(date);
    const todayFailed = conversionLogRepo.unmappedCountByDate(date);
    const todayInvoices = invoiceRepo.countByDate(date);

    // 최근 7일 일별 통계
    const conversionDaily = conversionLogRepo.dailyStats(7);
    const conversionMap = new Map(conversionDaily.map((r) => [r.date, r.converted]));

    const dailyStats: DashboardStats["dailyStats"] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      dailyStats.push({
        date: dateStr,
        orders: shipmentRepo.countByDate(dateStr),
        converted: conversionMap.get(dateStr) ?? 0,
        invoices: invoiceRepo.countByDate(dateStr),
      });
    }

    // 최근 활동: conversion_logs + invoices 병합 후 시간순 정렬, 최근 10건
    const db = getDb();

    const recentLogs = db
      .prepare(
        `SELECT 'conversion' as type, converted_at as time, file_name, chain, unmapped_count
         FROM conversion_logs
         ORDER BY converted_at DESC
         LIMIT 10`
      )
      .all() as {
        type: "conversion";
        time: string;
        file_name: string;
        chain: string;
        unmapped_count: number;
      }[];

    const recentInvoices = db
      .prepare(
        `SELECT 'invoice' as type, issued_at as time, invoice_number
         FROM invoices
         ORDER BY issued_at DESC
         LIMIT 10`
      )
      .all() as {
        type: "invoice";
        time: string;
        invoice_number: string;
      }[];

    const recentActivity: DashboardStats["recentActivity"] = [
      ...recentLogs.map((r) => ({
        time: r.time,
        action: "변환",
        detail: `${r.file_name} (${r.chain})`,
        status: (r.unmapped_count > 0 ? "error" : "success") as "success" | "error" | "info",
      })),
      ...recentInvoices.map((r) => ({
        time: r.time,
        action: "송장발행",
        detail: r.invoice_number,
        status: "success" as const,
      })),
    ]
      .sort((a, b) => (a.time < b.time ? 1 : -1))
      .slice(0, 10);

    const stats: DashboardStats = {
      todayOrders,
      todayConverted,
      todayFailed,
      todayInvoices,
      dailyStats,
      recentActivity,
    };

    return ok(stats);
  } catch (e) {
    console.error("[GET /api/dashboard/stats]", e);
    return error("대시보드 통계 조회 중 오류가 발생했습니다.", 500);
  }
}
