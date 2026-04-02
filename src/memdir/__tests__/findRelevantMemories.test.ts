import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { describe, expect, mock, test } from "bun:test";

type SideQueryCall = {
	model: string;
	system: string | string[] | undefined;
	messages: Array<{
		role: string;
		content: string;
	}>;
	max_tokens?: number;
	querySource: string;
};

const sideQueryCalls: SideQueryCall[] = [];

mock.module("../../utils/sideQuery.js", () => ({
	sideQuery: async (opts: SideQueryCall) => {
		sideQueryCalls.push(opts);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						selected_memories: ["keep-me.md", "missing.md"],
					}),
				},
			],
		};
	},
}));

const {
	findRelevantMemories,
	rankMemoriesForRecall,
} = await import("../findRelevantMemories");

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
	const dir = await mkdtemp(join(tmpdir(), "claude-recall-"));
	try {
		return await fn(dir);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

describe("findRelevantMemories", () => {
	test("filters already surfaced memories before asking the selector", async () => {
		await withTempDir(async (dir) => {
			const keepPath = join(dir, "keep-me.md");
			const skipPath = join(dir, "skip-me.md");

			await writeFile(
				keepPath,
				`---
name: keep-me
description: keep this memory
type: feedback
polarity: prefer
applies_to:
  - communication
strength: soft
signals:
  - terse
---
Keep this memory.
`,
			);
			await writeFile(
				skipPath,
				`---
name: skip-me
description: should be filtered out
type: project
---
Skip this memory.
`,
			);

			sideQueryCalls.length = 0;
			const result = await findRelevantMemories(
				"how should we respond to feedback?",
				dir,
				new AbortController().signal,
				["Read", "Grep"],
				new Set([skipPath]),
			);

			expect(result.selected).toEqual([
				{
					path: keepPath,
					mtimeMs: expect.any(Number),
					type: "feedback",
					localScore: expect.any(Number),
					localRank: 0,
					sideQueryRank: 0,
				},
			]);
			expect(result.localTopCandidates[0]?.path).toBe(keepPath);
			expect(sideQueryCalls).toHaveLength(1);
			expect(sideQueryCalls[0].querySource).toBe("memdir_relevance");
			expect(sideQueryCalls[0].messages[0].content).toContain("keep-me.md");
			expect(sideQueryCalls[0].messages[0].content).not.toContain("skip-me.md");
			expect(sideQueryCalls[0].messages[0].content).toContain(
				"Recently used tools: Read, Grep",
			);
			expect(sideQueryCalls[0].messages[0].content).toContain("polarity=prefer");
			expect(sideQueryCalls[0].messages[0].content).toContain(
				"applies_to=communication",
			);
			expect(sideQueryCalls[0].messages[0].content).toContain("preview=Keep this memory.");
		});
	});

	test("drops selector results that are no longer valid memory files but keeps local candidates", async () => {
		await withTempDir(async (dir) => {
			const onlyPath = join(dir, "only.md");

			await writeFile(
				onlyPath,
				`---
name: only
description: only real memory
type: feedback
---
Only memory.
`,
			);

			sideQueryCalls.length = 0;
			const result = await findRelevantMemories(
				"what should we keep in mind?",
				dir,
				new AbortController().signal,
			);

			expect(result.selected).toEqual([]);
			expect(result.localTopCandidates).toEqual([
				{
					path: onlyPath,
					mtimeMs: expect.any(Number),
					type: "feedback",
					localScore: expect.any(Number),
					localRank: 0,
				},
			]);
			expect(sideQueryCalls).toHaveLength(1);
			expect(sideQueryCalls[0].messages[0].content).toContain("only.md");
		});
	});
});

describe("rankMemoriesForRecall", () => {
	test("prioritizes feedback metadata and penalizes already-working tool docs", () => {
		const ranked = rankMemoriesForRecall(
			"please verify with the read tool before you respond",
			[
				{
					filename: "feedback/verify-before-responding.md",
					filePath: "/tmp/feedback/verify-before-responding.md",
					mtimeMs: Date.now(),
					description: "verify results before responding to the user",
					preview: "Verify before responding.",
					type: "feedback",
					polarity: "prefer",
					appliesTo: ["verification", "communication"],
					strength: "hard",
					signals: ["verify", "respond"],
				},
				{
					filename: "reference/read-tool.md",
					filePath: "/tmp/reference/read-tool.md",
					mtimeMs: Date.now(),
					description: "how to use the Read tool",
					preview: "Read tool reference documentation.",
					type: "reference",
					appliesTo: [],
					signals: [],
				},
			],
			["Read"],
		);

		expect(ranked[0]?.type).toBe("feedback");
		expect(ranked[0]?.localScore).toBeGreaterThan(ranked[1]?.localScore ?? 0);
	});
});
