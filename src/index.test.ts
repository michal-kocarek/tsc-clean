import { describe, expect, it } from "vitest";

import { describeStatus } from "./index.js";

describe(describeStatus, () => {
	it("points readers at the product brief", () => {
		expect(describeStatus()).toContain("PRODUCT.md");
	});
});
