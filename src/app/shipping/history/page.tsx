"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

type StatusFilter = "all" | "active" | "reissued" | "cancelled";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: string;
  shipmentId: string;
  recipientName: string;
  customerName: string;
  boxNumber: number;
  issuedAt: string;
}

const statusLabels: Record<string, string> = {
  active: "활성",
  reissued: "재발행",
  cancelled: "취소",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  reissued: "secondary",
  cancelled: "destructive",
};

export default function ShippingHistoryPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [allInvoices, setAllInvoices] = useState<InvoiceRow[]>([]);

  const fetchInvoices = useCallback(async (status?: string) => {
    try {
      const params = new URLSearchParams({ size: "200" });
      if (status && status !== "all") params.set("status", status);
      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      setAllInvoices(data.data ?? []);
    } catch {
      toast.error("송장 목록 조회 실패");
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered =
    filter === "all"
      ? allInvoices
      : allInvoices.filter((inv) => inv.status === filter);

  const handleReissue = async (id: string, shipmentId: string, invoiceNumber: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/reissue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId, invoiceNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "재발행 실패");
        return;
      }
      toast.success(`재발행 완료: ${data.data.newInvoiceNumber}`);
      await fetchInvoices();
    } catch {
      toast.error("재발행 실패");
    }
  };

  const countByStatus = (s: string) => allInvoices.filter((i) => i.status === s).length;

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `전체 (${allInvoices.length})` },
    { value: "active", label: `활성 (${countByStatus("active")})` },
    { value: "reissued", label: `재발행 (${countByStatus("reissued")})` },
    { value: "cancelled", label: `취소 (${countByStatus("cancelled")})` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">발행 이력</h1>

      {/* Filter */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card className="bg-white shadow-sm border">
        <CardHeader>
          <CardTitle>송장 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>송장번호</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>수령인</TableHead>
                <TableHead>거래처</TableHead>
                <TableHead>박스번호</TableHead>
                <TableHead>발행일</TableHead>
                <TableHead className="w-24">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={`${inv.shipmentId}-${inv.invoiceNumber}`}>
                  <TableCell className="font-mono text-sm">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[inv.status] ?? "outline"}>
                      {statusLabels[inv.status] ?? inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inv.recipientName}</TableCell>
                  <TableCell>{inv.customerName}</TableCell>
                  <TableCell>Box #{inv.boxNumber}</TableCell>
                  <TableCell>
                    {format(new Date(inv.issuedAt), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell>
                    {inv.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() =>
                          handleReissue(inv.id, inv.shipmentId, inv.invoiceNumber)
                        }
                      >
                        <RefreshCw className="size-3" />
                        재발행
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-gray-500"
                  >
                    {allInvoices.length === 0
                      ? "발행된 송장이 없습니다. 송장 발행 페이지에서 발행해주세요."
                      : "해당 상태의 송장이 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
