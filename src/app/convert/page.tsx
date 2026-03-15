"use client";

import { useState, useCallback } from "react";
import { Upload, Download, Send, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { parseExcelFile, type ParsedSheet } from "@/lib/excel/parser";
import { identifyChain, getChainLabel, type ChainType } from "@/lib/excel/chain-identifier";
import { transformToEcount } from "@/lib/excel/ecount-transformer";
import { downloadEcountExcel } from "@/lib/excel/ecount-writer";
import { useMappingStore } from "@/stores/mapping-store";
import type { EcountOutputRow } from "@/lib/types";

interface FileResult {
  sheet: ParsedSheet;
  chain: ChainType;
  converted: EcountOutputRow[];
}

export default function ConvertPage() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<FileResult[]>([]);
  const [sending, setSending] = useState(false);
  const addCustomer = useMappingStore((s) => s.addCustomer);
  const addProduct = useMappingStore((s) => s.addProduct);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList).filter(
      (f) =>
        f.name.endsWith(".xlsx") ||
        f.name.endsWith(".xls") ||
        f.name.endsWith(".csv")
    );
    if (newFiles.length === 0) {
      toast.error("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleConvert = async () => {
    const allResults: FileResult[] = [];
    for (const file of files) {
      try {
        const sheets = await parseExcelFile(file);
        for (const sheet of sheets) {
          const chain = identifyChain(sheet);
          const converted = transformToEcount(sheet, chain);
          allResults.push({ sheet, chain, converted });
        }
      } catch {
        toast.error(`${file.name} 파싱 실패`);
      }
    }
    setResults(allResults);
    const totalUnmapped = allResults.reduce(
      (sum, r) => sum + r.converted.filter((c) => c._unmapped).length,
      0
    );
    if (totalUnmapped > 0) {
      toast.warning(`미매핑 ${totalUnmapped}건이 있습니다.`);
    } else {
      toast.success("변환 완료!");
    }
  };

  const handleDownload = () => {
    const allRows = results.flatMap((r) => r.converted);
    downloadEcountExcel(allRows, `이카운트_변환_${new Date().toISOString().slice(0, 10)}`);
    toast.success("엑셀 다운로드 완료");
  };

  const handleMockSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      if (Math.random() < 0.9) {
        toast.success("이카운트 전송 성공!");
      } else {
        toast.error("이카운트 전송 실패. 다시 시도해주세요.");
      }
    }, 2000);
  };

  const handleInlineMapping = (
    resultIdx: number,
    rowIdx: number,
    field: "customerCode" | "itemCode",
    value: string
  ) => {
    setResults((prev) => {
      const next = [...prev];
      const row = { ...next[resultIdx].converted[rowIdx] };
      if (field === "customerCode") {
        row.customerCode = value;
        if (value) {
          row._unmapped =
            !value || !row.itemCode ? true : false;
          row._unmappedField = !row.itemCode ? "product" : undefined;
          addCustomer({
            omsName: row.customerName,
            ecountCode: value,
            ecountName: row.customerName,
            chain: "davichi",
          });
        }
      } else {
        row.itemCode = value;
        if (value) {
          row._unmapped =
            !row.customerCode || !value ? true : false;
          row._unmappedField = !row.customerCode ? "customer" : undefined;
          addProduct({
            omsProductName: row.itemName,
            ecountItemCode: value,
            ecountItemName: row.itemName,
            spec: row.spec,
            unitPrice: row.unitPrice,
            category: "etc",
          });
        }
      }
      if (row.customerCode && row.itemCode) {
        row._unmapped = false;
        row._unmappedField = undefined;
      }
      next[resultIdx] = {
        ...next[resultIdx],
        converted: next[resultIdx].converted.map((r, i) =>
          i === rowIdx ? row : r
        ),
      };
      return next;
    });
  };

  const totalRows = results.reduce((s, r) => s + r.converted.length, 0);
  const unmappedRows = results.reduce(
    (s, r) => s + r.converted.filter((c) => c._unmapped).length,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">엑셀 변환</h1>

      {/* Upload Area */}
      <Card className="bg-white shadow-sm border">
        <CardContent>
          <div
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload className="mb-4 size-12 text-gray-400" />
            <p className="mb-2 text-lg font-medium text-gray-700">
              엑셀 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500">
              .xlsx, .xls 파일 (다중 파일 지원)
            </p>
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                업로드된 파일 ({files.length}개)
              </p>
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    <FileSpreadsheet className="size-3" />
                    {f.name}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConvert}>변환하기</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiles([]);
                    setResults([]);
                  }}
                >
                  초기화
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary">전체 {totalRows}건</Badge>
            {unmappedRows > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="size-3" />
                미매핑 {unmappedRows}건
              </Badge>
            )}
            {results.map((r, i) => (
              <Badge key={i} variant="outline">
                {r.sheet.fileName} - {getChainLabel(r.chain)}
              </Badge>
            ))}
          </div>

          {/* Result Tables */}
          {results.map((result, rIdx) => (
            <Card key={rIdx} className="bg-white shadow-sm border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.sheet.fileName}
                  <Badge variant="outline">
                    {getChainLabel(result.chain)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="converted">
                  <TabsList>
                    <TabsTrigger value="original">원본</TabsTrigger>
                    <TabsTrigger value="converted">변환 결과</TabsTrigger>
                  </TabsList>
                  <TabsContent value="original">
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {result.sheet.headers.map((h) => (
                              <TableHead key={h}>{h}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.sheet.rows.map((row, i) => (
                            <TableRow key={i}>
                              {result.sheet.headers.map((h) => (
                                <TableCell key={h}>
                                  {String(row[h] ?? "")}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="converted">
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>거래처코드</TableHead>
                            <TableHead>거래처명</TableHead>
                            <TableHead>품목코드</TableHead>
                            <TableHead>품명</TableHead>
                            <TableHead>규격</TableHead>
                            <TableHead>수량</TableHead>
                            <TableHead>단가</TableHead>
                            <TableHead>공급가액</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.converted.map((row, i) => (
                            <TableRow
                              key={i}
                              className={
                                row._unmapped ? "bg-red-50" : ""
                              }
                            >
                              <TableCell>
                                {row._unmapped &&
                                (row._unmappedField === "customer" ||
                                  row._unmappedField === "both") ? (
                                  <Input
                                    placeholder="코드 입력"
                                    className="h-7 w-24 text-xs"
                                    defaultValue={row.customerCode}
                                    onBlur={(e) =>
                                      handleInlineMapping(
                                        rIdx,
                                        i,
                                        "customerCode",
                                        e.target.value
                                      )
                                    }
                                  />
                                ) : (
                                  row.customerCode
                                )}
                              </TableCell>
                              <TableCell>{row.customerName}</TableCell>
                              <TableCell>
                                {row._unmapped &&
                                (row._unmappedField === "product" ||
                                  row._unmappedField === "both") ? (
                                  <Input
                                    placeholder="코드 입력"
                                    className="h-7 w-24 text-xs"
                                    defaultValue={row.itemCode}
                                    onBlur={(e) =>
                                      handleInlineMapping(
                                        rIdx,
                                        i,
                                        "itemCode",
                                        e.target.value
                                      )
                                    }
                                  />
                                ) : (
                                  row.itemCode
                                )}
                              </TableCell>
                              <TableCell>{row.itemName}</TableCell>
                              <TableCell>{row.spec}</TableCell>
                              <TableCell>{row.quantity}</TableCell>
                              <TableCell>
                                {row.unitPrice.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {row.supplyAmount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="size-4" />
              이카운트 엑셀 다운로드
            </Button>
            <Button
              onClick={handleMockSend}
              disabled={sending}
              variant="outline"
              className="gap-2"
            >
              <Send className="size-4" />
              {sending ? "전송 중..." : "이카운트 전송"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
