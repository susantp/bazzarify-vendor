import { expect, test } from "bun:test";

import { isAuthoringFieldVisible } from "@/modules/product.management/utils/productAuthoringRenderer";

test("base price visibility differs between create and update modes", () => {
  expect(isAuthoringFieldVisible(null, "base_price", "create")).toBe(true);
  expect(isAuthoringFieldVisible(null, "base_price", "update")).toBe(false);
});
