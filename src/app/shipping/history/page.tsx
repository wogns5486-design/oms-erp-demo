"use client";

import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useShippingStore } from "@/stores/shipping-store";
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
  const getAllInvoices = useShippingStore((s) => s.getAllInvoices);
  const reissueInvoice = useShippingStore((s) => s.reissueInvoice);

  const allInvoices = useMemo(() => getAllInvoices(), [getAllInvoices]);

  const filtered = useMemo(() => {
    if (filter === "all") return allInvoices;
    return allInvoices.filter((inv) => inv.status === filter);
  }, [allInvoices, filter]);

  const handleReissue = (shipmentId: string, invoiceNumber: string) => {
    const newNumber = reissueInvoice(shipmentId, invoiceNumber);
    toast.success(`재발행 완료: ${newNumber}`);
  };

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `전체 (${allInvoices.length})` },
    { value: "active", label: `활성 (${allInvoices.filter((i) => i.status === "active").length})` },
    { value: "reissued", label: `재발행 (${allInvoices.filter((i) => i.status === "reissued").length})` },
    { value: "cancelled", label: `취소 (${allInvoices.filter((i) => i.status === "cancelled").length})` },
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
                          handleReissue(inv.shipmentId, inv.invoiceNumber)
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
