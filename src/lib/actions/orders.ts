"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { setOrderStatus } from "@/lib/data/orders";
import type { OrderStatus } from "@/lib/types";

const VALID: OrderStatus[] = ["new", "confirmed", "completed", "cancelled"];

export async function setOrderStatusAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const id = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!id || !VALID.includes(status)) return;

  await setOrderStatus(session.business.id, id, status);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/home");
}
