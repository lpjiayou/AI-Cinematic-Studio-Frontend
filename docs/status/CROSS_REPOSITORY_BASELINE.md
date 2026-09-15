# Frontend/Core Cross-Repository Baseline

Status: `CURRENT / BOUNDED IMAGE-VIDEO COMPATIBILITY PUBLICATION`

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

FRONTEND_CI_CORE_PIN_SHA=f475a33d3c2e34c2833cb8a44beb6f8bb212853a
FRONTEND_CI_CORE_PIN_TREE=143ae268399178987dc48d0e8653037d9d1e631f
```

Documentation-only merges may advance `main`. The accepted annotated tag remains
immutable. The 2026-09-02 documentation wave did not change the Frontend CI pin.
The Owner separately authorized the D1 Core/Frontend publication and existing SH09
read-only UI binding on 2026-09-15. Its compatibility pin uses the actual published
Core behavior below; this is not a new M13 acceptance or production permission.
The subsequent bounded authorization covers the image-plus-description contract,
publication and deployment of its existing-Operator integration, a finite host policy
and one independent UI generation. The pin now targets the published Core PR #101;
Frontend required checks and the real UI result must still establish their own facts.

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
D1_CORE_COMPATIBILITY_PIN_MOVE=PUBLISHED
D1_EXISTING_SH09_BINDING=READ_ONLY_AUTHORIZED
D1_ORIGINAL_SH09_RESUBMISSION=NOT_AUTHORIZED
IMAGE_VIDEO_CORE_PIN_MOVE=OWNER_AUTHORIZED_PENDING_CROSS_REPOSITORY_CHECKS
IMAGE_VIDEO_PUBLICATION=OWNER_AUTHORIZED_PENDING_REQUIRED_CHECKS
IMAGE_VIDEO_DEPLOYMENT=AUTHORIZED_PENDING_PUBLISHED_CANDIDATE
IMAGE_VIDEO_LIVE_CHECK=ONE_UI_JOB_AUTHORIZED_NOT_EXECUTED
IMAGE_VIDEO_AUTOMATIC_RETRY=false
IMAGE_VIDEO_PUBLICATION_ALLOWED=false
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
The current bounded task is image-plus-description compatibility publication,
finite-policy deployment and one independent UI Job using the existing Operator.
The original SH09 Job remains read-only and no real generation result is predeclared.
This task does not advance the separate M12/M13 work.
