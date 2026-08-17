"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CREATOR_CAPABILITY_CATALOG,
  creatorErrorFromUnknown,
  type CoreConnectionState,
  type CreatorCapabilitiesEnvelope,
} from "./contracts";

type CreatorIntegrationContextValue = {
  state: CoreConnectionState;
  refresh: () => void;
};

const CreatorIntegrationContext = createContext<CreatorIntegrationContextValue>({
  state: { status: "loading" },
  refresh: () => undefined,
});

function isValidCapabilities(value: unknown): value is CreatorCapabilitiesEnvelope {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<CreatorCapabilitiesEnvelope>;
  if (
    envelope.ok !== true ||
    envelope.schemaVersion !== "creator.public.capabilities.v1" ||
    envelope.apiVersion !== "v1" ||
    !Array.isArray(envelope.capabilities) ||
    envelope.capabilities.length !== CREATOR_CAPABILITY_CATALOG.length
  ) {
    return false;
  }
  return CREATOR_CAPABILITY_CATALOG.every(
    ([id, name], index) =>
      envelope.capabilities?.[index]?.id === id &&
      envelope.capabilities[index]?.name === name &&
      ["available", "authority_required", "not_open"].includes(
        envelope.capabilities[index]?.state ?? "",
      ) &&
      Array.isArray(envelope.capabilities[index]?.publicResources) &&
      envelope.capabilities[index].publicResources.every(
        (resource) => typeof resource === "string",
      ) &&
      Array.isArray(envelope.capabilities[index]?.requirements) &&
      envelope.capabilities[index].requirements.every(
        (requirement) => typeof requirement === "string",
      ),
  );
}

export function CreatorIntegrationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CoreConnectionState>({ status: "loading" });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => {
    setState({ status: "loading" });
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/creator/capabilities", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !isValidCapabilities(payload)) {
          const error = creatorErrorFromUnknown(payload, "capability_contract_mismatch");
          const status =
            error.code === "core_disconnected" || error.code === "core_timeout"
              ? "disconnected"
              : "error";
          setState({ status, error });
          return;
        }
        setState({ status: "connected", capabilities: payload.capabilities });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "disconnected",
          error: {
            code: "core_disconnected",
            message:
              error instanceof Error && error.name === "AbortError"
                ? "Core 连接检查已取消。"
                : "当前无法连接 Creator Core。",
          },
        });
      });

    return () => controller.abort();
  }, [revision]);

  const value = useMemo(() => ({ state, refresh }), [refresh, state]);
  return (
    <CreatorIntegrationContext.Provider value={value}>
      {children}
    </CreatorIntegrationContext.Provider>
  );
}

export function useCreatorIntegration() {
  return useContext(CreatorIntegrationContext);
}
