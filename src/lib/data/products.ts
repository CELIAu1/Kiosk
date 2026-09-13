import { all, one, run, tx, type Tx } from "../db.ts";
import { newId } from "../ids";
import type { Product, ProductCard, ProductOption, ProductStatus } from "../types";

/**
 * Product lists always carry their interest counts. Showing a catalogue
 * without them would make KIOSK a gallery; the counts are the point.
 */
const CARD_SELECT = `
  SELECT p.*,
         (SELECT pi.image_id FROM product_images pi
           WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_id,
         (SELECT c.name FROM categories c WHERE c.id = p.category_id) AS category_name,
         (SELECT sh.name FROM shops sh WHERE sh.id = p.shop_id) AS shop_name,
         (SELECT sh.tag FROM shops sh WHERE sh.id = p.shop_id) AS shop_tag,
         (SELECT COUNT(*) FROM interest_events e
           WHERE e.product_id = p.id AND e.kind = 'viewed_product') AS views,
         (SELECT COUNT(*) FROM questions q WHERE q.product_id = p.id) AS questions,
         (SELECT COALESCE(SUM(oi.qty), 0) FROM order_items oi
             JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
            WHERE oi.product_id = p.id) AS orders
    FROM products p
`;

export async function listProducts(
  businessId: string,
  opts: {
    search?: string;
    categoryId?: string;
    shopId?: string;
    publicOnly?: boolean;
  } = {},
): Promise<ProductCard[]> {
  const where = [`p.business_id = ?`];
  const params: (string | number)[] = [businessId];

  if (opts.shopId) {
    where.push(`p.shop_id = ?`);
    params.push(opts.shopId);
  }
  if (opts.publicOnly) where.push(`p.status IN ('active', 'sold_out')`);
  if (opts.categoryId) {
    where.push(`p.category_id = ?`);
    params.push(opts.categoryId);
  }
  if (opts.search?.trim()) {
    where.push(`(p.name LIKE ? OR p.description LIKE ?)`);
    const like = `%${opts.search.trim()}%`;
    params.push(like, like);
  }

  return all<ProductCard>(
    `${CARD_SELECT} WHERE ${where.join(" AND ")} ORDER BY p.created_at DESC`,
    ...params,
  );
}

export async function getProductCard(businessId: string, productId: string) {
  return one<ProductCard>(
    `${CARD_SELECT} WHERE p.business_id = ? AND p.id = ?`,
    businessId,
    productId,
  );
}

export async function getProduct(businessId: string, productId: string) {
  return one<Product>(
    `SELECT * FROM products WHERE business_id = ? AND id = ?`,
    businessId,
    productId,
  );
}

export async function listProductImages(productId: string): Promise<string[]> {
  const rows = await all<{ image_id: string }>(
    `SELECT image_id FROM product_images WHERE product_id = ? ORDER BY position`,
    productId,
  );
  return rows.map((row) => row.image_id);
}

export async function listProductOptions(productId: string) {
  return all<ProductOption>(
    `SELECT * FROM product_options WHERE product_id = ? ORDER BY position, label`,
    productId,
  );
}

export async function getOption(optionId: string) {
  return one<ProductOption>(`SELECT * FROM product_options WHERE id = ?`, optionId);
}

export type ProductInput = {
  shopId: string;
  name: string;
  description: string | null;
  priceMinor: number;
  compareAtMinor: number | null;
  categoryId: string | null;
  status: ProductStatus;
  stock: number | null;
  options: string[];
  imageIds: string[];
};

export async function createProduct(businessId: string, input: ProductInput): Promise<string> {
  const id = newId("prd");
  const now = new Date().toISOString();
  await tx(async (t) => {
    await t.run(
      `INSERT INTO products
         (id, business_id, shop_id, category_id, name, description, price_minor,
          compare_at_minor, status, stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      businessId,
      input.shopId,
      input.categoryId,
      input.name,
      input.description,
      input.priceMinor,
      input.compareAtMinor,
      input.status,
      input.stock,
      now,
      now,
    );
    await writeImages(t, id, input.imageIds);
    await writeOptions(t, id, input.options);
  });
  return id;
}

export async function updateProduct(
  businessId: string,
  productId: string,
  input: ProductInput,
) {
  const now = new Date().toISOString();
  await tx(async (t) => {
    await t.run(
      `UPDATE products
          SET shop_id = ?, category_id = ?, name = ?, description = ?, price_minor = ?,
              compare_at_minor = ?, status = ?, stock = ?, updated_at = ?
        WHERE id = ? AND business_id = ?`,
      input.shopId,
      input.categoryId,
      input.name,
      input.description,
      input.priceMinor,
      input.compareAtMinor,
      input.status,
      input.stock,
      now,
      productId,
      businessId,
    );
    await t.run(`DELETE FROM product_images WHERE product_id = ?`, productId);
    await writeImages(t, productId, input.imageIds);
    // Options are replaced wholesale; they are short lists the owner retypes.
    await t.run(`DELETE FROM product_options WHERE product_id = ?`, productId);
    await writeOptions(t, productId, input.options);
  });
}

export async function setProductStatus(
  businessId: string,
  productId: string,
  status: ProductStatus,
) {
  await run(
    `UPDATE products SET status = ?, updated_at = ? WHERE id = ? AND business_id = ?`,
    status,
    new Date().toISOString(),
    productId,
    businessId,
  );
}

export async function deleteProduct(businessId: string, productId: string) {
  await run(`DELETE FROM products WHERE id = ? AND business_id = ?`, productId, businessId);
}

async function writeImages(t: Tx, productId: string, imageIds: string[]) {
  for (const [index, imageId] of imageIds.entries()) {
    await t.run(
      `INSERT INTO product_images (id, product_id, image_id, position) VALUES (?, ?, ?, ?)`,
      newId("pim"),
      productId,
      imageId,
      index,
    );
  }
}

async function writeOptions(t: Tx, productId: string, options: string[]) {
  for (const [index, label] of options.entries()) {
    await t.run(
      `INSERT INTO product_options (id, product_id, label, in_stock, position)
       VALUES (?, ?, ?, 1, ?)`,
      newId("opt"),
      productId,
      label,
      index,
    );
  }
}

/** True when a customer can actually place an order for this product. */
export function isOrderable(product: Pick<Product, "status" | "stock">): boolean {
  if (product.status !== "active") return false;
  if (product.stock !== null && product.stock <= 0) return false;
  return true;
}
