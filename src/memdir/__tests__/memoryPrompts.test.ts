import { describe, expect, test } from "bun:test";
import {
	buildExtractAutoOnlyPrompt,
} from "../../services/extractMemories/prompts";
import { buildConsolidationPrompt } from "../../services/autoDream/consolidationPrompt";

describe("memory prompt builders", () => {
	test("extraction prompt teaches feedback schema, index discipline, and duplicate avoidance", () => {
		const prompt = buildExtractAutoOnlyPrompt(12, "existing memory files");

		expect(prompt).toContain("`MEMORY.md` is an index, not a memory");
		expect(prompt).toContain("Do not write duplicate memories");
		expect(prompt).toContain("polarity: {{prefer | avoid}}");
		expect(prompt).toContain("signals:");
		expect(prompt).toContain("capture it as `polarity: prefer`");
	});

	test("dream consolidation prompt normalizes feedback and encourages updating existing topic files", () => {
		const prompt = buildConsolidationPrompt("/tmp/memory", "/tmp/transcripts", "");

		expect(prompt).toContain("Synthesize what you've learned recently into durable, well-organized memories");
		expect(prompt).toContain("improve them rather than creating duplicates");
		expect(prompt).toContain("rewrite it to the normalized schema");
		expect(prompt).toContain("Delete or fold memories that only repeat an existing rule");
		expect(prompt).toContain("Never write memory content directly into it.");
	});
});
