import type { Request, Response } from "express";
import { Prisma, prisma } from "@workspace/db";
import { dodoClient, dodoWebhookKey } from "./dodo-client.ts";

type DodoEventType =
  | "payment.cancelled"
  | "payment.failed"
  | "payment.processing"
  | "payment.succeeded"
  | "subscription.active"
  | "subscription.cancelled"
  | "subscription.expired"
  | "subscription.failed"
  | "subscription.on_hold"
  | "subscription.plan_changed"
  | "subscription.renewed"
  | "subscription.updated";

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    const firstValue = value[0];
    return typeof firstValue === "string" && firstValue.trim().length > 0
      ? firstValue
      : null;
  }

  return null;
}

function getRawBody(req: Request): string {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  if (typeof req.body === "string") {
    return req.body;
  }

  return JSON.stringify(req.body ?? {});
}

function toStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toNumberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toDateValue(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getObjectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function getMetadata(data: Record<string, unknown>): Record<string, unknown> {
  return getObjectValue(data.metadata) ?? {};
}

function getCompanyId(data: Record<string, unknown>): string | null {
  const metadata = getMetadata(data);

  return (
    toStringValue(metadata.companyId) ??
    toStringValue(data.company_id) ??
    toStringValue(data.companyId) ??
    toStringValue(data.metadata_company_id)
  );
}

function getPlanId(data: Record<string, unknown>): number | null {
  const metadata = getMetadata(data);

  return (
    toNumberValue(metadata.planId) ??
    toNumberValue(metadata.plan) ??
    toNumberValue(data.planId) ??
    toNumberValue(data.plan_id)
  );
}

function getProductId(data: Record<string, unknown>): string | null {
  return toStringValue(data.product_id) ?? toStringValue(data.productId);
}

function getSubscriptionId(data: Record<string, unknown>): string | null {
  return (
    toStringValue(data.subscription_id) ??
    toStringValue(data.subscriptionId) ??
    toStringValue(data.id)
  );
}

function getCustomerId(data: Record<string, unknown>): string | null {
  const customer = getObjectValue(data.customer);

  return (
    toStringValue(data.customer_id) ??
    toStringValue(customer?.customer_id) ??
    toStringValue(customer?.id) ??
    toStringValue(customer?.customerId)
  );
}

function getPeriodStart(data: Record<string, unknown>): Date | null {
  return (
    toDateValue(data.current_period_start) ??
    toDateValue(data.period_start) ??
    toDateValue(data.start_date)
  );
}

function getPeriodEnd(data: Record<string, unknown>): Date | null {
  return (
    toDateValue(data.current_period_end) ??
    toDateValue(data.next_billing_date) ??
    toDateValue(data.period_end) ??
    toDateValue(data.expires_at)
  );
}

function getCancelAtPeriodEnd(data: Record<string, unknown>): boolean {
  return Boolean(
    data.cancel_at_period_end ??
    data.cancelAtPeriodEnd ??
    data.cancel_at_next_billing_date
  );
}

function mapSubscriptionStatus(
  eventType: DodoEventType
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "EXPIRED" {
  switch (eventType) {
    case "subscription.active":
    case "subscription.renewed":
    case "subscription.plan_changed":
      return "ACTIVE";
    case "subscription.on_hold":
    case "subscription.failed":
      return "PAST_DUE";
    case "subscription.cancelled":
      return "CANCELED";
    case "subscription.expired":
      return "EXPIRED";
    case "payment.succeeded":
    case "payment.processing":
      return "INCOMPLETE";
    default:
      return "TRIALING";
  }
}

function mapCompanyStatus(
  eventType: DodoEventType,
  data: Record<string, unknown>
): "PENDING" | "ACTIVE" | "ON_HOLD" | "DISABLED" {
  switch (eventType) {
    case "subscription.active":
    case "subscription.renewed":
    case "subscription.plan_changed":
    case "payment.succeeded":
      return "ACTIVE";
    case "subscription.on_hold":
    case "subscription.failed":
      return "ON_HOLD";
    case "subscription.cancelled":
      return getCancelAtPeriodEnd(data) ? "ON_HOLD" : "DISABLED";
    case "subscription.expired":
      return "DISABLED";
    default:
      return "PENDING";
  }
}

async function resolvePlan(data: Record<string, unknown>) {
  const planId = getPlanId(data);
  const productId = getProductId(data);

  if (typeof planId === "number") {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (plan) {
      return plan;
    }
  }

  if (productId) {
    return prisma.plan.findUnique({ where: { dodoProductId: productId } });
  }

  return null;
}

async function syncCompanySubscription(
  eventType: DodoEventType,
  data: Record<string, unknown>
) {
  const companyId = getCompanyId(data);
  const subscriptionId = getSubscriptionId(data);
  const plan = await resolvePlan(data);

  if (!companyId || !subscriptionId || !plan) {
    return;
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    return;
  }

  const status = mapSubscriptionStatus(eventType);
  const companyStatus = mapCompanyStatus(eventType, data);
  const customerId = getCustomerId(data);
  const cancelAtPeriodEnd = getCancelAtPeriodEnd(data);
  const currentPeriodStart = getPeriodStart(data);
  const currentPeriodEnd = getPeriodEnd(data);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { companyId },
      create: {
        companyId,
        planId: plan.id,
        dodoSubscriptionId: subscriptionId,
        dodoCustomerId: customerId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      },
      update: {
        planId: plan.id,
        dodoSubscriptionId: subscriptionId,
        dodoCustomerId: customerId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      },
    }),
    prisma.company.update({
      where: { id: companyId },
      data: {
        planId: plan.id,
        status: companyStatus,
      },
    }),
  ]);
}

