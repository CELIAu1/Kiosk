"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { setCustomerNote } from "@/lib/data/customers";

export async function saveCustomerNoteAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const id = String(formData.get("customer_id") ?? "");
  if (!id) return;

  await setCustomerNote(session.business.id, id, String(formData.get("note") ?? ""));
  revalidatePath(`/customers/${id}`);
}
