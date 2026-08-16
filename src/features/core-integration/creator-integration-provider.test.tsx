import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CREATOR_CAPABILITY_CATALOG } from "./contracts";
import {
  CreatorIntegrationProvider,
  useCreatorIntegration,
} from "./creator-integration-provider";

function capabilityPayload() {
  return {
    ok: true,
    schemaVersion: "creator.public.capabilities.v1",
    apiVersion: "v1",
    capabilities: CREATOR_CAPABILITY_CATALOG.map(([id, name], index) => ({
      id,
      name,
      state: index < 5 ? "available" : index === 5 ? "authority_required" : "not_open",
      publicResources: index < 6 ? [`resource-${id}`] : [],
      requirements: [],
    })),
  };
}

function Probe() {
  const { state } = useCreatorIntegration();
  return (
    <div>
      <span>{state.status}</span>
      {state.status === "connected" ? <span>{state.capabilities.length} capabilities</span> : null}
      {state.status === "disconnected" || state.status === "error" ? (
        <span>{state.error.code}</span>
      ) : null}
    </div>
  );
}

function renderProvider() {
  return render(
    <CreatorIntegrationProvider>
      <Probe />
    </CreatorIntegrationProvider>,
  );
}

describe("CreatorIntegrationProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects only after validating the complete M1-M19 public contract", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(capabilityPayload()));

    renderProvider();

    expect(await screen.findByText("connected")).toBeInTheDocument();
    expect(screen.getByText("19 capabilities")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/creator/capabilities",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("rejects a structurally valid-looking but drifted capability contract", async () => {
    const validPayload = capabilityPayload();
    const payload = {
      ...validPayload,
      capabilities: validPayload.capabilities.map((capability, index) =>
        index === 6 ? { ...capability, name: "Invented Capability" } : capability,
      ),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(payload));

    renderProvider();

    expect(await screen.findByText("error")).toBeInTheDocument();
    expect(screen.getByText("capability_contract_mismatch")).toBeInTheDocument();
  });

  it("reports transport failure as disconnected without fixture substitution", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("connection refused"));

    renderProvider();

    await waitFor(() => expect(screen.getByText("disconnected")).toBeInTheDocument());
    expect(screen.getByText("core_disconnected")).toBeInTheDocument();
  });
});
