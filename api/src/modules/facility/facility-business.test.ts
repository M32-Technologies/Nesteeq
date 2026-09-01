import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";
import { Types } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { Alert } from "../alert/alert.modal.js";
import { createAlert } from "../alert/alert.service.js";
import { assertCanAccessComplaint, assertManagerCanManageComplaint } from "../complaint/complaint.policy.js";
import { createComplaint } from "../complaint/complaint.service.js";
import {
  assertNotTerminal as assertComplaintNotTerminal,
  assertValidTransition as assertComplaintTransition,
} from "../complaint/complaint.workflow.js";
import { Complaint } from "../complaint/complaint.model.js";
import { getFacilityDashboard } from "./facility.service.js";
import { assertManagerCanManageMaintenance } from "../maintenance/maintenance.policy.js";
import {
  assertNotTerminal as assertMaintenanceNotTerminal,
  assertValidTransition as assertMaintenanceTransition,
} from "../maintenance/maintenance.workflow.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import { Notification } from "../notification/notification.model.js";
import { ensureNoTechnicianConflict } from "../schedule/schedule.repository.js";
import { assertCanAccessSchedule, buildScheduleFilter } from "../schedule/schedule.policy.js";
import { Schedule } from "../schedule/schedule.model.js";
import { assertCanAccessTechnician, buildRoleScopedFilter as buildTechnicianFilter } from "../technician/technician.policy.js";
import {
  assertComplaintAssignedToTechnician,
  assertMaintenanceAssignedToTechnician,
} from "../technician/technician.repository.js";
import { assertTechnicianIsAssignable } from "../technician/technician.workflow.js";
import { Technician } from "../technician/technician.model.js";

type AnyFunction = (...args: any[]) => any;
type FilterShape = Record<string, any>;

const mockMethod = (
  t: TestContext,
  target: object,
  method: string,
  implementation: AnyFunction
): void => {
  t.mock.method(target as any, method, implementation as any);
};

const assertAppError = async (
  action: () => unknown | Promise<unknown>,
  message: string,
  statusCode?: number
): Promise<void> => {
  await assert.rejects(
    async () => {
      await action();
    },
    (error: unknown) =>
      error instanceof AppError &&
      error.message === message &&
      (statusCode === undefined || error.statusCode === statusCode)
  );
};

const manager = (overrides: Record<string, unknown> = {}) => ({
  id: "manager-1",
  role: "FACILITY_MANAGER",
  apartmentId: "apt-a",
  flatId: null,
  ...overrides,
});

const resident = (overrides: Record<string, unknown> = {}) => ({
  id: "resident-1",
  role: "RESIDENT",
  apartmentId: "apt-a",
  flatId: "flat-a",
  ...overrides,
});

const technicianUser = (overrides: Record<string, unknown> = {}) => ({
  id: "tech-1",
  role: "TECHNICIAN",
  apartmentId: "apt-a",
  flatId: null,
  ...overrides,
});

const complaintRecord = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: new Types.ObjectId(),
    resident: "resident-1",
    apartment: "apt-a",
    flat: "flat-a",
    title: "Water leak",
    description: "Water is leaking under the kitchen sink",
    category: "PLUMBING",
    priority: "HIGH",
    status: "PENDING",
    assignedStaff: null,
    residentConfirmation: null,
    ...overrides,
  }) as any;

const maintenanceRecord = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: new Types.ObjectId(),
    complaint: new Types.ObjectId(),
    resident: "resident-1",
    apartment: "apt-a",
    flat: "flat-a",
    title: "Repair leak",
    description: "Repair the kitchen sink leak",
    category: "PLUMBING",
    priority: "HIGH",
    status: "PENDING",
    assignedStaff: null,
    costReview: { status: "NOT_SUBMITTED" },
    ...overrides,
  }) as any;

const chainQuery = <T>(items: T[]) => {
  const query = {
    sort: () => query,
    skip: () => query,
    limit: () => query,
    lean: async () => items,
  };

  return query;
};

const singleQuery = <T>(item: T | null) => ({
  lean: async () => item,
});

const mockAuthenticatedUserLookup = (t: TestContext): void => {
  const db = getAuthDB();
  mockMethod(t, db, "collection", () => ({
    findOne: async () => ({ id: "auth-user", role: "FACILITY_MANAGER", apartmentId: "apt-a" }),
  }));
};

