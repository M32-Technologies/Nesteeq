import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { Subscription } from "../subscription/subscription.model.js";
import {
    getSubscriptionStats,
    getSubscriptionAnalytics,
    getSingleSubscription,
} from "./services/subscription.service.js";
import {
    getSubscriptionStatsHandler,
    getSubscriptionAnalyticsHandler,
} from "./controller/subscription.controller.js";
import {
    getAllSubscriptionsQuerySchema,
    subscriptionAnalyticsQuerySchema,
} from "./validation/subscription.validation.js";
import { Request, Response } from "express";

describe("Admin Subscription Stats", () => {
    it("returns zeros when no subscriptions exist", async () => {
        const aggregateMock = mock.method(Subscription, "aggregate", async () => []);

        const stats = await getSubscriptionStats();

        assert.deepEqual(stats, {
            total: 0,
            created: 0,
            authenticated: 0,
            active: 0,
            pending: 0,
            halted: 0,
            cancelled: 0,
            completed: 0,
            expired: 0,
        });

        aggregateMock.mock.restore();
    });

    it("returns correct counts from aggregation", async () => {
        const mockResult = [
            {
                total: 20,
                created: 2,
                authenticated: 1,
                active: 10,
                pending: 1,
                halted: 0,
                cancelled: 3,
                completed: 2,
                expired: 1,
            },
        ];

        const aggregateMock = mock.method(Subscription, "aggregate", async () => mockResult);

        const stats = await getSubscriptionStats();

        assert.equal(stats.total, 20);
        assert.equal(stats.active, 10);
        assert.equal(stats.cancelled, 3);

        const statusSum =
            stats.created + stats.authenticated + stats.active +
            stats.pending + stats.halted + stats.cancelled +
            stats.completed + stats.expired;
        assert.equal(statusSum <= stats.total, true);

        aggregateMock.mock.restore();
    });

    it("stats controller responds with 200 and standard format", async () => {
        const mockResult = [
            {
                total: 5,
                created: 0,
                authenticated: 0,
                active: 3,
                pending: 0,
                halted: 0,
                cancelled: 1,
                completed: 1,
                expired: 0,
            },
        ];

        const aggregateMock = mock.method(Subscription, "aggregate", async () => mockResult);

        let statusCode: number | null = null;
        let jsonPayload: unknown = null;

        const req = {} as Request;
        const next = () => {};

        await new Promise<void>((resolve) => {
            const res = {
                status(code: number) { statusCode = code; return this; },
                json(payload: unknown) { jsonPayload = payload; resolve(); return this; },
            } as unknown as Response;
            getSubscriptionStatsHandler(req, res, next);
        });

        assert.equal(statusCode, 200);
        assert.equal((jsonPayload as { success: boolean }).success, true);
        assert.equal((jsonPayload as { data: { total: number } }).data.total, 5);

        aggregateMock.mock.restore();
    });
});

describe("Admin Subscription Analytics", () => {
    it("defaults to 6m and returns 6 months with zero counts", async () => {
        const aggregateMock = mock.method(Subscription, "aggregate", async () => []);

        const result = await getSubscriptionAnalytics({});

        assert.equal(result.range, "6m");
        assert.equal(result.interval, "month");
        assert.equal(result.subscriptions.length, 6);
        for (const item of result.subscriptions) {
            assert.equal(item.count, 0);
            assert.match(item.period, /^[A-Z][a-z]{2} \d{4}$/);
        }

        aggregateMock.mock.restore();
    });

    it("handles 3m range returning 3 periods", async () => {
        const aggregateMock = mock.method(Subscription, "aggregate", async () => []);

        const result = await getSubscriptionAnalytics({ range: "3m" });

        assert.equal(result.range, "3m");
        assert.equal(result.subscriptions.length, 3);

        aggregateMock.mock.restore();
    });

    it("handles 12m range returning 12 periods", async () => {
        const aggregateMock = mock.method(Subscription, "aggregate", async () => []);

        const result = await getSubscriptionAnalytics({ range: "12m" });

        assert.equal(result.range, "12m");
        assert.equal(result.subscriptions.length, 12);

        aggregateMock.mock.restore();
    });

    it("fills missing months with zero and maps real counts", async () => {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth();

        const currentKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
        const dTwoMonthsAgo = new Date(Date.UTC(currentYear, currentMonth - 2, 1));
        const twoMonthsAgoKey = `${dTwoMonthsAgo.getUTCFullYear()}-${String(dTwoMonthsAgo.getUTCMonth() + 1).padStart(2, "0")}`;

        const mockResults = [
            { _id: twoMonthsAgoKey, count: 3 },
            { _id: currentKey, count: 7 },
        ];

        const aggregateMock = mock.method(Subscription, "aggregate", async () => mockResults);

        const result = await getSubscriptionAnalytics({ range: "3m" });

        assert.equal(result.subscriptions.length, 3);
        assert.equal(result.subscriptions[0].count, 3);
        assert.equal(result.subscriptions[1].count, 0);
        assert.equal(result.subscriptions[2].count, 7);

        aggregateMock.mock.restore();
    });

    it("analytics controller responds with 200 and standard format", async () => {
        const aggregateMock = mock.method(Subscription, "aggregate", async () => []);

        let statusCode: number | null = null;
        let jsonPayload: unknown = null;

        const req = { query: { range: "3m" } } as unknown as Request;
        const next = () => {};

        await new Promise<void>((resolve) => {
            const res = {
                status(code: number) { statusCode = code; return this; },
                json(payload: unknown) { jsonPayload = payload; resolve(); return this; },
            } as unknown as Response;
            getSubscriptionAnalyticsHandler(req, res, next);
        });

        assert.equal(statusCode, 200);
        assert.equal((jsonPayload as { success: boolean }).success, true);
        assert.equal((jsonPayload as { data: { subscriptions: unknown[] } }).data.subscriptions.length, 3);

        aggregateMock.mock.restore();
    });
});

