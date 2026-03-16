"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Link2,
  Truck,
  History,
  Package,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const menuItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/convert", label: "엑셀 변환", icon: FileSpreadsheet },
  { href: "/mapping", label: "매핑 관리", icon: Link2 },
  { href: "/shipping/issue", label: "송장 발행", icon: Truck },
  { href: "/shipping/history", label: "발행 이력", icon: History },
  { href: "/settings", label: "포장 설정", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("데이터가 초기화되었습니다.");
      setResetOpen(false);
      window.location.reload();
    } catch {
      toast.error("초기화 중 오류가 발생했습니다.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-14 items-center gap-2 border-b border-gray-700 px-4">
        <Package className="size-6 text-blue-400" />
        <span className="text-lg font-bold">OMS-ERP 자동화</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-700 p-3">
        <Button
          variant="outline"
          className="w-full border-gray-600 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw className="size-4" />
          데모 데이터 초기화
        </Button>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>데모 데이터 초기화</DialogTitle>
            <DialogDescription>
              모든 데이터가 초기 상태로 되돌아갑니다. 이 작업은 되돌릴 수
              없습니다. 계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              취소
            </DialogClose>
            <Button
              onClick={handleReset}
              disabled={resetting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {resetting ? "초기화 중..." : "초기화"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
