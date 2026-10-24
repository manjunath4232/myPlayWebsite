import test from "node:test";
import assert from "node:assert/strict";
import {
  phoneDigits,
  whatsappLink,
  filterProducts,
  validateProduct,
} from "../src/domain.js";
const products = [
  {
    id: 1,
    name: "Clay Vase",
    category: "Home",
    description: "handmade",
    available: true,
    price: 850,
    created_at: "2026-10-20",
  },
  {
    id: 2,
    name: "Table Lamp",
    category: "Lighting",
    description: "warm",
    available: false,
    price: 1900,
    created_at: "2026-10-21",
  },
  {
    id: 3,
    name: "Mug",
    category: "Home",
    description: "stoneware",
    available: true,
    price: 450,
    created_at: "2026-10-22",
  },
];
test("catalog combines text, category, availability and price sorting", () => {
  assert.deepEqual(
    filterProducts(products, {
      category: "Home",
      availableOnly: true,
      sort: "price-low",
    }).map((p) => p.id),
    [3, 1],
  );
  assert.deepEqual(
    filterProducts(products, { search: " HANDMADE " }).map((p) => p.id),
    [1],
  );
  assert.equal(filterProducts(products, { search: "missing" }).length, 0);
  assert.deepEqual(
    filterProducts(products).map((p) => p.id),
    [3, 2, 1],
  );
});
test("WhatsApp requires a genuine international number and safely encodes a message", () => {
  assert.equal(whatsappLink("", products[0], "MyPlay"), null);
  assert.equal(phoneDigits("javascript:alert(1)"), "");
  assert.equal(phoneDigits("+91 98765-43210"), "919876543210");
  const url = new URL(
    whatsappLink(
      "+91 98765-43210",
      { name: "Vase & Mug?", price: 850 },
      "MyPlay",
    ),
  );
  assert.equal(url.hostname, "wa.me");
  assert.ok(url.searchParams.get("text").includes("Vase & Mug?"));
  assert.equal([...url.searchParams].length, 1);
});
test("invalid product data cannot pass client validation", () => {
  for (const price of ["", -1, "oops", Infinity, 100000000])
    assert.throws(() =>
      validateProduct({ name: "Vase", category: "Home", price }),
    );
  assert.throws(() =>
    validateProduct({ name: "  ", category: "Home", price: 3 }),
  );
  assert.equal(
    validateProduct({ name: " Vase ", category: " Home ", price: "850.50" })
      .price,
    850.5,
  );
  assert.equal(
    validateProduct({ name: "Vase", category: "Home", price: 0 }).price,
    0,
  );
});