describe("Admin Subscription Validation", () => {
    it("getAllSubscriptions schema applies defaults and validates status enum", () => {
        const defaultParsed = getAllSubscriptionsQuerySchema.safeParse({ query: {} });
        assert.equal(defaultParsed.success, true);
        if (defaultParsed.success) {
            assert.equal(defaultParsed.data.query.page, 1);
            assert.equal(defaultParsed.data.query.limit, 10);
            assert.equal(defaultParsed.data.query.sortBy, "createdAt");
            assert.equal(defaultParsed.data.query.sortOrder, "desc");
        }

        const validStatus = getAllSubscriptionsQuerySchema.safeParse({
            query: { status: "active" },
        });
        assert.equal(validStatus.success, true);

        const invalidStatus = getAllSubscriptionsQuerySchema.safeParse({
            query: { status: "nonexistent" },
        });
        assert.equal(invalidStatus.success, false);
    });

    it("analytics schema accepts valid ranges and rejects invalid", () => {
        const defaultParsed = subscriptionAnalyticsQuerySchema.safeParse({ query: {} });
        assert.equal(defaultParsed.success, true);
        if (defaultParsed.success) {
            assert.equal(defaultParsed.data.query.range, "6m");
        }

        const valid3m = subscriptionAnalyticsQuerySchema.safeParse({ query: { range: "3m" } });
        assert.equal(valid3m.success, true);

        const invalid = subscriptionAnalyticsQuerySchema.safeParse({ query: { range: "5m" } });
        assert.equal(invalid.success, false);
    });
});

describe("Admin Single Subscription", () => {
    it("throws 400 for invalid subscription ID", async () => {
        await assert.rejects(
            () => getSingleSubscription("invalid-id"),
            (err: Error & { statusCode?: number }) => {
                assert.equal(err.statusCode, 400);
                assert.match(err.message, /Invalid subscription ID/i);
                return true;
            }
        );
    });

    it("throws 404 when subscription not found", async () => {
        const findByIdMock = mock.method(Subscription, "findById", () => ({
            populate: () => ({
                lean: async () => null,
            }),
        }));

        await assert.rejects(
            () => getSingleSubscription("507f1f77bcf86cd799439011"),
            (err: Error & { statusCode?: number }) => {
                assert.equal(err.statusCode, 404);
                assert.match(err.message, /Subscription not found/i);
                return true;
            }
        );

        findByIdMock.mock.restore();
    });

    it("returns subscription with Razorpay internals stripped except razorpaySubscriptionId", async () => {
        const mockSubscription = {
            _id: "507f1f77bcf86cd799439011",
            apartment: { _id: "a1", name: "Test Apt", city: "Manjeri", state: "Kerala" },
            planSnapshot: { planName: "Professional", price: 4999, currency: "INR", planType: "MONTHLY", durationMonths: 1 },
            status: "active",
            razorpaySubscriptionId: "sub_123",
            razorpayPlanId: "plan_123",
            razorpayCustomerId: "cust_123",
            notes: { key: "value" },
            authAttempts: 0,
            hasScheduledChanges: false,
            scheduleChangeAt: null,
            currentStart: new Date(),
            currentEnd: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const findByIdMock = mock.method(Subscription, "findById", () => ({
            populate: () => ({
                lean: async () => mockSubscription,
            }),
        }));

        const result = await getSingleSubscription("507f1f77bcf86cd799439011");

        // razorpaySubscriptionId should be present (for admin cross-reference)
        assert.equal(result.razorpaySubscriptionId, "sub_123");
        // Razorpay internals should be stripped
        assert.equal("razorpayPlanId" in result, false);
        assert.equal("razorpayCustomerId" in result, false);
        assert.equal("notes" in result, false);
        assert.equal("authAttempts" in result, false);
        assert.equal("hasScheduledChanges" in result, false);
        assert.equal("scheduleChangeAt" in result, false);

        findByIdMock.mock.restore();
    });
});
