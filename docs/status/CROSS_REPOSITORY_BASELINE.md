# Frontend/Core Cross-Repository Baseline

Status: `CURRENT / DOCUMENTATION ALIGNMENT`

Reviewed: `2026-09-02`

## 1. Frozen repositories and behavior tag

```text
CORE_ACCEPTED_BEHAVIOR_COMMIT=a455c8e76427d53d75bb7f15259b9875d9768914
CORE_ACCEPTED_BEHAVIOR_TREE=d92159d5c3c5d3896d1fe9e56b896413277fe4e8
M13_BASE_TAG=m13-base-backend-v1
M13_BASE_TAG_OBJECT=b2d086b622bdb5456f6af325e458aa3771e43e80
M13_BASE_TAG_TARGET=a455c8e76427d53d75bb7f15259b9875d9768914

FRONTEND_MAIN=a0be9edc91437bf0e7c5dd14883e656e750b3aee
FRONTEND_TREE=c25b9e3744d561c93fed26d0a07e59a1915a6071

FRONTEND_CI_CORE_PIN_SHA=5c9ea7fe6993eddb7a492b2ae8f6bd8c2d5ae326
FRONTEND_CI_CORE_PIN_TREE=de6d43a16f97c1e34dc536336d05b0174d9aab39
```

Documentation-only merges may advance `main`. The accepted annotated tag remains
immutable, and this governance task does not change the Frontend CI pin.

## 2. Pin meaning

The Frontend CI pin is the exact Core dependency used by the existing browser gates.
It sits in the accepted M13 renderer-v3 lineage but is not the later documentation
closeout tag target. Passing against that pin proves the tested adapter/UI behavior at
the pin. It does not mean:

- every Frontend M12 or M13 product surface is implemented;
- a Timeline Studio, Effect Inspector or RenderCandidate review experience exists;
- M14 QC/Approval or M15 Master/Export is implemented;
- a provider, GPU, production runtime or publication authority exists.

```text
FRONTEND_PIN_CHANGED=false
FRONTEND_PIN_PROVES_PRODUCT_COMPLETION=false
```

## 3. Current M12/M13 truth

```text
M12_DOMAIN_CONTRACT=MERGED_IN_CORE
M12_RUNTIME_PROTOCOL=MERGED_IN_CORE
M12_RUNTIME_INSTALLED=false
M12_RUNTIME_G0=NOT_COMPLETE
M12_FRONTEND=UNVERIFIED
M12_PRODUCT=NOT_COMPLETE

M13_BASE_ARCHITECTURE=ACCEPTED
M13_BASE_BACKEND=COMPLETE
M13_BASE_RUNTIME_CPU=VERIFIED
M13_BASE_CLOSEOUT=ACCEPTED
M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE
M13_EXTENSION_CATALOG=NOT_AUTHORIZED
M13_M14_M15_INTEGRATION=NOT_AUTHORIZED
M13_PUBLICATION=NOT_AUTHORIZED
```

The next legal project boundary after the documentation-governance wave is
`LOCAL_WSL2_HANDOFF_AND_M12_C3_PREFLIGHT`. It does not authorize C3 execution.
