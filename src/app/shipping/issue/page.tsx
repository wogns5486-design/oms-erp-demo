"use client";

import { useState, useMemo } from "react";
import { Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { useShippingStore } from "@/stores/shipping-store";
import { useSettingsStore } from "@/stores/settings-store";
import { splitBoxes } from "@/lib/shipping/box-splitter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BoxSplitResult } from "@/lib/types";

export default function ShippingIssuePage() {
  const [date, setDate] = useState("2026-03-16");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<BoxSplitResult[]>([]);

  const getByDate = useShippingStore((s) => s.getByDate);
  const issueInvoice = useShippingStore((s) => s.issueInvoice);
  const boxStandards = useSettingsStore((s) => s.boxStandards);

  const shipments = useMemo(() => getByDate(date), [getByDate, date]);
  const pending = useMemo(
    () => shipments.filter((s) => s.status === "pending"),
    [shipments]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((s) => s.id)));
    }
  };

  const estimateBoxes = (items: { quantity: number; category: string }[]) => {
    let total = 0;
    const catMap = new Map<string, number>();
    for (const item of items) {
      const cat = item.category || "etc";
      catMap.set(cat, (catMap.get(cat) || 0) + item.quantity);
    }
    for (const [cat, qty] of catMap) {
      const std = boxStandards.find((s) => s.category === cat);
      const max = std?.maxPerBox ?? 20;
      total += Math.ceil(qty / max);
    }
    return total;
  };

  const handlePreview = () => {
    const results: BoxSplitResult[] = [];
    for (const id of selected) {
      const shipment = pending.find((s) => s.id === id);
      if (!shipment) continue;
      results.push(
        splitBoxes({
          recipientName: shipment.recipientName,
          items: shipment.items.map((i) => ({ ...i })),
          boxStandards,
        })
      );
    }
    setPreview(results);
  };

  const handleIssue = () => {
    let totalInvoices = 0;
    for (const id of selected) {
      const shipment = pending.find((s) => s.id === id);
      if (!shipment) continue;
      const result = splitBoxes({
        recipientName: shipment.recipientName,
        items: shipment.items.map((i) => ({ ...i })),
        boxStandards,
      });
      const invoices = issueInvoice(
        id,
        result.boxes.map((b) => ({
          boxNumber: b.boxNumber,
          items: b.items.map((i) => ({
            itemName: i.itemName,
            quantity: i.quantity,
          })),
        }))
      );
      totalInvoices += invoices.length;
    }
    toast.success(`송장 ${totalInvoices}건 발행 완료!`);
    setSelected(new Set());
    setPreview([]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">송장 발행</h1>

      {/* Date Picker */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">출고일자</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelected(new Set());
            setPreview([]);
          }}
          className="w-44"
        />
        <Badge variant="secondary">
          출고 {pending.length}건 / 전체 {shipments.length}건
        </Badge>
      </div>

      {/* Shipments Table */}
      <Card className="bg-white shadow-sm border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>출고 목록</span>
            <div className="flex gap-2">
              {selected.size > 0 && (
                <>
                  <Button variant="outline" onClick={handlePreview} className="gap-1">
                    <Package className="size-4" />
                    박스 분할 미리보기
                  </Button>
                  <Button onClick={handleIssue} className="gap-1">
                    <Truck className="size-4" />
                    송장 일괄 발행 ({selected.size}건)
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      pending.length > 0 && selected.size === pending.length
                    }
                    onChange={toggleAll}
                    className="size-4 rounded"
                  />
                </TableHead>
                <TableHead>수령인</TableHead>
                <TableHead>거래처</TableHead>
                <TableHead>품목</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>예상 박스 수</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((s) => {
                const isPending = s.status === "pending";
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      {isPending && (
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="size-4 rounded"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {s.recipientName}
                    </TableCell>
                    <TableCell>{s.customerName}</TableCell>
                    <TableCell>
                      {s.items.map((i) => i.itemName).join(", ")}
                    </TableCell>
                    <TableCell>
                      {s.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {estimateBoxes(s.items)}박스
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isPending ? "secondary" : "default"}
                      >
                        {s.status === "pending"
                          ? "대기"
                          : s.status === "invoiced"
                          ? "발행완료"
                          : s.status === "shipped"
                          ? "배송중"
                          : "취소"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {shipments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-gray-500"
                  >
                    해당 날짜의 출고 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Box Split Preview */}
      {preview.length > 0 && (
        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle>박스 분할 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {preview.map((result, rIdx) => (
                <div key={rIdx} className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    {result.recipientName}{" "}
                    <Badge variant="secondary">{result.totalBoxes}박스</Badge>
                  </h3>
                  {result.boxes.map((box) => (
                    <div
                      key={box.boxNumber}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        Box #{box.boxNumber}
                      </p>
                      <ul className="space-y-1">
                        {box.items.map((item, ii) => (
                          <li
                            key={ii}
                            className="flex justify-between text-sm text-gray-600"
                          >
                            <span>{item.itemName}</span>
                            <span className="font-medium">
                              {item.quantity}개
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
