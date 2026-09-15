# Frontend/Core Cross-Repository Baseline

Status: `CURRENT / BOUNDED D1 COMPATIBILITY PUBLICATION`

Reviewed: `2026-09-15`; the original M13 and Frontend acceptance records below retain their historical scope.

## 1. Frozen repositories and behavior tag

```text
CORE_ACCEPTED_BEHAVIOR_COMMIT=a455c8e76427d53d75bb7f15259b9875d9768914
CORE_ACCEPTED_BEHAVIOR_TREE=d92159d5c3c5d3896d1fe9e56b896413277fe4e8
M13_BASE_TAG=m13-base-backend-v1
M13_BASE_TAG_OBJECT=b2d086b622bdb5456f6af325e458aa3771e43e80
M13_BASE_TAG_TARGET=a455c8e76427d53d75bb7f15259b9875d9768914

FRONTEND_MAIN=a0be9edc91437bf0e7c5dd14883e656e750b3aee
FRONTEND_TREE=c25b9e3744d561c93fed26d0a07e59a1915a6071

FRONTEND_CI_CORE_PIN_SHA=06a28c8de086a30db2d33b28f1ee34b7890973ac
FRONTEND_CI_CORE_PIN_TREE=a6cbc9b431c9ff1ff65d5261448e3259721c0eea
```

Documentation-only merges may advance `main`. The accepted annotated tag remains
immutable. The 2026-09-02 documentation wave did not change the Frontend CI pin.
The Owner separately authorized the D1 Core/Frontend publication and existing SH09
read-only UI binding on 2026-09-15. Its compatibility pin uses the actual published
Core behavior below; this is not a new M13 acceptance or production permission.

## 2. Pin meaning

The Frontend CI pin is the exact Core dependency used by the existing browser gates.
It sits in the accepted M13 renderer-v3 lineage but is not the later documentation
closeout tag target. Passing against that pin proves the tested adapter/UI behavior at
the pin. It does not mean:

- every Frontend M12 or M13 product surface is implemented;
- a Timeline Studio, Effect Inspector or RenderCandidate review experience exists;
- M14 QC/Approval or M15 Master/Export is implemented;
- a provider, GPU, production runtime or publication authority exists.

The first field below records the original documentation wave, not the D1 pin move.

```text
FRONTEND_PIN_CHANGED=false
FRONTEND_PIN_PROVES_PRODUCT_COMPLETION=false
D1_CORE_COMPATIBILITY_PIN_MOVE=OWNER_AUTHORIZED_PENDING_CROSS_REPOSITORY_CHECKS
D1_EXISTING_SH09_BINDING=READ_ONLY_AUTHORIZED
D1_NEW_GENERATION=NOT_AUTHORIZED
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

The next legal project boundary recorded after the original documentation-governance wave was
`LOCAL_WSL2_HANDOFF_AND_M12_C3_PREFLIGHT`. It does not authorize C3 execution.
The current bounded D1 task is compatibility publication followed by existing-job
status and playback binding. It does not advance the separate M12/M13 work.
