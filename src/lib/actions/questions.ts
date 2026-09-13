"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { markAnswered } from "@/lib/data/questions";

export async function markQuestionAnsweredAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const id = String(formData.get("question_id") ?? "");
  const answered = String(formData.get("answered") ?? "true") === "true";
  if (!id) return;

  markAnswered(session.business.id, id, answered);
  revalidatePath("/home");
  revalidatePath("/questions");
}
