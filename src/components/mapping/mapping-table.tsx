"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Plus, AlertTriangle, Download, Edit2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useMappingStore } from "@/stores/mapping-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { CustomerMapping, ProductMapping } from "@/lib/types";

interface MappingTableProps {
  type: "customers" | "products";
}

const PAGE_SIZE = 20;

export function MappingTable({ type }: MappingTableProps) {
  const customers = useMappingStore((s) => s.customers);
  const products = useMappingStore((s) => s.products);
  const addCustomer = useMappingStore((s) => s.addCustomer);
  const updateCustomer = useMappingStore((s) => s.updateCustomer);
  const deleteCustomer = useMappingStore((s) => s.deleteCustomer);
  const addProduct = useMappingStore((s) => s.addProduct);
  const updateProduct = useMappingStore((s) => s.updateProduct);
  const deleteProduct = useMappingStore((s) => s.deleteProduct);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<CustomerMapping | ProductMapping | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkValues, setBulkValues] = useState<Record<string, string>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const items = type === "customers" ? customers : products;

  const filtered = useMemo(() => {
    if (!debouncedSearch) return items;
    const q = debouncedSearch.toLowerCase();
    return items.filter((item) => {
      if (type === "customers") {
        const c = item as CustomerMapping;
        return (
          c.omsName.toLowerCase().includes(q) ||
          c.ecountCode.toLowerCase().includes(q) ||
          c.ecountName.toLowerCase().includes(q)
        );
      } else {
        const p = item as ProductMapping;
        return (
          p.omsProductName.toLowerCase().includes(q) ||
          p.ecountItemCode.toLowerCase().includes(q) ||
          p.ecountItemName.toLowerCase().includes(q)
        );
      }
    });
  }, [items, debouncedSearch, type]);

  const unmappedCount = useMemo(() => {
    if (type === "customers") {
      return customers.filter((c) => !c.ecountCode).length;
    }
    return products.filter((p) => !p.ecountItemCode).length;
  }, [customers, products, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isUnmapped = useCallback(
    (item: CustomerMapping | ProductMapping) => {
      if (type === "customers") return !(item as CustomerMapping).ecountCode;
      return !(item as ProductMapping).ecountItemCode;
    },
    [type]
  );

  const handleDelete = (id: string) => {
    if (type === "customers") deleteCustomer(id);
    else deleteProduct(id);
    toast.success("삭제되었습니다.");
  };

  const handleBulkSave = () => {
    for (const [id, value] of Object.entries(bulkValues)) {
      if (!value) continue;
      if (type === "customers") {
        updateCustomer(id, { ecountCode: value });
      } else {
        updateProduct(id, { ecountItemCode: value });
      }
    }
    setBulkMode(false);
    setBulkValues({});
    toast.success("일괄 수정 완료");
  };

  const handleDownloadErrors = () => {
    const unmapped = items.filter((item) => isUnmapped(item));
    let exportData;
    if (type === "customers") {
      exportData = (unmapped as CustomerMapping[]).map((c) => ({
        OMS명: c.omsName,
        이카운트코드: c.ecountCode || "(미매핑)",
        이카운트명: c.ecountName,
        체인: c.chain,
      }));
    } else {
      exportData = (unmapped as ProductMapping[]).map((p) => ({
        OMS품명: p.omsProductName,
        이카운트코드: p.ecountItemCode || "(미매핑)",
        이카운트명: p.ecountItemName,
        규격: p.spec,
        카테고리: p.category,
      }));
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "미매핑");
    XLSX.writeFile(wb, `미매핑_${type === "customers" ? "거래처" : "품목"}.xlsx`);
    toast.success("오류 목록 다운로드 완료");
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Unmapped Warning */}
      {unmappedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 border border-red-200">
          <AlertTriangle className="size-5" />
          <span className="text-sm font-medium">
            미매핑 {unmappedCount}건이 있습니다.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="검색..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="size-4" />
          추가
        </Button>
        {unmappedCount > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => setBulkMode(!bulkMode)}
              className="gap-1"
            >
              <Edit2 className="size-4" />
              {bulkMode ? "일괄 수정 취소" : "미매핑 일괄 수정"}
            </Button>
            <Button variant="outline" onClick={handleDownloadErrors} className="gap-1">
              <Download className="size-4" />
              오류 목록 다운로드
            </Button>
          </>
        )}
        {bulkMode && (
          <Button onClick={handleBulkSave} className="bg-green-600 hover:bg-green-700 text-white">
            저장
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {type === "customers" ? (
                <>
                  <TableHead>OMS명</TableHead>
                  <TableHead>이카운트 코드</TableHead>
                  <TableHead>이카운트명</TableHead>
                  <TableHead>체인</TableHead>
                  <TableHead className="w-20">작업</TableHead>
                </>
              ) : (
                <>
                  <TableHead>OMS 품명</TableHead>
                  <TableHead>이카운트 코드</TableHead>
                  <TableHead>이카운트 품명</TableHead>
                  <TableHead>규격</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="w-20">작업</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((item) => {
              const unmapped = isUnmapped(item);
              return (
                <TableRow
                  key={item.id}
                  className={unmapped ? "bg-red-50" : ""}
                >
                  {type === "customers" ? (
                    <>
                      <TableCell>
                        {(item as CustomerMapping).omsName}
                      </TableCell>
                      <TableCell>
                        {bulkMode && unmapped ? (
                          <Input
                            className="h-7 w-28 text-xs"
                            placeholder="코드 입력"
                            value={bulkValues[item.id] ?? ""}
                            onChange={(e) =>
                              setBulkValues((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          (item as CustomerMapping).ecountCode || (
                            <Badge variant="destructive">미매핑</Badge>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        {(item as CustomerMapping).ecountName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(item as CustomerMapping).chain === "davichi"
                            ? "다비치"
                            : "안경매니저"}
                        </Badge>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        {(item as ProductMapping).omsProductName}
                      </TableCell>
                      <TableCell>
                        {bulkMode && unmapped ? (
                          <Input
                            className="h-7 w-28 text-xs"
                            placeholder="코드 입력"
                            value={bulkValues[item.id] ?? ""}
                            onChange={(e) =>
                              setBulkValues((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          (item as ProductMapping).ecountItemCode || (
                            <Badge variant="destructive">미매핑</Badge>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        {(item as ProductMapping).ecountItemName}
                      </TableCell>
                      <TableCell>{(item as ProductMapping).spec}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(item as ProductMapping).category}
                        </Badge>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm hover:bg-gray-100"
                      >
                        ...
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditItem(item)}>
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={type === "customers" ? 5 : 6}
                  className="text-center text-gray-500 py-8"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          전체 {filtered.length}건 중 {(page - 1) * PAGE_SIZE + 1}-
          {Math.min(page * PAGE_SIZE, filtered.length)}건
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            이전
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(
              1,
              Math.min(page - 2, totalPages - 4)
            );
            const n = start + i;
            if (n > totalPages) return null;
            return (
              <Button
                key={n}
                variant={n === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            다음
          </Button>
        </div>
      </div>

      {/* Add Dialog */}
      <AddEditDialog
        type={type}
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => {
          if (type === "customers") {
            addCustomer(data as Omit<CustomerMapping, "id" | "createdAt" | "updatedAt">);
          } else {
            addProduct(data as Omit<ProductMapping, "id" | "createdAt" | "updatedAt">);
          }
          setAddOpen(false);
          toast.success("추가되었습니다.");
        }}
      />

      {/* Edit Dialog */}
      {editItem && (
        <AddEditDialog
          type={type}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          initialData={editItem}
          onSave={(data) => {
            if (type === "customers") {
              updateCustomer(editItem.id, data as Partial<CustomerMapping>);
            } else {
              updateProduct(editItem.id, data as Partial<ProductMapping>);
            }
            setEditItem(null);
            toast.success("수정되었습니다.");
          }}
        />
      )}
    </div>
  );
}

function AddEditDialog({
  type,
  open,
  onOpenChange,
  initialData,
  onSave,
}: {
  type: "customers" | "products";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CustomerMapping | ProductMapping | null;
  onSave: (data: Record<string, string | number>) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && initialData) {
      setForm(
        Object.fromEntries(
          Object.entries(initialData).map(([k, v]) => [k, String(v)])
        )
      );
    } else if (open) {
      setForm({});
    }
  }, [open, initialData]);

  const fields =
    type === "customers"
      ? [
          { key: "omsName", label: "OMS명" },
          { key: "ecountCode", label: "이카운트 코드" },
          { key: "ecountName", label: "이카운트명" },
          { key: "chain", label: "체인 (davichi/manager)" },
        ]
      : [
          { key: "omsProductName", label: "OMS 품명" },
          { key: "ecountItemCode", label: "이카운트 코드" },
          { key: "ecountItemName", label: "이카운트 품명" },
          { key: "spec", label: "규격" },
          { key: "unitPrice", label: "단가" },
          { key: "category", label: "카테고리" },
        ];

  const handleSubmit = () => {
    const data: Record<string, string | number> = { ...form };
    if (type === "products" && form.unitPrice) {
      data.unitPrice = Number(form.unitPrice);
    }
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "수정" : "추가"} -{" "}
            {type === "customers" ? "거래처" : "품목"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium text-gray-700">
                {f.label}
              </label>
              <Input
                value={form[f.key] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            취소
          </DialogClose>
          <Button onClick={handleSubmit}>
            {initialData ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
