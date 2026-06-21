#!/usr/bin/env python3
"""Deprecated — use generate_testing_docs.py (creates 2 separate Word files)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent

if __name__ == "__main__":
    print("Note: เอกสารแยกเป็น 2 ไฟล์แล้ว — รัน generate_testing_docs.py")
    subprocess.run([sys.executable, str(TOOLS / "generate_testing_docs.py")], check=True)
