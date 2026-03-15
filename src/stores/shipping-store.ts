"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Shipment, InvoiceRecord } from "@/lib/types";

interface ShippingState {
  shipments: Shipment[];
  invoiceSeq: number;
  isReady: boolean;
  initialize: () => Promise<void>;
  reset: () => Promise<void>;
  getByDate: (date: string) => Shipment[];
  getPending: (date: string) => Shipment[];
  issueInvoice: (shipmentId: string, boxes: { boxNumber: number; items: { itemName: string; quantity: number }[] }[]) => string[];
  reissueInvoice: (shipmentId: string, oldInvoiceNumber: string) => string;
  getAllInvoices: () => (InvoiceRecord & { shipmentId: string; recipientName: string; customerName: string })[];
}

const genInvoiceNumber = (seq: number) => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `LOGEN-${dateStr}-${String(seq).padStart(5, "0")}`;
};

export const useShippingStore = create<ShippingState>()(
  persist(
    (set, get) => ({
      shipments: [],
      invoiceSeq: 1,
      isReady: false,

      initialize: async () => {
        if (get().shipments.length > 0) {
          set({ isReady: true });
          return;
        }
        const shipments = await fetch("/data/shipments.json").then((r) => r.json());
        set({ shipments, isReady: true });
      },

      reset: async () => {
        const shipments = await fetch("/data/shipments.json").then((r) => r.json());
        set({ shipments, invoiceSeq: 1, isReady: true });
      },

      getByDate: (date) => get().shipments.filter((s) => s.date === date),

      getPending: (date) =>
        get().shipments.filter((s) => s.date === date && s.status === "pending"),

      issueInvoice: (shipmentId, boxes) => {
        const invoiceNumbers: string[] = [];
        set((s) => {
          let seq = s.invoiceSeq;
          const newInvoices: InvoiceRecord[] = boxes.map((box) => {
            const num = genInvoiceNumber(seq++);
            invoiceNumbers.push(num);
            return {
              invoiceNumber: num,
              status: "active" as const,
              issuedAt: new Date().toISOString(),
              boxNumber: box.boxNumber,
              items: box.items,
            };
          });
          return {
            invoiceSeq: seq,
            shipments: s.shipments.map((sh) =>
              sh.id === shipmentId
                ? { ...sh, status: "invoiced" as const, invoices: [...sh.invoices, ...newInvoices] }
                : sh
            ),
          };
        });
        return invoiceNumbers;
      },

      reissueInvoice: (shipmentId, oldInvoiceNumber) => {
        let newNumber = "";
        set((s) => {
          const seq = s.invoiceSeq;
          newNumber = genInvoiceNumber(seq);
          return {
            invoiceSeq: seq + 1,
            shipments: s.shipments.map((sh) => {
              if (sh.id !== shipmentId) return sh;
              const updatedInvoices = sh.invoices.map((inv) =>
                inv.invoiceNumber === oldInvoiceNumber
                  ? { ...inv, status: "reissued" as const }
                  : inv
              );
              const oldInv = sh.invoices.find((i) => i.invoiceNumber === oldInvoiceNumber);
              if (oldInv) {
                updatedInvoices.push({
                  invoiceNumber: newNumber,
                  status: "active" as const,
                  issuedAt: new Date().toISOString(),
                  boxNumber: oldInv.boxNumber,
                  items: oldInv.items,
                });
              }
              return { ...sh, invoices: updatedInvoices };
            }),
          };
        });
        return newNumber;
      },

      getAllInvoices: () => {
        const result: (InvoiceRecord & { shipmentId: string; recipientName: string; customerName: string })[] = [];
        for (const sh of get().shipments) {
          for (const inv of sh.invoices) {
            result.push({
              ...inv,
              shipmentId: sh.id,
              recipientName: sh.recipientName,
              customerName: sh.customerName,
            });
          }
        }
        return result.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
      },
    }),
    {
      name: "oms-shipping-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        shipments: state.shipments,
        invoiceSeq: state.invoiceSeq,
      }),
    }
  )
);
