import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getComplaintsQuerySchema } from "./compliaint.schema.js";

describe("getComplaintsQuerySchema", () => {
  it("normalizes uppercase status correctly", () => {
    const parsed = getComplaintsQuerySchema.parse({ status: "PENDING" });
    assert.equal(parsed.status, "PENDING");
  });

  it("normalizes lowercase status to uppercase", () => {
    const parsed = getComplaintsQuerySchema.parse({ status: "pending" });
    assert.equal(parsed.status, "PENDING");
  });

  it("normalizes hyphens in status", () => {
    const parsed = getComplaintsQuerySchema.parse({ status: "in-progress" });
    assert.equal(parsed.status, "IN_PROGRESS");
  });

  it("ignores status='all' and empty status by converting to undefined", () => {
    const parsedAll = getComplaintsQuerySchema.parse({ status: "all" });
    assert.equal(parsedAll.status, undefined);

    const parsedEmpty = getComplaintsQuerySchema.parse({ status: "  " });
    assert.equal(parsedEmpty.status, undefined);
  });

  it("normalizes category and priority", () => {
    const parsed = getComplaintsQuerySchema.parse({
      category: "plumbing",
      priority: "urgent",
    });
    assert.equal(parsed.category, "PLUMBING");
    assert.equal(parsed.priority, "URGENT");
  });

  it("ignores category='all' and priority='all'", () => {
    const parsed = getComplaintsQuerySchema.parse({
      category: "ALL",
      priority: "all",
    });
    assert.equal(parsed.category, undefined);
    assert.equal(parsed.priority, undefined);
  });

  it("accepts apartmentId, flatId, residentId, assignedTo, search aliases", () => {
    const parsed = getComplaintsQuerySchema.parse({
      apartmentId: "670123456789abcdef012345",
      flatId: "670123456789abcdef012346",
      residentId: "res-user-1",
      assignedTo: "staff-user-2",
      search: "water leakage",
    });
    assert.equal(parsed.apartmentId, "670123456789abcdef012345");
    assert.equal(parsed.flatId, "670123456789abcdef012346");
    assert.equal(parsed.residentId, "res-user-1");
    assert.equal(parsed.assignedTo, "staff-user-2");
    assert.equal(parsed.search, "water leakage");
  });

  it("allows extra query parameters via passthrough without throwing", () => {
    const parsed = getComplaintsQuerySchema.parse({
      status: "PENDING",
      sort: "newest",
      randomParam: "123",
    });
    assert.equal(parsed.status, "PENDING");
    assert.equal((parsed as any).sort, "newest");
  });

  it("coerces page and limit with defaults", () => {
    const parsed = getComplaintsQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 20);

    const parsedCustom = getComplaintsQuerySchema.parse({ page: "2", limit: "50" });
    assert.equal(parsedCustom.page, 2);
    assert.equal(parsedCustom.limit, 50);
  });
});

