"""Validate Frontend supersession edges and class-index reachability."""

from __future__ import annotations

import json
from pathlib import Path
import re


REGISTRY = Path("docs/governance/DOCUMENT_REGISTRY.json")
INDEX = Path("docs/README.md")
AUTHORITY_MAP = Path("docs/governance/DOCUMENT_AUTHORITY_MAP.md")
CLASSES = [
    "ACCEPTED_DECISION",
    "NORMATIVE_ARCHITECTURE",
    "NORMATIVE_CONTRACT",
    "CURRENT_STATUS",
    "CAPABILITY_MATRIX",
    "OPERATIONAL_RUNBOOK",
    "IMPLEMENTATION_EVIDENCE",
    "HISTORICAL_EVIDENCE",
    "SUPERSEDED",
    "DRAFT",
    "DEPRECATED",
    "GENERATED_REFERENCE",
]
REQUIRED_EDGES = {
    "governance/FE-G0_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md":
        "governance/FE-G0-R1_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md",
    "governance/FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV2.md":
        "governance/FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV3.md",
}


def index_sections(text: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    for document_class in CLASSES:
        match = re.search(
            rf"(?ms)^## {re.escape(document_class)}\n(.*?)(?=^## |\Z)",
            text,
        )
        sections[document_class] = match.group(1) if match else ""
    return sections


def main() -> None:
    errors: list[str] = []
    payload = json.loads(REGISTRY.read_text(encoding="utf-8"))
    records = payload["documents"]
    by_path = {record["path"]: record for record in records}
    index_text = INDEX.read_text(encoding="utf-8")
    map_text = AUTHORITY_MAP.read_text(encoding="utf-8")
    sections = index_sections(index_text)

    for document_class in CLASSES:
        if not sections[document_class]:
            errors.append(f"{INDEX}: missing class section {document_class}")

    graph: dict[str, list[str]] = {}
    for record in records:
        path = record["path"]
        if f"`{path}`" not in sections.get(record["documentClass"], ""):
            errors.append(f"{path}: not linked from its {record['documentClass']} index section")
        if f"`{path}`" not in map_text:
            errors.append(f"{path}: missing from {AUTHORITY_MAP}")
        for predecessor in record["supersedes"]:
            if predecessor not in by_path:
                errors.append(f"{path}: supersedes references unregistered {predecessor}")
            elif path not in by_path[predecessor]["supersededBy"]:
                errors.append(f"{path}: predecessor {predecessor} lacks reverse supersededBy edge")
        for successor in record["supersededBy"]:
            if successor not in by_path:
                errors.append(f"{path}: supersededBy references unregistered {successor}")
            elif path not in by_path[successor]["supersedes"]:
                errors.append(f"{path}: successor {successor} lacks reverse supersedes edge")
        if record["documentClass"] == "SUPERSEDED":
            if not record["supersededBy"]:
                errors.append(f"{path}: missing supersededBy")
            graph[path] = list(record["supersededBy"])
        elif record["supersededBy"]:
            errors.append(f"{path}: only SUPERSEDED records may name supersededBy")

    for predecessor, successor in REQUIRED_EDGES.items():
        if predecessor not in by_path or successor not in by_path:
            errors.append(f"required supersession edge has an unregistered endpoint: {predecessor} -> {successor}")
        elif successor not in by_path[predecessor]["supersededBy"]:
            errors.append(f"required supersession edge is missing: {predecessor} -> {successor}")

    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(path: str) -> None:
        if path in visiting:
            errors.append(f"supersession cycle detected at {path}")
            return
        if path in visited:
            return
        visiting.add(path)
        for successor in graph.get(path, []):
            visit(successor)
        visiting.remove(path)
        visited.add(path)

    for path in graph:
        visit(path)

    if "HISTORICAL_PATH_NOT_EXECUTION_AUTHORITY=true" not in map_text:
        errors.append(f"{AUTHORITY_MAP}: historical isolation guard is missing")

    if errors:
        print("Document supersession validation failed:")
        print("\n".join(f"- {error}" for error in errors))
        raise SystemExit(1)

    edge_count = sum(len(successors) for successors in graph.values())
    print(
        f"Validated {len(records)} indexed documents, {len(graph)} superseded records, "
        f"{edge_count} classified edges and zero orphans."
    )


if __name__ == "__main__":
    main()
