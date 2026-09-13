import { all, one, run } from "../db";
import { newId } from "../ids";
import type { Question } from "../types";
import { recordInterest } from "./interest";

export type QuestionRow = Question & {
  customer_name: string;
  customer_phone: string | null;
  customer_instagram: string | null;
  product_name: string | null;
  image_id: string | null;
};

const SELECT = `
  SELECT q.*, c.name AS customer_name, c.phone AS customer_phone,
         c.instagram AS customer_instagram, p.name AS product_name,
         (SELECT pi.image_id FROM product_images pi
           WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_id
    FROM questions q
    JOIN customers c ON c.id = q.customer_id
    LEFT JOIN products p ON p.id = q.product_id
`;

export async function askQuestion(input: {
  businessId: string;
  productId: string | null;
  customerId: string;
  visitorId: string | null;
  body: string;
}): Promise<string> {
  const id = newId("qst");
  await run(
    `INSERT INTO questions
       (id, business_id, product_id, customer_id, body, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'waiting', ?)`,
    id,
    input.businessId,
    input.productId,
    input.customerId,
    input.body.trim(),
    new Date().toISOString(),
  );
  recordInterest(input.businessId, "asked", {
    productId: input.productId,
    customerId: input.customerId,
    visitorId: input.visitorId,
  });
  return id;
}

export async function listQuestions(
  businessId: string,
  status?: "waiting" | "answered",
): Promise<QuestionRow[]> {
  const clause = status ? ` AND q.status = ?` : "";
  const params: string[] = status ? [businessId, status] : [businessId];
  return all<QuestionRow>(
    `${SELECT} WHERE q.business_id = ?${clause} ORDER BY q.created_at DESC`,
    ...params,
  );
}

export async function countWaitingQuestions(businessId: string): Promise<number> {
  return (
    (await one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM questions WHERE business_id = ? AND status = 'waiting'`,
      businessId,
    ))?.n ?? 0
  );
}

export async function listProductQuestions(productId: string): Promise<QuestionRow[]> {
  return all<QuestionRow>(
    `${SELECT} WHERE q.product_id = ? ORDER BY q.created_at DESC`,
    productId,
  );
}

export async function markAnswered(businessId: string, questionId: string, answered: boolean) {
  await run(
    `UPDATE questions SET status = ?, answered_at = ? WHERE id = ? AND business_id = ?`,
    answered ? "answered" : "waiting",
    answered ? new Date().toISOString() : null,
    questionId,
    businessId,
  );
}
