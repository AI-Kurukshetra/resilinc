import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  SupplierPartLinkListQuery,
  SupplierPartLinkUpsertInput,
} from "@/lib/validations/supply-chain";

interface SupplierRow {
  id: string;
  name: string;
  region_code: string | null;
  criticality: number;
  is_active: boolean;
}

interface FacilityRow {
  id: string;
  name: string;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  supplier_id: string;
}

interface PartRow {
  id: string;
  part_number: string;
  description: string | null;
  criticality: number;
}

interface SupplierPartRow {
  id: string;
  part_id: string;
  supplier_id: string;
  tier_level: number;
  created_at: string;
}

interface SupplierPartTierLinkDTO {
  createdAt: string;
  id: string;
  partCriticality: number | null;
  partDescription: string | null;
  partId: string;
  partNumber: string | null;
  supplierId: string;
  supplierName: string | null;
  tierLevel: number;
}

interface SupplierPartTierLinkListDTO {
  items: SupplierPartTierLinkDTO[];
  total: number;
}

interface SupplierExposurePartDTO {
  criticality: number;
  description: string | null;
  partId: string;
  partNumber: string;
  tierLevel: number;
}

interface SupplierExposureFacilityDTO {
  countryCode: string | null;
  facilityId: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
}

interface SupplierExposureDTO {
  facilities: SupplierExposureFacilityDTO[];
  impactedParts: SupplierExposurePartDTO[];
  stats: {
    facilityCount: number;
    linkedPartCount: number;
    maxTierLevel: number;
  };
  supplier: {
    criticality: number;
    id: string;
    isActive: boolean;
    name: string;
    regionCode: string | null;
  };
}

interface SupplierNetworkNodeDTO {
  criticality: number;
  facilityCount: number;
  isActive: boolean;
  linkedPartCount: number;
  maxTierLevel: number;
  name: string;
  regionCode: string | null;
  supplierId: string;
}

class SupplyChainServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function toRows<T>(rows: T[] | null): T[] {
  return rows ?? [];
}

function toErrorMessage(error: PostgrestError | null, fallback: string): string {
  if (!error || !error.message) {
    return fallback;
  }

  return error.message;
}

async function getSupplierById(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
): Promise<SupplierRow | null> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, region_code, criticality, is_active")
    .eq("organization_id", organizationId)
    .eq("id", supplierId)
    .maybeSingle();

  if (error) {
    throw new SupplyChainServiceError(
      "SUPPLIER_LOOKUP_FAILED",
      toErrorMessage(error, "Could not load supplier."),
      500,
    );
  }

  return (data as SupplierRow | null) ?? null;
}

async function getPartById(
  supabase: SupabaseClient,
  organizationId: string,
  partId: string,
): Promise<PartRow | null> {
  const { data, error } = await supabase
    .from("parts")
    .select("id, part_number, description, criticality")
    .eq("organization_id", organizationId)
    .eq("id", partId)
    .maybeSingle();

  if (error) {
    throw new SupplyChainServiceError(
      "PART_LOOKUP_FAILED",
      toErrorMessage(error, "Could not load part."),
      500,
    );
  }

  return (data as PartRow | null) ?? null;
}

export async function upsertSupplierPartTierLink(
  supabase: SupabaseClient,
  organizationId: string,
  input: SupplierPartLinkUpsertInput,
): Promise<SupplierPartTierLinkDTO> {
  const supplier = await getSupplierById(supabase, organizationId, input.supplierId);
  if (!supplier) {
    throw new SupplyChainServiceError("SUPPLIER_NOT_FOUND", "Supplier not found.", 404);
  }

  const part = await getPartById(supabase, organizationId, input.partId);
  if (!part) {
    throw new SupplyChainServiceError("PART_NOT_FOUND", "Part not found.", 404);
  }

  const { data, error } = await supabase
    .from("supplier_parts")
    .upsert(
      {
        organization_id: organizationId,
        part_id: input.partId,
        supplier_id: input.supplierId,
        tier_level: input.tierLevel,
      },
      {
        ignoreDuplicates: false,
        onConflict: "supplier_id,part_id",
      },
    )
    .select("id, supplier_id, part_id, tier_level, created_at")
    .single();

  if (error || !data) {
    throw new SupplyChainServiceError(
      "SUPPLIER_PART_LINK_UPSERT_FAILED",
      toErrorMessage(error, "Failed to create supplier-part link."),
      500,
    );
  }

  const link = data as SupplierPartRow;

  return {
    createdAt: link.created_at,
    id: link.id,
    partCriticality: part.criticality,
    partDescription: part.description,
    partId: link.part_id,
    partNumber: part.part_number,
    supplierId: link.supplier_id,
    supplierName: supplier.name,
    tierLevel: link.tier_level,
  };
}

