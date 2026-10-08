#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 scripts/package.py
python3 scripts/verify-package.py
