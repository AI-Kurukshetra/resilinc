import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

interface SupplierDto {
  id: string;
  name: string;
}

interface AlertDto {
  id: string;
  status: "open" | "acknowledged" | "resolved";
  supplierId: string | null;
  title: string;
}

interface IncidentDto {
  id: string;
  status: "open" | "in_progress" | "closed";
  alertId: string | null;
}

interface IncidentActionDto {
  id: string;
  status: "todo" | "doing" | "done" | "blocked";
}

interface IncidentDetailDto {
  id: string;
  status: "open" | "in_progress" | "closed";
  actions: IncidentActionDto[];
}

async function readSuccessJson<T>(response: APIResponse): Promise<T> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!response.ok()) {
    throw new Error(
      payload.ok ? `Unexpected API failure (${response.status()})` : payload.error.message,
    );
  }

  if (!payload.ok) {
    throw new Error(`${payload.error.code}: ${payload.error.message}`);
  }

  return payload.data;
}

async function listAlertsForSupplier(
  request: APIRequestContext,
  supplierId: string,
  status?: "open" | "acknowledged" | "resolved",
): Promise<AlertDto[]> {
  const params = new URLSearchParams({ limit: "25", supplierId });
  if (status) {
    params.set("status", status);
  }

  const response = await request.get(`/api/alerts?${params.toString()}`);
  const data = await readSuccessJson<{ items: AlertDto[] }>(response);
  return data.items;
}

async function listIncidentsForAlert(
  request: APIRequestContext,
  alertId: string,
): Promise<IncidentDto[]> {
  const params = new URLSearchParams({ alertId, limit: "25" });
  const response = await request.get(`/api/incidents?${params.toString()}`);
  const data = await readSuccessJson<{ items: IncidentDto[] }>(response);
  return data.items;
}

async function getIncidentDetail(
  request: APIRequestContext,
  incidentId: string,
): Promise<IncidentDetailDto> {
  const response = await request.get(`/api/incidents/${incidentId}`);
  return await readSuccessJson<IncidentDetailDto>(response);
}

async function postActionStatus(
  request: APIRequestContext,
  incidentId: string,
  actionId: string,
  status: "todo" | "doing" | "done" | "blocked",
) {
  const response = await request.post(
    `/api/incidents/${incidentId}/actions/${actionId}/status`,
    { data: { status } },
  );
  await readSuccessJson(response);
}

async function moveActionToDone(
  request: APIRequestContext,
  incidentId: string,
  action: IncidentActionDto,
) {
  if (action.status === "done") {
    return;
  }

  if (action.status === "todo" || action.status === "blocked") {
    await postActionStatus(request, incidentId, action.id, "doing");
  }

  await postActionStatus(request, incidentId, action.id, "done");
}

test.describe("Core end-to-end journeys", () => {
  test("overview renders dashboard essentials", async ({ page }) => {
    await page.goto("/overview");

    await expect(
      page.getByRole("heading", { name: "Overview dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Latest disruptions")).toBeVisible();
    await expect(page.getByRole("link", { name: "Severity 4+" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Suppliers" })).toBeVisible();
  });

  test("risk ingestion drives alert lifecycle and incident closure", async ({
    page,
    request,
  }) => {
    const uniqueSuffix = `${Date.now()}-${test.info().workerIndex}`;
    const supplierName = `E2E Supplier ${uniqueSuffix}`;
    const sourceName = `Playwright ${uniqueSuffix}`;

    const createSupplierResponse = await request.post("/api/suppliers", {
      data: {
        criticality: 5,
        isActive: true,
        name: supplierName,
        regionCode: "US-CA",
      },
    });
    const supplier = await readSuccessJson<SupplierDto>(createSupplierResponse);

    const ingestResponse = await request.post("/api/risk-events", {
      data: {
        affectedSupplierIds: [supplier.id],
        autoEnrich: false,
        confidence: 1,
        eventType: "natural_disaster",
        impactLevel: 5,
        observedAt: new Date().toISOString(),
        regionCode: "US-CA",
        severity: 5,
        sourceName,
        summary: `Critical disruption detected for ${supplierName}`,
      },
    });
    await readSuccessJson(ingestResponse);

    await expect
      .poll(
        async () => {
          const alerts = await listAlertsForSupplier(request, supplier.id, "open");
          return alerts.length > 0;
        },
        { timeout: 30_000 },
      )
      .toBe(true);

    const openAlerts = await listAlertsForSupplier(request, supplier.id, "open");
    const alert = openAlerts[0];
    if (!alert) {
      throw new Error("Expected at least one open alert after risk ingestion.");
    }

    await page.goto(`/alerts/${alert.id}`);
    await expect(page.getByRole("heading", { name: alert.title })).toBeVisible();
    await page.getByLabel("Acknowledge note").fill("E2E acknowledgement note");
    await page.getByRole("button", { name: "Acknowledge alert" }).click();

    await expect
      .poll(
        async () => {
          const alerts = await listAlertsForSupplier(request, supplier.id, "acknowledged");
          return alerts.some((item) => item.id === alert.id);
        },
        { timeout: 20_000 },
      )
      .toBe(true);

    let incidentId = "";
    try {
      await expect
        .poll(
          async () => {
            const incidents = await listIncidentsForAlert(request, alert.id);
            return incidents[0]?.id ?? "";
          },
          { timeout: 10_000 },
        )
        .not.toBe("");

      incidentId = (await listIncidentsForAlert(request, alert.id))[0]?.id ?? "";
    } catch {
      const createIncidentResponse = await request.post("/api/incidents/from-alert", {
        data: {
          alertId: alert.id,
          allowLowSeverity: true,
        },
      });

      const created = await readSuccessJson<{ incident: { id: string } }>(createIncidentResponse);
      incidentId = created.incident.id;
    }

    await page.getByLabel("Resolution note").fill("Mitigation complete");
    await page.getByRole("button", { name: "Resolve alert" }).click();

    await expect
      .poll(
        async () => {
          const alerts = await listAlertsForSupplier(request, supplier.id, "resolved");
          return alerts.some((item) => item.id === alert.id);
        },
        { timeout: 20_000 },
      )
      .toBe(true);

    const incidentDetail = await getIncidentDetail(request, incidentId);
    for (const action of incidentDetail.actions) {
      await moveActionToDone(request, incidentDetail.id, action);
    }

    await page.goto(`/incidents/${incidentDetail.id}`);
    await page.getByRole("button", { name: "Close Incident" }).click();

    await expect
      .poll(
        async () => {
          const refreshed = await getIncidentDetail(request, incidentDetail.id);
          return refreshed.status;
        },
        { timeout: 20_000 },
      )
      .toBe("closed");

    await expect(page.getByText("closed")).toBeVisible();
  });
});
