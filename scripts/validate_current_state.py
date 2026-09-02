"""Validate frozen Frontend/Core baselines, CI pins and fail-closed gates."""

from pathlib import Path
import re


BASELINE = Path("docs/status/CROSS_REPOSITORY_BASELINE.md")
POLICY = Path("docs/governance/DOCUMENTATION_GOVERNANCE_POLICY.md")
WORKFLOW = Path(".github/workflows/frontend-ci.yml")

REQUIRED_BASELINE_VALUES = {
    "CORE_ACCEPTED_BEHAVIOR_COMMIT": "a455c8e76427d53d75bb7f15259b9875d9768914",
    "CORE_ACCEPTED_BEHAVIOR_TREE": "d92159d5c3c5d3896d1fe9e56b896413277fe4e8",
    "M13_BASE_TAG": "m13-base-backend-v1",
    "M13_BASE_TAG_OBJECT": "b2d086b622bdb5456f6af325e458aa3771e43e80",
    "M13_BASE_TAG_TARGET": "a455c8e76427d53d75bb7f15259b9875d9768914",
    "FRONTEND_MAIN": "a0be9edc91437bf0e7c5dd14883e656e750b3aee",
    "FRONTEND_TREE": "c25b9e3744d561c93fed26d0a07e59a1915a6071",
    "FRONTEND_CI_CORE_PIN_SHA": "5c9ea7fe6993eddb7a492b2ae8f6bd8c2d5ae326",
    "FRONTEND_CI_CORE_PIN_TREE": "de6d43a16f97c1e34dc536336d05b0174d9aab39",
}
REQUIRED_STATES = {
    "FRONTEND_PIN_CHANGED": "false",
    "FRONTEND_PIN_PROVES_PRODUCT_COMPLETION": "false",
    "M12_RUNTIME_INSTALLED": "false",
    "M12_RUNTIME_G0": "NOT_COMPLETE",
    "M12_FRONTEND": "UNVERIFIED",
    "M12_PRODUCT": "NOT_COMPLETE",
    "M13_BASE_BACKEND": "COMPLETE",
    "M13_BASE_CLOSEOUT": "ACCEPTED",
    "M13_FRONTEND_PRODUCT_SURFACE": "INCOMPLETE",
    "M13_EXTENSION_CATALOG": "NOT_AUTHORIZED",
    "M13_M14_M15_INTEGRATION": "NOT_AUTHORIZED",
    "M13_PUBLICATION": "NOT_AUTHORIZED",
}
REQUIRED_POLICY_STATES = {
    "M13_BASE_BACKEND_COMPLETE": "true",
    "M13_BASE_CLOSEOUT_ACCEPTED": "true",
    "M13_PRODUCT_CAPABILITY_COMPLETE": "false",
    "M13_EXTENSION_G0_AUTHORIZED": "false",
    "M12_RUNTIME_G0": "NOT_COMPLETE",
    "M12_C3_READY_TO_START": "false",
    "A100_START_AUTHORIZED": "false",
    "PUBLICATION_ALLOWED": "false",
}


def require_pair(text: str, key: str, value: str, path: Path, errors: list[str]) -> None:
    if f"{key}={value}" not in text:
        errors.append(f"{path}: missing {key}={value}")


def workflow_value(text: str, key: str) -> str | None:
    match = re.search(rf"(?m)^\s{{2}}{re.escape(key)}:\s*([0-9a-f]+)\s*$", text)
    return match.group(1) if match else None


def main() -> None:
    errors: list[str] = []
    baseline_text = BASELINE.read_text(encoding="utf-8")
    policy_text = POLICY.read_text(encoding="utf-8")
    workflow_text = WORKFLOW.read_text(encoding="utf-8")

    for key, value in REQUIRED_BASELINE_VALUES.items():
        require_pair(baseline_text, key, value, BASELINE, errors)
    for key, value in REQUIRED_STATES.items():
        require_pair(baseline_text, key, value, BASELINE, errors)
    for key, value in REQUIRED_POLICY_STATES.items():
        require_pair(policy_text, key, value, POLICY, errors)

    expected_pin = {
        "CORE_PIN_SHA": "5c9ea7fe6993eddb7a492b2ae8f6bd8c2d5ae326",
        "CORE_PIN_TREE": "de6d43a16f97c1e34dc536336d05b0174d9aab39",
    }
    for key, expected in expected_pin.items():
        actual = workflow_value(workflow_text, key)
        if actual != expected:
            errors.append(f"{WORKFLOW}: {key}={actual!r}, expected {expected}")

    next_task = "LOCAL_WSL2_HANDOFF_AND_M12_C3_PREFLIGHT"
    if next_task not in baseline_text:
        errors.append(f"{BASELINE}: missing next legal boundary {next_task}")

    for forbidden in (
        "FRONTEND_PIN_CHANGED=true",
        "FRONTEND_PIN_PROVES_PRODUCT_COMPLETION=true",
        "M12_RUNTIME_INSTALLED=true",
        "M12_RUNTIME_G0=PASS",
        "M12_RUNTIME_G0=COMPLETE",
        "M12_C3_READY_TO_START=true",
        "M13_PRODUCT_CAPABILITY_COMPLETE=true",
        "M13_EXTENSION_G0_AUTHORIZED=true",
        "A100_START_AUTHORIZED=true",
        "PUBLICATION_ALLOWED=true",
    ):
        if forbidden in baseline_text or forbidden in policy_text:
            errors.append(f"current projection contains forbidden state {forbidden}")

    if errors:
        print("Current-state validation failed:")
        print("\n".join(f"- {error}" for error in errors))
        raise SystemExit(1)

    print(
        "Validated frozen Core/Frontend baselines, immutable M13 tag fields, "
        "Frontend CI pins, closed M12/M13 gates and next legal task."
    )


if __name__ == "__main__":
    main()
