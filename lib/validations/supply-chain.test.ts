import { describe, expect, it } from "vitest";
import {
  FacilityCreateSchema,
  PartCreateSchema,
  SupplierCreateSchema,
  SupplierPartLinkUpsertSchema,
  SupplierUpdateSchema,
} from "@/lib/validations/supply-chain";

describe("supply-chain validations", () => {
  it("accepts valid supplier create payload", () => {
    const parsed = SupplierCreateSchema.safeParse({
      name: "MicroCore Semiconductors",
      regionCode: "tw",
      criticality: 5,
      isActive: true,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.regionCode).toBe("TW");
    }
  });

  it("rejects empty supplier update payload", () => {
    const parsed = SupplierUpdateSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid facility coordinates", () => {
    const parsed = FacilityCreateSchema.safeParse({
      supplierId: "d9e00a5d-0f95-4f09-bca9-eb6ad5beeb88",
      name: "Test Facility",
      latitude: 120,
      longitude: 12,
    });

    expect(parsed.success).toBe(false);
  });

  it("normalizes part number casing", () => {
    const parsed = PartCreateSchema.safeParse({
      partNumber: "mcu-9000",
      description: "controller",
      criticality: 4,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.partNumber).toBe("MCU-9000");
    }
  });

  it("validates tier level bounds", () => {
    const parsed = SupplierPartLinkUpsertSchema.safeParse({
      supplierId: "d9e00a5d-0f95-4f09-bca9-eb6ad5beeb88",
      partId: "4af01962-4458-41da-99d1-8d26af913145",
      tierLevel: 7,
    });

    expect(parsed.success).toBe(false);
  });
});
