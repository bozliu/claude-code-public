import { describe, expect, test } from "bun:test";
import { parseFrontmatter } from "../frontmatterParser";

describe("parseFrontmatter", () => {
	test("preserves feedback metadata fields for structured memory schema", () => {
		const parsed = parseFrontmatter(`---
name: communication-preference
description: keep responses terse unless the user asks for detail
type: feedback
polarity: prefer
applies_to:
  - communication
  - planning
strength: soft
signals:
  - terse
  - no trailing summary
---
Lead with the answer, then explain why it matters.
`);

		expect(parsed.frontmatter).toMatchObject({
			name: "communication-preference",
			description: "keep responses terse unless the user asks for detail",
			type: "feedback",
			polarity: "prefer",
			applies_to: ["communication", "planning"],
			strength: "soft",
			signals: ["terse", "no trailing summary"],
		});
		expect(parsed.content.trim()).toBe(
			"Lead with the answer, then explain why it matters.",
		);
	});

	test("keeps unknown frontmatter fields intact", () => {
		const parsed = parseFrontmatter(`---
name: memory-rule
description: prefer real databases in integration tests
type: feedback
custom_flag: true
---
Use the real database for integration tests.
`);

		expect(parsed.frontmatter).toMatchObject({
			name: "memory-rule",
			description: "prefer real databases in integration tests",
			type: "feedback",
			custom_flag: true,
		});
	});
});
