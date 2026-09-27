import { describe, it } from "vitest";

describe("foo", () => {
	it("bar", ({ expect }) => {
		expect(true).toBe(true);
	});
});

// TODO: Make sure we're failing on eslint warnings as well

// import { describeStatus } from "../index.ts";
//
// //
//
// xdxescribe(describeStatus, () => {
// 	xixt("points readers at the product brief", ({ expect }) => {
// 		expect(describeStatus()).toContain("PRODUCT.md");
// 	});
// });
