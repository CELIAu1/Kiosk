import { all, one, run, tx } from "../db";
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

export function listProducts(
  businessId: string,
  opts: {
    search?: string;
    categoryId?: string;
    shopId?: string;
    publicOnly?: boolean;
  } = {},
): ProductCard[] {
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

export function getProductCard(businessId: string, productId: string) {
  return one<ProductCard>(
    `${CARD_SELECT} WHERE p.business_id = ? AND p.id = ?`,
    businessId,
    productId,
  );
}

export function getProduct(businessId: string, productId: string) {
  return one<Product>(
    `SELECT * FROM products WHERE business_id = ? AND id = ?`,
    businessId,
    productId,
  );
}

export function listProductImages(productId: string): string[] {
  return all<{ image_id: string }>(
    `SELECT image_id FROM product_images WHERE product_id = ? ORDER BY position`,
    productId,
  ).map((row) => row.image_id);
}

export function listProductOptions(productId: string) {
  return all<ProductOption>(
    `SELECT * FROM product_options WHERE product_id = ? ORDER BY position, label`,
    productId,
  );
}

export function getOption(optionId: string) {
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

export function createProduct(businessId: string, input: ProductInput): string {
  const id = newId("prd");
  const now = new Date().toISOString();
  tx(() => {
    run(
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
    writeImages(id, input.imageIds);
    writeOptions(id, input.options);
  });
  return id;
}

export function updateProduct(
  businessId: string,
  productId: string,
  input: ProductInput,
) {
  const now = new Date().toISOString();
  tx(() => {
    run(
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
    run(`DELETE FROM product_images WHERE product_id = ?`, productId);
    writeImages(productId, input.imageIds);
    // Options are replaced wholesale; they are short lists the owner retypes.
    run(`DELETE FROM product_options WHERE product_id = ?`, productId);
    writeOptions(productId, input.options);
  });
}

export function setProductStatus(
  businessId: string,
  productId: string,
  status: ProductStatus,
) {
  run(
    `UPDATE products SET status = ?, updated_at = ? WHERE id = ? AND business_id = ?`,
    status,
    new Date().toISOString(),
    productId,
    businessId,
  );
}

export function deleteProduct(businessId: string, productId: string) {
  run(`DELETE FROM products WHERE id = ? AND business_id = ?`, productId, businessId);
}

function writeImages(productId: string, imageIds: string[]) {
  imageIds.forEach((imageId, index) => {
    run(
      `INSERT INTO product_images (id, product_id, image_id, position) VALUES (?, ?, ?, ?)`,
      newId("pim"),
      productId,
      imageId,
      index,
    );
  });
}

function writeOptions(productId: string, options: string[]) {
  options.forEach((label, index) => {
    run(
      `INSERT INTO product_options (id, product_id, label, in_stock, position)
       VALUES (?, ?, ?, 1, ?)`,
      newId("opt"),
      productId,
      label,
      index,
    );
  });
}

/** True when a customer can actually place an order for this product. */
export function isOrderable(product: Pick<Product, "status" | "stock">): boolean {
  if (product.status !== "active") return false;
  if (product.stock !== null && product.stock <= 0) return false;
  return true;
}