const statuses = (filter: FilterShape): string[] => {
  if (typeof filter.status === "string") {
    return [filter.status];
  }

  if (Array.isArray(filter.status?.$in)) {
    return filter.status.$in;
  }

  return [];
};

const includesStatuses = (filter: FilterShape, expected: string[]) =>
  expected.every((status) => statuses(filter).includes(status));

const matchesStatuses = (filter: FilterShape, expected: string[]) => {
  const actual = statuses(filter);
  return actual.length === expected.length && expected.every((status) => actual.includes(status));
};

const workItems = (count: number, overrides: Record<string, unknown> = {}) =>
  Array.from({ length: count }, (_, index) => ({
    _id: new Types.ObjectId(),
    title: `Work item ${index + 1}`,
    status: "PENDING",
    priority: "HIGH",
    createdAt: new Date(`2026-01-${String(index + 1).padStart(2, "0")}T09:00:00.000Z`),
    updatedAt: new Date(`2026-01-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`),
    costReview: { status: "SUBMITTED", submittedAmount: 100 + index, submittedAt: new Date() },
    residentConfirmation: { status: "PENDING", requestedAt: new Date() },
    ...overrides,
  }));

describe("Facility Manager role and apartment policies", () => {
  it("allows normalized manager roles only for matching complaint apartments", () => {
    assert.doesNotThrow(() =>
      assertManagerCanManageComplaint(
        manager({ role: "facility manager" }) as any,
        complaintRecord()
      )
    );

    assert.throws(
      () =>
        assertManagerCanManageComplaint(
          manager() as any,
          complaintRecord({ apartment: "apt-b" })
        ),
      /You do not have permission to manage this complaint/
    );
  });

  it("denies non-global managers when complaint apartment scope is missing", () => {
    assert.throws(
      () =>
        assertManagerCanManageComplaint(
          manager() as any,
          complaintRecord({ apartment: null })
        ),
      /You do not have permission to manage this complaint/
    );
  });

  it("keeps global manager access to unscoped complaint records", () => {
    assert.doesNotThrow(() =>
      assertManagerCanManageComplaint(
        manager({ role: "SUPER_ADMIN", apartmentId: null }) as any,
        complaintRecord({ apartment: null })
      )
    );
  });

  it("enforces owner, staff, and unauthorized complaint access rules", () => {
    assert.doesNotThrow(() =>
      assertCanAccessComplaint(
        resident() as any,
        complaintRecord({ resident: "resident-1" })
      )
    );
    assert.doesNotThrow(() =>
      assertCanAccessComplaint(
        technicianUser() as any,
        complaintRecord({ assignedStaff: "tech-1" })
      )
    );

    assert.throws(
      () => assertCanAccessComplaint(resident({ id: "resident-2" }) as any, complaintRecord()),
      /You can only access your own complaints/
    );
    assert.throws(
      () => assertCanAccessComplaint({ id: "guest-1", role: "SECURITY_STAFF" } as any, complaintRecord()),
      /You do not have permission to access complaints/
    );
  });

  it("denies non-global managers when maintenance apartment scope is missing or different", () => {
    assert.doesNotThrow(() =>
      assertManagerCanManageMaintenance(manager() as any, maintenanceRecord())
    );

    assert.throws(
      () =>
        assertManagerCanManageMaintenance(
          manager() as any,
          maintenanceRecord({ apartment: null })
        ),
      /You do not have permission to manage maintenance for this apartment/
    );

    assert.throws(
      () =>
        assertManagerCanManageMaintenance(
          manager() as any,
          maintenanceRecord({ apartment: "apt-b" })
        ),
      /You do not have permission to manage maintenance for this apartment/
    );
  });

  it("preserves global maintenance access and role-scoped facility filters", () => {
    assert.doesNotThrow(() =>
      assertManagerCanManageMaintenance(
        manager({ role: "ADMIN", apartmentId: null }) as any,
        maintenanceRecord({ apartment: null })
      )
    );

    assert.deepEqual(
      buildTechnicianFilter({ apartmentId: "apt-a" } as any, manager() as any),
      { apartmentId: "apt-a" }
    );
    assert.throws(
      () => buildTechnicianFilter({} as any, resident() as any),
      /You do not have permission to view technicians/
    );
  });
});

