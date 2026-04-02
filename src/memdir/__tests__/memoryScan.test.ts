import { mkdtemp, mkdir, rm, utimes, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { describe, expect, test } from "bun:test";
import {
	formatMemoryManifest,
	formatRecallMemoryManifest,
	scanMemoryFiles,
} from "../memoryScan";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
	const dir = await mkdtemp(join(tmpdir(), "claude-memory-scan-"));
	try {
		return await fn(dir);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

async function writeMemory(
	dir: string,
	relativePath: string,
	index: number,
	type: "feedback" | "project" | "reference" | "user",
	description: string,
	extraFrontmatter = "",
) {
	const filePath = join(dir, relativePath);
	await mkdir(dirname(filePath), { recursive: true });
	await writeFile(
		filePath,
		`---
name: ${relativePath.replace(/[/.]/g, "-")}
description: ${description}
type: ${type}
${extraFrontmatter}---

Line 1 for ${relativePath}
Line 2 for ${relativePath}
Line 3 for ${relativePath}
Line 4 for ${relativePath}
Line 5 for ${relativePath}
Line 6 for ${relativePath}
Line 7 for ${relativePath}
Line 8 for ${relativePath}
Line 9 for ${relativePath}
`,
	);
	const mtime = new Date(Date.UTC(2024, 0, 1, 0, 0, index));
	await utimes(filePath, mtime, mtime);
	return filePath;
}

describe("scanMemoryFiles", () => {
	test("skips MEMORY.md and returns newest markdown files first", async () => {
		await withTempDir(async (dir) => {
			await mkdir(join(dir, "nested"), { recursive: true });

			await writeFile(
				join(dir, "MEMORY.md"),
				"# index\n- [ignored](ignored.md)\n",
			);
			await writeMemory(dir, "older.md", 1, "project", "older project guidance");
			await writeMemory(
				dir,
				"nested/newer.md",
				2,
				"feedback",
				"keep responses terse",
				`polarity: prefer
applies_to:
  - communication
strength: soft
signals:
  - terse
`,
			);

			const result = await scanMemoryFiles(dir, new AbortController().signal);

			expect(result.map((memory) => memory.filename)).toEqual([
				"nested/newer.md",
				"older.md",
			]);
			expect(result.map((memory) => memory.type)).toEqual(["feedback", "project"]);
			expect(result[0]).toMatchObject({
				description: "keep responses terse",
				polarity: "prefer",
				appliesTo: ["communication"],
				strength: "soft",
				signals: ["terse"],
			});
			expect(result[0]?.preview).toContain("Line 1 for nested/newer.md");
			expect(result.some((memory) => memory.filename === "MEMORY.md")).toBe(false);
		});
	});

	test("keeps older feedback candidates in the 200-file pool", async () => {
		await withTempDir(async (dir) => {
			for (let index = 0; index < 210; index++) {
				await writeMemory(
					dir,
					`project/recent-${index}.md`,
					1000 + index,
					index % 2 === 0 ? "project" : "reference",
					`recent ${index}`,
				);
			}

			await Promise.all(
				Array.from({ length: 30 }, (_, index) =>
					writeMemory(
						dir,
						`feedback/older-${index}.md`,
						index,
						"feedback",
						`older feedback ${index}`,
						`polarity: avoid
applies_to:
  - testing
strength: hard
signals:
  - mock
`,
					),
				),
			);

			const result = await scanMemoryFiles(dir, new AbortController().signal);

			expect(result).toHaveLength(150);
			expect(
				result.filter((memory) => memory.type === "feedback").length,
			).toBeGreaterThanOrEqual(30);
		});
	});

	test("keeps legacy feedback files readable without the new schema fields", async () => {
		await withTempDir(async (dir) => {
			await writeMemory(
				dir,
				"feedback/legacy.md",
				1,
				"feedback",
				"prefer real databases in integration tests",
			);

			const result = await scanMemoryFiles(dir, new AbortController().signal);

			expect(result[0]).toMatchObject({
				filename: "feedback/legacy.md",
				type: "feedback",
				polarity: undefined,
				appliesTo: [],
				strength: undefined,
				signals: [],
			});
		});
	});

	test("formats manifests with recall metadata", () => {
		const memories = [
			{
				filename: "feedback/terse.md",
				filePath: "/tmp/memory/feedback/terse.md",
				mtimeMs: Date.now(),
				description: "keep responses terse",
				preview: "Lead with the answer",
				type: "feedback" as const,
				polarity: "prefer" as const,
				appliesTo: ["communication"] as const,
				strength: "soft" as const,
				signals: ["terse"],
			},
			{
				filename: "project/release.md",
				filePath: "/tmp/memory/project/release.md",
				mtimeMs: Date.parse("2024-01-01T00:00:00.000Z"),
				description: null,
				preview: null,
				type: "project" as const,
				appliesTo: [],
				signals: [],
			},
		];

		const extractManifest = formatMemoryManifest(memories);
		const recallManifest = formatRecallMemoryManifest(memories);

		expect(extractManifest).toContain(
			"[feedback] feedback/terse.md",
		);
		expect(recallManifest).toContain("polarity=prefer");
		expect(recallManifest).toContain("applies_to=communication");
		expect(recallManifest).toContain("preview=Lead with the answer");
	});
});