async function recordCheckoutPayment(data: Record<string, unknown>) {
  const companyId = getCompanyId(data);
  const subscriptionId = getSubscriptionId(data);
  const plan = await resolvePlan(data);

  if (!companyId || !subscriptionId || !plan) {
    return;
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    return;
  }

  const customerId = getCustomerId(data);
  const currentPeriodStart = getPeriodStart(data);
  const currentPeriodEnd = getPeriodEnd(data);

  await prisma.subscription.upsert({
    where: { companyId },
    create: {
      companyId,
      planId: plan.id,
      dodoSubscriptionId: subscriptionId,
      dodoCustomerId: customerId,
      status: "INCOMPLETE",
      currentPeriodStart,
      currentPeriodEnd,
    },
    update: {
      planId: plan.id,
      dodoSubscriptionId: subscriptionId,
      dodoCustomerId: customerId,
      status: "INCOMPLETE",
      currentPeriodStart,
      currentPeriodEnd,
    },
  });
}

export const dodoWebhooksHandler = async (req: Request, res: Response) => {
  try {
    const webhookId = getHeaderValue(req.headers["webhook-id"]);
    const webhookSignature = getHeaderValue(req.headers["webhook-signature"]);
    const webhookTimestamp = getHeaderValue(req.headers["webhook-timestamp"]);

    if (!webhookId || !webhookSignature || !webhookTimestamp) {
      return res
        .status(400)
        .json({ error: "Missing required webhook headers" });
    }

    const existingEvent = await prisma.dodoWebhookEvent.findUnique({
      where: { webhookId },
    });

    if (existingEvent?.status === "PROCESSED") {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const payload = getRawBody(req);

    const event = dodoWebhookKey
      ? ((await dodoClient.webhooks.unwrap(payload, {
          headers: {
            "webhook-id": webhookId,
            "webhook-signature": webhookSignature,
            "webhook-timestamp": webhookTimestamp,
          },
        })) as unknown as {
          type: DodoEventType;
          data: Record<string, unknown>;
        })
      : (dodoClient.webhooks.unsafeUnwrap(payload) as unknown as {
          type: DodoEventType;
          data: Record<string, unknown>;
        });

    if (!existingEvent) {
      await prisma.dodoWebhookEvent.create({
        data: {
          webhookId,
          eventType: event.type,
          payload: event.data as Prisma.InputJsonValue,
          status: "PROCESSING",
        },
      });
    } else if (existingEvent.status !== "FAILED") {
      await prisma.dodoWebhookEvent.update({
        where: { webhookId },
        data: {
          eventType: event.type,
          payload: event.data as Prisma.InputJsonValue,
          status: "PROCESSING",
          errorMessage: null,
        },
      });
    }

    const eventType = event.type as DodoEventType;
    const eventData = event.data;

    switch (eventType) {
      case "payment.processing":
        console.log("Payment processing", eventType);
        break;

      case "payment.succeeded":
        await recordCheckoutPayment(eventData);
        break;

      case "payment.failed":
        console.log("Payment failed", eventType);
        break;

      case "payment.cancelled":
        console.log("Payment cancelled", eventType);
        break;

      case "subscription.active":
      case "subscription.updated":
      case "subscription.renewed":
      case "subscription.plan_changed":
      case "subscription.on_hold":
      case "subscription.failed":
      case "subscription.expired":
      case "subscription.cancelled":
        await syncCompanySubscription(eventType, eventData);
        break;

      default:
        console.log("Unhandled event", eventType);
    }

    await prisma.dodoWebhookEvent.upsert({
      where: { webhookId },
      create: {
        webhookId,
        eventType: event.type,
        payload: event.data as Prisma.InputJsonValue,
        status: "PROCESSED",
        processedAt: new Date(),
      },
      update: {
        eventType: event.type,
        payload: event.data as Prisma.InputJsonValue,
        status: "PROCESSED",
        processedAt: new Date(),
        errorMessage: null,
      },
    });

    return res.status(200).json({ received: true, eventData, eventType });
  } catch (error) {
    const webhookId = getHeaderValue(req.headers["webhook-id"]);

    if (webhookId) {
      await prisma.dodoWebhookEvent.upsert({
        where: { webhookId },
        create: {
          webhookId,
          eventType: "payment.failed",
          payload: {
            error: error instanceof Error ? error.message : String(error),
          } as Prisma.InputJsonValue,
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        update: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    }

    console.error("Error at dodo webhook handler", error);
    return res.status(500).json({
      error: "Webhook processing failed",
    });
  }
};