describe("Facility Manager workflow rules", () => {
  it("allows valid complaint transitions and rejects invalid transitions", () => {
    assert.doesNotThrow(() => assertComplaintTransition("PENDING", "UNDER_REVIEW"));
    assert.doesNotThrow(() => assertComplaintTransition("ASSIGNED", "IN_PROGRESS"));

    assert.throws(
      () => assertComplaintTransition("PENDING", "APPROVED"),
      /Invalid status transition from PENDING to APPROVED/
    );
  });

  it("rejects terminal complaint updates", () => {
    assert.throws(
      () => assertComplaintNotTerminal(complaintRecord({ status: "CLOSED" })),
      /Complaint already closed/
    );
    assert.throws(
      () => assertComplaintNotTerminal(complaintRecord({ status: "CANCELLED" })),
      /Complaint already cancelled/
    );
  });

  it("allows valid maintenance transitions and rejects invalid transitions", () => {
    assert.doesNotThrow(() => assertMaintenanceTransition("PENDING", "ASSIGNED"));
    assert.doesNotThrow(() => assertMaintenanceTransition("IN_PROGRESS", "ON_HOLD"));

    assert.throws(
      () => assertMaintenanceTransition("PENDING", "APPROVED"),
      /Invalid status transition from PENDING to APPROVED/
    );
  });

  it("rejects terminal maintenance updates", () => {
    assert.throws(
      () => assertMaintenanceNotTerminal(maintenanceRecord({ status: "CLOSED" })),
      /Maintenance already closed/
    );
    assert.throws(
      () => assertMaintenanceNotTerminal(maintenanceRecord({ status: "CANCELLED" })),
      /Maintenance already cancelled/
    );
  });
});

describe("Technician assignment rules", () => {
  it("allows active technicians and rejects unavailable technicians", () => {
    assert.doesNotThrow(() => assertTechnicianIsAssignable({ status: "ACTIVE" }));
    assert.throws(
      () => assertTechnicianIsAssignable({ status: "INACTIVE" }),
      /Inactive technicians cannot be assigned work/
    );
    assert.throws(
      () => assertTechnicianIsAssignable({ status: "ON_LEAVE" }),
      /Technicians on leave cannot be assigned work/
    );
  });

  it("enforces technician self-access and manager access rules", () => {
    const technician = { userId: "tech-1", apartmentId: "apt-a" };

    assert.doesNotThrow(() => assertCanAccessTechnician(manager() as any, technician));
    assert.doesNotThrow(() => assertCanAccessTechnician(technicianUser() as any, technician));

    assert.throws(
      () => assertCanAccessTechnician(technicianUser({ id: "tech-2" }) as any, technician),
      /You do not have permission to access this technician/
    );
  });

  it("rejects assignment completion for work not assigned to the technician", async (t) => {
    mockMethod(t, Complaint, "findById", async () => complaintRecord({ assignedStaff: "tech-2" }));
    mockMethod(t, Maintenance, "findById", async () => maintenanceRecord({ assignedStaff: "tech-2" }));

    await assertAppError(
      () => assertComplaintAssignedToTechnician(String(new Types.ObjectId()), "tech-1"),
      "Complaint is not assigned to this technician",
      400
    );
    await assertAppError(
      () => assertMaintenanceAssignedToTechnician(String(new Types.ObjectId()), "tech-1"),
      "Maintenance is not assigned to this technician",
      400
    );
  });

  it("accepts work assigned to the technician", async (t) => {
    mockMethod(t, Complaint, "findById", async () => complaintRecord({ assignedStaff: "tech-1" }));
    mockMethod(t, Maintenance, "findById", async () => maintenanceRecord({ assignedStaff: "tech-1" }));

    assert.equal(
      (await assertComplaintAssignedToTechnician(String(new Types.ObjectId()), "tech-1")).assignedStaff,
      "tech-1"
    );
    assert.equal(
      (await assertMaintenanceAssignedToTechnician(String(new Types.ObjectId()), "tech-1")).assignedStaff,
      "tech-1"
    );
  });
});

