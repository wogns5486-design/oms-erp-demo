"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settings-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SettingsPage() {
  const boxStandards = useSettingsStore((s) => s.boxStandards);
  const updateStandard = useSettingsStore((s) => s.updateStandard);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const handleSave = (id: string) => {
    const val = editValues[id];
    if (val === undefined) return;
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      toast.error("유효한 숫자를 입력해주세요.");
      return;
    }
    updateStandard(id, num);
    setEditValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.success("포장 기준이 수정되었습니다.");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">포장 설정</h1>

      <Card className="bg-white shadow-sm border">
        <CardHeader>
          <CardTitle>박스 포장 기준값</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>품목코드</TableHead>
                <TableHead>품명</TableHead>
                <TableHead>최대 수량 (개/박스)</TableHead>
                <TableHead className="w-24">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boxStandards.map((std) => {
                const isEditing = editValues[std.id] !== undefined;
                return (
                  <TableRow key={std.id}>
                    <TableCell>
                      <Badge variant="outline">{std.category}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {std.itemCode}
                    </TableCell>
                    <TableCell>{std.itemName}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={
                          isEditing
                            ? editValues[std.id]
                            : String(std.maxPerBox)
                        }
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            [std.id]: e.target.value,
                          }))
                        }
                        min={1}
                      />
                    </TableCell>
                    <TableCell>
                      {isEditing && (
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleSave(std.id)}
                        >
                          <Save className="size-3" />
                          저장
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
