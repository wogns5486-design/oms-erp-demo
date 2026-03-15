import type { ShipmentItem, BoxStandard, BoxSplitResult } from "@/lib/types";

interface BoxSplitterInput {
  recipientName: string;
  items: ShipmentItem[];
  boxStandards: BoxStandard[];
}

export function splitBoxes(input: BoxSplitterInput): BoxSplitResult {
  const { recipientName, items, boxStandards } = input;

  // Group items by category and sum quantities
  const categoryMap = new Map<
    string,
    { itemName: string; quantity: number; category: string }[]
  >();

  for (const item of items) {
    const cat = item.category || "etc";
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    const existing = categoryMap.get(cat)!.find(
      (i) => i.itemName === item.itemName
    );
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      categoryMap.get(cat)!.push({
        itemName: item.itemName,
        quantity: item.quantity,
        category: cat,
      });
    }
  }

  const boxes: BoxSplitResult["boxes"] = [];
  let boxNumber = 1;

  for (const [category, categoryItems] of categoryMap) {
    const standard = boxStandards.find((s) => s.category === category);
    const maxPerBox = standard?.maxPerBox ?? 20;

    // Calculate total quantity for this category
    let totalQty = categoryItems.reduce((sum, i) => sum + i.quantity, 0);

    while (totalQty > 0) {
      const boxItems: { itemName: string; quantity: number; category: string }[] = [];
      let remaining = maxPerBox;

      for (const item of categoryItems) {
        if (item.quantity <= 0) continue;
        const take = Math.min(item.quantity, remaining);
        if (take > 0) {
          boxItems.push({
            itemName: item.itemName,
            quantity: take,
            category: item.category,
          });
          item.quantity -= take;
          remaining -= take;
          totalQty -= take;
        }
        if (remaining <= 0) break;
      }

      if (boxItems.length > 0) {
        boxes.push({ boxNumber: boxNumber++, items: boxItems });
      } else {
        break;
      }
    }
  }

  return {
    recipientName,
    totalBoxes: boxes.length,
    boxes,
  };
}