describe("Schedule policy and conflict detection", () => {
  it("scopes schedule filters by manager apartment and technician user", () => {
    assert.deepEqual(
      buildScheduleFilter({} as any, manager() as any),
      { apartment: "apt-a" }
    );
    assert.deepEqual(
      buildScheduleFilter({} as any, technicianUser() as any),
      { technicianUserId: "tech-1" }
    );
    assert.throws(
      () => buildScheduleFilter({} as any, resident() as any),
      /You do not have permission to access schedules/
    );
  });

  it("allows assigned technicians to access their schedule only", () => {
    assert.doesNotThrow(() =>
      assertCanAccessSchedule(technicianUser() as any, {
        apartment: "apt-a",
        technicianUserId: "tech-1",
      })
    );

    assert.throws(
      () =>
        assertCanAccessSchedule(technicianUser({ id: "tech-2" }) as any, {
          apartment: "apt-a",
          technicianUserId: "tech-1",
        }),
      /You do not have permission to access this schedule/
    );
  });

  it("allows non-overlapping schedules and builds an overlap query", async (t) => {
    const technicianId = new Types.ObjectId();
    let capturedFilter: FilterShape | null = null;

    mockMethod(t, Schedule, "findOne", (filter: FilterShape) => {
      capturedFilter = filter;
      return singleQuery(null);
    });

    await ensureNoTechnicianConflict({
      technicianId: String(technicianId),
      startAt: new Date("2026-02-01T09:00:00.000Z"),
      endAt: new Date("2026-02-01T10:00:00.000Z"),
    });

    assert.ok(capturedFilter);
    const filter = capturedFilter as FilterShape;

    assert.equal(String(filter.technician), String(technicianId));
    assert.deepEqual(filter.status, {
      $in: ["SCHEDULED", "IN_PROGRESS", "RESCHEDULED"],
    });
    assert.deepEqual(filter.startAt, { $lt: new Date("2026-02-01T10:00:00.000Z") });
    assert.deepEqual(filter.endAt, { $gt: new Date("2026-02-01T09:00:00.000Z") });
  });

  it("rejects overlapping technician schedules", async (t) => {
    mockMethod(t, Schedule, "findOne", () =>
      singleQuery({ startTime: "09:30", endTime: "10:30" })
    );

    await assertAppError(
      () =>
        ensureNoTechnicianConflict({
          technicianId: String(new Types.ObjectId()),
          startAt: new Date("2026-02-01T09:00:00.000Z"),
          endAt: new Date("2026-02-01T10:00:00.000Z"),
        }),
      "Technician already has a conflicting schedule from 09:30 to 10:30",
      409
    );
  });
});