export async function deleteSupplierPartTierLink(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
  partId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("supplier_parts")
    .delete()
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId)
    .eq("part_id", partId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new SupplyChainServiceError(
      "SUPPLIER_PART_LINK_DELETE_FAILED",
      toErrorMessage(error, "Failed to delete supplier-part link."),
      500,
    );
  }

  if (!data) {
    throw new SupplyChainServiceError(
      "SUPPLIER_PART_LINK_NOT_FOUND",
      "Supplier-part link was not found.",
      404,
    );
  }
}

export async function listSupplierPartTierLinks(
  supabase: SupabaseClient,
  organizationId: string,
  query: SupplierPartLinkListQuery,
): Promise<SupplierPartTierLinkListDTO> {
  let dbQuery = supabase
    .from("supplier_parts")
    .select("id, supplier_id, part_id, tier_level, created_at", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("tier_level", { ascending: true })
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.supplierId) {
    dbQuery = dbQuery.eq("supplier_id", query.supplierId);
  }

  if (query.partId) {
    dbQuery = dbQuery.eq("part_id", query.partId);
  }

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new SupplyChainServiceError(
      "SUPPLIER_PART_LINK_LIST_FAILED",
      toErrorMessage(error, "Failed to list supplier-part links."),
      500,
    );
  }

  const links = toRows(data as SupplierPartRow[] | null);
  const supplierIds = [...new Set(links.map((row) => row.supplier_id))];
  const partIds = [...new Set(links.map((row) => row.part_id))];

  const { data: suppliersData, error: suppliersError } = supplierIds.length
    ? await supabase
        .from("suppliers")
        .select("id, name")
        .eq("organization_id", organizationId)
        .in("id", supplierIds)
    : { data: [], error: null };

  if (suppliersError) {
    throw new SupplyChainServiceError(
      "SUPPLIER_LOOKUP_FAILED",
      toErrorMessage(suppliersError, "Failed to lookup suppliers."),
      500,
    );
  }

  const { data: partsData, error: partsError } = partIds.length
    ? await supabase
        .from("parts")
        .select("id, part_number, description, criticality")
        .eq("organization_id", organizationId)
        .in("id", partIds)
    : { data: [], error: null };

  if (partsError) {
    throw new SupplyChainServiceError(
      "PART_LOOKUP_FAILED",
      toErrorMessage(partsError, "Failed to lookup parts."),
      500,
    );
  }

  const supplierNameById = new Map<string, string>();
  toRows(suppliersData as Array<{ id: string; name: string }> | null).forEach((supplier) => {
    supplierNameById.set(supplier.id, supplier.name);
  });

  const partById = new Map<string, PartRow>();
  toRows(partsData as PartRow[] | null).forEach((part) => {
    partById.set(part.id, part);
  });

  return {
    items: links.map((link) => {
      const part = partById.get(link.part_id);
      return {
        createdAt: link.created_at,
        id: link.id,
        partCriticality: part?.criticality ?? null,
        partDescription: part?.description ?? null,
        partId: link.part_id,
        partNumber: part?.part_number ?? null,
        supplierId: link.supplier_id,
        supplierName: supplierNameById.get(link.supplier_id) ?? null,
        tierLevel: link.tier_level,
      };
    }),
    total: count ?? links.length,
  };
}

export async function getSupplierExposure(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
  includeInactive: boolean,
): Promise<SupplierExposureDTO> {
  const supplier = await getSupplierById(supabase, organizationId, supplierId);
  if (!supplier) {
    throw new SupplyChainServiceError("SUPPLIER_NOT_FOUND", "Supplier not found.", 404);
  }

  if (!includeInactive && !supplier.is_active) {
    throw new SupplyChainServiceError(
      "SUPPLIER_INACTIVE",
      "Supplier is inactive and hidden from exposure view.",
      404,
    );
  }

  const { data: facilitiesData, error: facilitiesError } = await supabase
    .from("facilities")
    .select("id, name, country_code, latitude, longitude, supplier_id")
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId)
    .order("name", { ascending: true });

  if (facilitiesError) {
    throw new SupplyChainServiceError(
      "FACILITY_LOOKUP_FAILED",
      toErrorMessage(facilitiesError, "Could not load supplier facilities."),
      500,
    );
  }

  const { data: linksData, error: linksError } = await supabase
    .from("supplier_parts")
    .select("id, supplier_id, part_id, tier_level, created_at")
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId)
    .order("tier_level", { ascending: true });

  if (linksError) {
    throw new SupplyChainServiceError(
      "SUPPLIER_PART_LINK_LIST_FAILED",
      toErrorMessage(linksError, "Could not load supplier-part links."),
      500,
    );
  }

  const links = toRows(linksData as SupplierPartRow[] | null);
  const partIds = [...new Set(links.map((row) => row.part_id))];

  const { data: partsData, error: partsError } = partIds.length
    ? await supabase
        .from("parts")
        .select("id, part_number, description, criticality")
        .eq("organization_id", organizationId)
        .in("id", partIds)
    : { data: [], error: null };

  if (partsError) {
    throw new SupplyChainServiceError(
      "PART_LOOKUP_FAILED",
      toErrorMessage(partsError, "Could not load linked parts."),
      500,
    );
  }

  const partById = new Map<string, PartRow>();
  toRows(partsData as PartRow[] | null).forEach((part) => {
    partById.set(part.id, part);
  });

  const impactedParts: SupplierExposurePartDTO[] = links
    .map((link) => {
      const part = partById.get(link.part_id);
      if (!part) {
        return null;
      }

      return {
        criticality: part.criticality,
        description: part.description,
        partId: part.id,
        partNumber: part.part_number,
        tierLevel: link.tier_level,
      };
    })
    .filter((item): item is SupplierExposurePartDTO => Boolean(item))
    .sort((left, right) => {
      if (left.tierLevel !== right.tierLevel) {
        return left.tierLevel - right.tierLevel;
      }

      return right.criticality - left.criticality;
    });

  const facilities = toRows(facilitiesData as FacilityRow[] | null).map((facility) => ({
    countryCode: facility.country_code,
    facilityId: facility.id,
    latitude: facility.latitude,
    longitude: facility.longitude,
    name: facility.name,
  }));

  return {
    facilities,
    impactedParts,
    stats: {
      facilityCount: facilities.length,
      linkedPartCount: impactedParts.length,
      maxTierLevel: impactedParts.reduce((currentMax, part) => Math.max(currentMax, part.tierLevel), 0),
    },
    supplier: {
      criticality: supplier.criticality,
      id: supplier.id,
      isActive: supplier.is_active,
      name: supplier.name,
      regionCode: supplier.region_code,
    },
  };
}

