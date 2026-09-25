import test from "node:test";
import assert from "node:assert/strict";
import { dayKey, descriptionPreview, selectToday } from "../src/lib/today.ts";
import { itemFromRow, itemToRow } from "../src/lib/item-storage.ts";

const now = new Date(2026, 8, 11, 12);
const today = "2026-09-11";
const item = (id, fields = {}) => ({ id, content: id, type: "todo", status: "todo", tags: ["viva"],
  priority: "none", images: [], dueDate: null, createdAt: new Date(2026, 8, 1), ...fields });
const ids = items => items.map(item => item.id);

test("planning never changes a deadline and calendar dates survive round trips", () => {
  const dueDate = new Date(2026, 8, 19);
  const row = itemToRow(item("task", { dueDate, plannedFor: today }));
  assert.equal(row.due_date, dueDate.toISOString());
  assert.equal(row.planned_for, today);
  assert.deepEqual(itemToRow({ plannedFor: today }), { planned_for: today });
  assert.equal(itemFromRow({ ...row, id: "task", created_at: now.toISOString() }).plannedFor, today);
  assert.equal(dayKey(new Date(2026, 8, 11, 0, 1)), today);
});

test("completion is counted by completion time, never by deadline", () => {
  const result = selectToday([
    item("done-without-deadline", { status: "done", completedAt: now }),
    item("old-completion", { status: "done", dueDate: now, completedAt: new Date(2026, 8, 10) }),
    item("unknown-historical", { status: "done", dueDate: now }),
    item("reopened", { completedAt: now }),
  ], now);
  assert.deepEqual(ids(result.completed), ["done-without-deadline"]);
  assert.equal(itemToRow({ completedAt: now }).completed_at, undefined);
  assert.equal(itemFromRow({ id: "legacy", created_at: now.toISOString() }).completedAt, null);
});

test("future tasks, waiting tasks and old deadlines do not crowd suggestions", () => {
  const result = selectToday([
    item("available"), item("in-progress", { status: "in_progress" }),
    item("october", { dueDate: new Date(2026, 9, 3) }),
    item("overdue", { dueDate: new Date(2026, 0, 23) }),
    item("due-today-noon", { dueDate: now }),
    item("planned-tomorrow", { plannedFor: "2026-09-12" }),
    item("waiting", { waitingFor: "Feedback" }),
  ], now);
  assert.deepEqual(ids(result.suggestions), ["in-progress", "available"]);
  assert.deepEqual(ids(result.dueToday), ["due-today-noon"]);
  assert.deepEqual(ids(result.overdue), ["overdue"]);
  assert.deepEqual(ids(result.waiting), ["waiting"]);
});

test("context filters apply to every list while retaining the single global focus", () => {
  const work = item("work", { plannedFor: today, focusedOn: today, status: "in_progress" });
  const privateTask = item("private", { tags: ["privat"], plannedFor: today });
  const result = selectToday([work, privateTask, item("work-note", { type: "note" }), item("private-note", { type: "note", tags: ["privat"] })], now, "privat");
  assert.equal(result.focus.id, "work");
  assert.deepEqual(ids(result.planned), ["private"]);
  assert.deepEqual(ids(result.notes), ["private-note"]);
  assert.equal(result.openCount, 1);
});

test("day rollover makes unfinished plans explicit carry-over and clears yesterday's focus", () => {
  const task = item("yesterday", { plannedFor: "2026-09-10", focusedOn: "2026-09-10" });
  const result = selectToday([task], now);
  assert.equal(result.focus, null);
  assert.deepEqual(ids(result.carryOver), ["yesterday"]);
  assert.equal(result.suggestions.length, 0);
  assert.equal(result.planned.length, 0);
});

test("paused work remains planned; done and waiting tasks cannot be focused", () => {
  const result = selectToday([
    item("paused", { plannedFor: today, status: "in_progress" }),
    item("waiting", { plannedFor: today, focusedOn: today, waitingFor: "Reply" }),
    item("done", { plannedFor: today, focusedOn: today, status: "done", completedAt: now }),
  ], now);
  assert.equal(result.focus, null);
  assert.deepEqual(ids(result.openPlan), ["paused"]);
  assert.equal(result.completedPlanCount, 1);
});

test("pins keep older reference notes accessible; previews show the description", () => {
  const result = selectToday([
    item("new", { type: "note", createdAt: now }),
    item("pinned", { type: "note", pinned: true }),
  ], now);
  assert.deepEqual(ids(result.notes), ["pinned", "new"]);
  assert.equal(descriptionPreview(item("task", { nextStep: "Call", description: "Other" })), "Other");
  assert.equal(descriptionPreview(item("task", { description: "https://example.com\n\n- Bild bestellen" })), "Bild bestellen");
});

test("nullable workflow fields can be cleared without silently erasing other metadata", () => {
  assert.deepEqual(itemToRow({ plannedFor: null, waitingFor: null, reviewOn: null, focusedOn: null }),
    { planned_for: null, focused_on: null, waiting_for: null, review_on: null });
  assert.deepEqual(itemToRow({ content: "new title" }), { content: "new title" });
});

test("derived tasks preserve their source note and follow-up metadata in storage", () => {
  const sourceNoteId = "b2435e86-bd3c-42e9-b09d-5987d20b51b6";
  const row = itemToRow(item("derived", { sourceNoteId, waitingFor: "Antwort", reviewOn: "2026-09-14", nextStep: "Nachfragen" }));
  const restored = itemFromRow({ ...row, id: "derived", created_at: now.toISOString() });
  assert.equal(restored.sourceNoteId, sourceNoteId);
  assert.equal(restored.waitingFor, "Antwort");
  assert.equal(restored.reviewOn, "2026-09-14");
  assert.equal(restored.nextStep, "Nachfragen");
});

test("upcoming work sorts by the next planning date or deadline", () => {
  const result = selectToday([
    item("later-deadline", { dueDate: new Date(2026, 8, 19) }),
    item("tomorrow-no-deadline", { plannedFor: "2026-09-12" }),
    item("tomorrow-overdue", { plannedFor: "2026-09-12", dueDate: new Date(2026, 8, 1) }),
    item("earlier-deadline", { plannedFor: "2026-09-20", dueDate: new Date(2026, 8, 13) }),
  ], now);
  assert.deepEqual(ids(result.upcoming), ["tomorrow-overdue", "tomorrow-no-deadline", "earlier-deadline", "later-deadline"]);
});
