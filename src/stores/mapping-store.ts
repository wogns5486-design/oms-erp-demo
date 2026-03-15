"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CustomerMapping, ProductMapping } from "@/lib/types";

interface MappingState {
  customers: CustomerMapping[];
  products: ProductMapping[];
  isReady: boolean;
  initialize: () => Promise<void>;
  reset: () => Promise<void>;
  // Customer CRUD
  addCustomer: (c: Omit<CustomerMapping, "id" | "createdAt" | "updatedAt">) => void;
  updateCustomer: (id: string, data: Partial<CustomerMapping>) => void;
  deleteCustomer: (id: string) => void;
  // Product CRUD
  addProduct: (p: Omit<ProductMapping, "id" | "createdAt" | "updatedAt">) => void;
  updateProduct: (id: string, data: Partial<ProductMapping>) => void;
  deleteProduct: (id: string) => void;
  // Queries
  findCustomerByOmsName: (name: string) => CustomerMapping | undefined;
  findProductByOmsName: (name: string) => ProductMapping | undefined;
  getUnmappedCustomers: () => CustomerMapping[];
  getUnmappedProducts: () => ProductMapping[];
}

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export const useMappingStore = create<MappingState>()(
  persist(
    (set, get) => ({
      customers: [],
      products: [],
      isReady: false,

      initialize: async () => {
        if (get().customers.length > 0) {
          set({ isReady: true });
          return;
        }
        const [customers, products] = await Promise.all([
          fetch("/data/customers.json").then((r) => r.json()),
          fetch("/data/products.json").then((r) => r.json()),
        ]);
        set({ customers, products, isReady: true });
      },

      reset: async () => {
        const [customers, products] = await Promise.all([
          fetch("/data/customers.json").then((r) => r.json()),
          fetch("/data/products.json").then((r) => r.json()),
        ]);
        set({ customers, products, isReady: true });
      },

      addCustomer: (c) =>
        set((s) => ({
          customers: [
            ...s.customers,
            { ...c, id: uid(), createdAt: now(), updatedAt: now() },
          ],
        })),

      updateCustomer: (id, data) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: now() } : c
          ),
        })),

      deleteCustomer: (id) =>
        set((s) => ({
          customers: s.customers.filter((c) => c.id !== id),
        })),

      addProduct: (p) =>
        set((s) => ({
          products: [
            ...s.products,
            { ...p, id: uid(), createdAt: now(), updatedAt: now() },
          ],
        })),

      updateProduct: (id, data) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now() } : p
          ),
        })),

      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
        })),

      findCustomerByOmsName: (name) =>
        get().customers.find(
          (c) =>
            c.omsName === name ||
            c.omsName.includes(name) ||
            name.includes(c.omsName)
        ),

      findProductByOmsName: (name) =>
        get().products.find(
          (p) =>
            p.omsProductName === name ||
            p.omsProductName.includes(name) ||
            name.includes(p.omsProductName)
        ),

      getUnmappedCustomers: () =>
        get().customers.filter((c) => !c.ecountCode),

      getUnmappedProducts: () =>
        get().products.filter((p) => !p.ecountItemCode),
    }),
    {
      name: "oms-mapping-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        customers: state.customers,
        products: state.products,
      }),
    }
  )
);
