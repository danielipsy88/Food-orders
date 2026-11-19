import type { TransactionSql } from "postgres";

type Tx = TransactionSql;
type Item = { dishId: number; qty: number };

/** Thrown inside a transaction when a dish does not have enough portions left. */
export class OutOfStock extends Error {
  constructor(public dishName: string) {
    super(`Not enough stock: ${dishName}`);
  }
}

/**
 * Takes portions for an order. Throws OutOfStock if any dish has too few left, which rolls back
 * the whole transaction. A dish that reaches 0 is marked sold out.
 */
export async function takeStock(tx: Tx, items: Item[]) {
  for (const i of items) {
    const rows = await tx`
      update dishes set
        stock = stock - ${i.qty},
        sold_out = sold_out or stock - ${i.qty} = 0,
        updated_at = case when stock - ${i.qty} = 0 then now() else updated_at end
      where id = ${i.dishId} and stock is not null and stock >= ${i.qty}
      returning id`;
    if (rows.length) continue;
    // No row updated: either the dish has no limit, or there is not enough left.
    const [d] = await tx`select name, stock from dishes where id = ${i.dishId}`;
    if (d && d.stock !== null) throw new OutOfStock(d.name as string);
  }
}

/** Same as takeStock, but never refuses: used when the admin reopens an order. Floors at 0. */
export async function forceTakeStock(tx: Tx, items: Item[]) {
  for (const i of items) {
    await tx`
      update dishes set
        stock = greatest(stock - ${i.qty}, 0),
        sold_out = sold_out or stock - ${i.qty} <= 0
      where id = ${i.dishId} and stock is not null`;
  }
}

/** Gives portions back after a cancellation or an edit. A dish that was at 0 becomes available again. */
export async function returnStock(tx: Tx, items: Item[]) {
  for (const i of items) {
    await tx`
      update dishes set
        sold_out = case when stock = 0 then false else sold_out end,
        stock = stock + ${i.qty},
        updated_at = now()
      where id = ${i.dishId} and stock is not null`;
  }
}
