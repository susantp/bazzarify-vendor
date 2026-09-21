import { isAuthoringFieldVisible } from "@/modules/product.management/utils/productAuthoringRenderer";
import assert from "node:assert/strict";

assert.equal(isAuthoringFieldVisible(null, "base_price", "create"), true);
assert.equal(isAuthoringFieldVisible(null, "base_price", "update"), false);

console.log("product authoring field visibility assertions passed");
