"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MappingTable } from "@/components/mapping/mapping-table";

export default function MappingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">매핑 관리</h1>
      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">거래처 매핑</TabsTrigger>
          <TabsTrigger value="products">품목 매핑</TabsTrigger>
        </TabsList>
        <TabsContent value="customers">
          <MappingTable type="customers" />
        </TabsContent>
        <TabsContent value="products">
          <MappingTable type="products" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
