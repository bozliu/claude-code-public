import { describe, expect, test } from "bun:test";
import { selectMemoriesForSurfacing } from "../attachments";

const readNothing = { has: () => false };

describe("selectMemoriesForSurfacing", () => {
	test("backfills one strong feedback memory when sideQuery selected none", () => {
		const selected = [
			{
				path: "/tmp/reference-1.md",
				mtimeMs: 1,
				type: "reference" as const,
				localScore: 8,
				localRank: 0,
				sideQueryRank: 0,
			},
			{
				path: "/tmp/reference-2.md",
				mtimeMs: 2,
				type: "reference" as const,
				localScore: 7,
				localRank: 1,
				sideQueryRank: 1,
			},
			{
				path: "/tmp/project-1.md",
				mtimeMs: 3,
				type: "project" as const,
				localScore: 6,
				localRank: 2,
				sideQueryRank: 2,
			},
			{
				path: "/tmp/project-2.md",
				mtimeMs: 4,
				type: "project" as const,
				localScore: 5,
				localRank: 3,
				sideQueryRank: 3,
			},
			{
				path: "/tmp/project-3.md",
				mtimeMs: 5,
				type: "project" as const,
				localScore: 4,
				localRank: 4,
				sideQueryRank: 4,
			},
		];
		const localTop = [
			{
				path: "/tmp/feedback.md",
				mtimeMs: 6,
				type: "feedback" as const,
				localScore: 5,
				localRank: 0,
			},
			...selected,
		];

		const result = selectMemoriesForSurfacing(
			selected,
			localTop,
			readNothing,
			new Set(),
		);

		expect(result).toHaveLength(5);
		expect(result.some((memory) => memory.type === "feedback")).toBe(true);
		expect(result.filter((memory) => memory.type === "reference")).toHaveLength(2);
	});

	test("does not force in weak feedback for a reference-heavy turn", () => {
		const selected = [
			{
				path: "/tmp/reference-1.md",
				mtimeMs: 1,
				type: "reference" as const,
				localScore: 8,
				localRank: 0,
				sideQueryRank: 0,
			},
			{
				path: "/tmp/reference-2.md",
				mtimeMs: 2,
				type: "reference" as const,
				localScore: 7,
				localRank: 1,
				sideQueryRank: 1,
			},
		];
		const localTop = [
			...selected,
			{
				path: "/tmp/feedback-low-signal.md",
				mtimeMs: 3,
				type: "feedback" as const,
				localScore: 3,
				localRank: 2,
			},
		];

		const result = selectMemoriesForSurfacing(
			selected,
			localTop,
			readNothing,
			new Set(),
		);

		expect(result.map((memory) => memory.path)).toEqual([
			"/tmp/reference-1.md",
			"/tmp/reference-2.md",
		]);
	});
});
