#!/usr/bin/env python3
"""Generate customer Word documents (Unit Test + Stress Test + ER-Diagram)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
PY = sys.executable


def main() -> None:
    scripts = [
        TOOLS / "generate_unit_test_docx.py",
        TOOLS / "generate_stress_test_docx.py",
        TOOLS / "generate_er_diagram_docx.py",
        TOOLS / "generate_flow_diagram_docx.py",
        TOOLS / "generate_database_design_docx.py",
        TOOLS / "generate_backend_design_docx.py",
        TOOLS / "generate_frontend_design_docx.py",
        TOOLS / "generate_dbrs_iso29110_docx.py",
        TOOLS / "generate_install_deploy_runbook_docx.py",
        TOOLS / "generate_security_docx.py",
        TOOLS / "generate_e2e_test_docx.py",
        TOOLS / "generate_test_case_scenario_docx.py",
    ]
    for script in scripts:
        print(f"Running {script.name}...")
        subprocess.run([PY, str(script)], check=True)
    print("Done — documents written to docs/customer-requirements/")


if __name__ == "__main__":
    main()
