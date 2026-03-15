"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useDashboardStore } from "@/stores/dashboard-store";
import {
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Truck,
  ArrowRight,
  Link2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const DailyChart = dynamic(() => import("@/components/dashboard/daily-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-80 animate-pulse rounded-lg bg-gray-200" />
  ),
});

const kpiConfig = [
  {
    key: "todayOrders" as const,
    label: "오늘 주문",
    icon: FileSpreadsheet,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "todayConverted" as const,
    label: "변환 성공",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    key: "todayFailed" as const,
    label: "변환 실패",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    key: "todayInvoices" as const,
    label: "송장 발행",
    icon: Truck,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const statusColor: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

export default function DashboardPage() {
  const stats = useDashboardStore((s) => s.stats);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiConfig.map((kpi) => (
          <Card key={kpi.key} className="bg-white shadow-sm border">
            <CardContent className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${kpi.bg}`}>
                <kpi.icon className={`size-6 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats[kpi.key].toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Chart */}
      <Card className="bg-white shadow-sm border">
        <CardHeader>
          <CardTitle>일별 처리량</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyChart data={stats.dailyStats} />
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((act, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0"
                >
                  <Badge
                    className={`mt-0.5 shrink-0 text-xs ${
                      statusColor[act.status] ?? ""
                    }`}
                  >
                    {act.action}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">{act.detail}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(act.time), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">빠른 액션</h2>
          <div className="grid gap-4">
            {[
              {
                href: "/convert",
                title: "엑셀 변환하기",
                desc: "OMS 엑셀을 이카운트 형식으로 변환",
                icon: FileSpreadsheet,
                color: "text-blue-600",
              },
              {
                href: "/mapping",
                title: "매핑 관리",
                desc: "거래처/품목 매핑 확인 및 수정",
                icon: Link2,
                color: "text-green-600",
              },
              {
                href: "/shipping/issue",
                title: "송장 발행",
                desc: "출고 건에 대한 송장 일괄 발행",
                icon: Truck,
                color: "text-purple-600",
              },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4">
                    <action.icon className={`size-8 ${action.color}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-500">{action.desc}</p>
                    </div>
                    <ArrowRight className="size-5 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
