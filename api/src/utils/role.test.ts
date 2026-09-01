import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GLOBAL_ROLE_SET,
  MANAGEMENT_ROLE_SET,
  MAINTENANCE_ROLE_SET,
} from "../constants/roles.js";
import {
  hasExactRole,
  hasRole,
  isGlobalRole,
  isMaintenanceRole,
  normalizeRole,
} from "./role.js";

describe("role helpers", () => {
  it("normalizes role case, spacing, and separators", () => {
    assert.equal(normalizeRole("facility manager"), "FACILITY_MANAGER");
    assert.equal(normalizeRole("property-manager"), "PROPERTY_MANAGER");
    assert.equal(normalizeRole("  maintenance_staff  "), "MAINTENANCE_STAFF");
  });

  it("checks normalized role membership without changing exact role semantics", () => {
    assert.equal(hasRole("facility manager", MANAGEMENT_ROLE_SET), true);
    assert.equal(hasRole("resident", MANAGEMENT_ROLE_SET), false);
    assert.equal(hasExactRole("ADMIN", ["ADMIN"]), true);
    assert.equal(hasExactRole("admin", ["ADMIN"]), false);
  });

  it("identifies global and maintenance roles through the centralized role sets", () => {
    assert.equal(hasRole("super admin", GLOBAL_ROLE_SET), true);
    assert.equal(isGlobalRole("PROPERTY_MANAGER"), false);
    assert.equal(hasRole("maintenance technician", MAINTENANCE_ROLE_SET), true);
    assert.equal(isMaintenanceRole("TECHNICIAN"), true);
  });
});