describe("Facility dashboard counts", () => {
  it("uses aggregate/count totals instead of limited preview lengths", async (t) => {
    mockAuthenticatedUserLookup(t);

    mockMethod(t, Complaint, "countDocuments", async (filter: FilterShape) => {
      if (matchesStatuses(filter, ["PENDING", "UNDER_REVIEW"])) {
        return 6;
      }

      if (includesStatuses(filter, ["PENDING", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REJECTED"])) {
        return 7;
      }

      if (includesStatuses(filter, ["WORK_COMPLETED", "AWAITING_APPROVAL"])) {
        return 6;
      }

      if (filter.status === "APPROVED" && filter["residentConfirmation.status"] === "PENDING") {
        return 6;
      }

      return 0;
    });

    mockMethod(t, Maintenance, "countDocuments", async (filter: FilterShape) => {
      if (filter.status === "PENDING") {
        return 8;
      }

      if (includesStatuses(filter, ["WORK_COMPLETED", "AWAITING_APPROVAL"])) {
        return 7;
      }

      if (filter["costReview.status"] === "SUBMITTED") {
        return 7;
      }

      return 0;
    });

    mockMethod(t, Schedule, "countDocuments", async () => 6);
    mockMethod(t, Technician, "countDocuments", async () => 3);

    mockMethod(t, Complaint, "find", (filter: FilterShape) => {
      if (includesStatuses(filter, ["PENDING", "UNDER_REVIEW"])) {
        return chainQuery(workItems(5, { status: "PENDING" }));
      }

      if (includesStatuses(filter, ["WORK_COMPLETED", "AWAITING_APPROVAL"])) {
        return chainQuery(workItems(5, { status: "WORK_COMPLETED" }));
      }

      if (filter.status === "APPROVED" && filter["residentConfirmation.status"] === "PENDING") {
        return chainQuery(workItems(5, { status: "APPROVED" }));
      }

      return chainQuery([]);
    });

    mockMethod(t, Maintenance, "find", (filter: FilterShape) => {
      if (filter.status === "PENDING") {
        return chainQuery(workItems(5, { status: "PENDING" }));
      }

      if (includesStatuses(filter, ["WORK_COMPLETED", "AWAITING_APPROVAL"])) {
        return chainQuery(workItems(5, { status: "WORK_COMPLETED" }));
      }

      if (filter["costReview.status"] === "SUBMITTED") {
        return chainQuery(workItems(5, { status: "WORK_COMPLETED" }));
      }

      return chainQuery([]);
    });

    mockMethod(t, Schedule, "find", () =>
      chainQuery(workItems(5, { status: "SCHEDULED", technicianUserId: "tech-1", endAt: new Date() }))
    );

    mockMethod(t, Notification, "find", () =>
      chainQuery([
        {
          _id: new Types.ObjectId(),
          type: "WORK_COMPLETED",
          severity: "INFO",
          title: "Work completed",
          message: "Work completed",
          relatedResourceType: "maintenance",
          relatedResourceId: String(new Types.ObjectId()),
          readAt: null,
          createdAt: new Date(),
        },
      ])
    );
    mockMethod(t, Notification, "countDocuments", async () => 9);

    const dashboard = await getFacilityDashboard(manager() as any);

    assert.equal(dashboard.stats.openComplaints, 7);
    assert.equal(dashboard.stats.pendingMaintenanceRequests, 8);
    assert.equal(dashboard.stats.pendingApprovals, 20);
    assert.equal(dashboard.stats.overdueTasks, 6);
    assert.equal(dashboard.pendingActions.unassignedComplaints.count, 6);
    assert.equal(dashboard.pendingActions.unassignedComplaints.items.length, 5);
    assert.equal(dashboard.pendingActions.tasksWaitingAssignment.count, 8);
    assert.equal(dashboard.pendingActions.tasksWaitingAssignment.items.length, 5);
    assert.equal(dashboard.pendingActions.workRequiringReview.count, 13);
    assert.equal(dashboard.pendingActions.workRequiringReview.items.length, 10);
    assert.equal(dashboard.pendingActions.submittedCostsRequiringApproval.count, 7);
    assert.equal(dashboard.pendingActions.submittedCostsRequiringApproval.items.length, 5);
    assert.equal(dashboard.pendingActions.complaintsWaitingResidentConfirmation.count, 6);
    assert.equal(dashboard.pendingActions.complaintsWaitingResidentConfirmation.items.length, 5);
    assert.equal(dashboard.overdue.count, 6);
    assert.equal(dashboard.overdue.schedules.length, 5);
    assert.equal(dashboard.notifications.unread, 9);
    assert.equal(dashboard.notifications.alerts.length, 1);
  });
});

describe("Alert and workflow notification separation", () => {
  it("creates Notification records, not Alert records, for normal complaint workflow events", async (t) => {
    const notifications: FilterShape[] = [];
    const alerts: FilterShape[] = [];
    const complaintId = new Types.ObjectId();

    mockAuthenticatedUserLookup(t);
    mockMethod(t, Complaint, "create", async (data: FilterShape) => ({
      _id: complaintId,
      ...data,
    }));
    mockMethod(t, Notification, "create", async (data: FilterShape) => {
      notifications.push(data);
      return data;
    });
    mockMethod(t, Alert, "create", async (data: FilterShape) => {
      alerts.push(data);
      return data;
    });

    await createComplaint(
      {
        title: "Kitchen sink leak",
        description: "Water is leaking under the kitchen sink cabinet.",
        category: "PLUMBING",
        priority: "HIGH",
      },
      resident() as any
    );

    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].type, "NEW_COMPLAINT");
    assert.equal(notifications[0].recipientRole, "FACILITY_MANAGER");
    assert.equal(notifications[0].relatedResourceType, "complaint");
    assert.equal(notifications[0].relatedResourceId, String(complaintId));
    assert.equal(alerts.length, 0);
  });

  it("keeps emergency alerts in the Alert module", async (t) => {
    const alerts: FilterShape[] = [];

    mockMethod(t, Alert, "create", async (data: FilterShape) => {
      alerts.push(data);
      return data;
    });

    await createAlert({
      apartment: "apt-a",
      recipientRole: "FACILITY_MANAGER",
      type: "CRITICAL_ALERT",
      severity: "ERROR",
      title: "Critical water outage",
      message: "Main water supply is unavailable.",
      createdBy: "admin-1",
    });

    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].type, "CRITICAL_ALERT");
    assert.equal(alerts[0].recipientRole, "FACILITY_MANAGER");
    assert.equal(alerts[0].apartment, "apt-a");
  });
});