export async function listSupplierNetworkOverview(
  supabase: SupabaseClient,
  organizationId: string,
  includeInactive: boolean,
): Promise<SupplierNetworkNodeDTO[]> {
  let suppliersQuery = supabase
    .from("suppliers")
    .select("id, name, region_code, criticality, is_active")
    .eq("organization_id", organizationId)
    .order("criticality", { ascending: false })
    .order("name", { ascending: true });

  if (!includeInactive) {
    suppliersQuery = suppliersQuery.eq("is_active", true);
  }

  const { data: suppliersData, error: suppliersError } = await suppliersQuery;

  if (suppliersError) {
    throw new SupplyChainServiceError(
      "SUPPLIER_LIST_FAILED",
      toErrorMessage(suppliersError, "Failed to list suppliers."),
      500,
    );
  }

  const suppliers = toRows(suppliersData as SupplierRow[] | null);
  if (suppliers.length === 0) {
    return [];
  }

  const supplierIds = suppliers.map((supplier) => supplier.id);

  const { data: facilitiesData, error: facilitiesError } = await supabase
    .from("facilities")
    .select("id, supplier_id")
    .eq("organization_id", organizationId)
    .in("supplier_id", supplierIds);

  if (facilitiesError) {
    throw new SupplyChainServiceError(
      "FACILITY_LIST_FAILED",
      toErrorMessage(facilitiesError, "Failed to list facilities."),
      500,
    );
  }

  const { data: linksData, error: linksError } = await supabase
    .from("supplier_parts")
    .select("supplier_id, part_id, tier_level")
    .eq("organization_id", organizationId)
    .in("supplier_id", supplierIds);

  if (linksError) {
    throw new SupplyChainServiceError(
      "SUPPLIER_PART_LINK_LIST_FAILED",
      toErrorMessage(linksError, "Failed to list supplier-part links."),
      500,
    );
  }

  const facilityCountBySupplier = new Map<string, number>();
  toRows(facilitiesData as Array<{ id: string; supplier_id: string }> | null).forEach((row) => {
    facilityCountBySupplier.set(
      row.supplier_id,
      (facilityCountBySupplier.get(row.supplier_id) ?? 0) + 1,
    );
  });

  const partSetBySupplier = new Map<string, Set<string>>();
  const maxTierBySupplier = new Map<string, number>();

  toRows(linksData as Array<{ supplier_id: string; part_id: string; tier_level: number }> | null).forEach(
    (row) => {
      const partSet = partSetBySupplier.get(row.supplier_id) ?? new Set<string>();
      partSet.add(row.part_id);
      partSetBySupplier.set(row.supplier_id, partSet);

      const currentMax = maxTierBySupplier.get(row.supplier_id) ?? 0;
      maxTierBySupplier.set(row.supplier_id, Math.max(currentMax, row.tier_level));
    },
  );

  return suppliers.map((supplier) => ({
    criticality: supplier.criticality,
    facilityCount: facilityCountBySupplier.get(supplier.id) ?? 0,
    isActive: supplier.is_active,
    linkedPartCount: partSetBySupplier.get(supplier.id)?.size ?? 0,
    maxTierLevel: maxTierBySupplier.get(supplier.id) ?? 0,
    name: supplier.name,
    regionCode: supplier.region_code,
    supplierId: supplier.id,
  }));
}

export { SupplyChainServiceError };
export type {
  SupplierExposureDTO,
  SupplierNetworkNodeDTO,
  SupplierPartTierLinkDTO,
  SupplierPartTierLinkListDTO,
};
