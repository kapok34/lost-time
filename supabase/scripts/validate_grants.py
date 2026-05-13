#!/usr/bin/env python3
"""
Validate that every table created in supabase/migrations has explicit GRANTs.

Supabase now requires explicit GRANTs for Data API access.
This script ensures no table in public schema is created without grants.

Usage:
    python3 supabase/scripts/validate_grants.py

Exit codes:
    0 - all tables have explicit grants
    1 - one or more tables are missing grants
"""

import os
import re
import sys
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


def find_tables_without_grants():
    """Find tables created without explicit GRANT statements."""
    tables_created = {}  # table_name -> [files]
    tables_granted = set()

    for sql_file in sorted(MIGRATIONS_DIR.glob("*.sql")):
        if sql_file.name.startswith("_"):
            continue

        content = sql_file.read_text()

        # Find CREATE TABLE statements in public schema
        create_matches = re.findall(
            r"CREATE\s+TABLE\s+public\.(\w+)",
            content,
            flags=re.IGNORECASE,
        )
        for table_name in create_matches:
            tables_created.setdefault(table_name, []).append(sql_file.name)

        # Find GRANT statements on public tables
        grant_matches = re.findall(
            r"GRANT\s+\S+\s+ON\s+public\.(\w+)",
            content,
            flags=re.IGNORECASE,
        )
        for table_name in grant_matches:
            tables_granted.add(table_name)

        # Also catch GRANT ALL / GRANT SELECT etc. variations
        grant_all_matches = re.findall(
            r"GRANT\s+\w+(?:,\s*\w+)*\s+ON\s+public\.(\w+)",
            content,
            flags=re.IGNORECASE,
        )
        for table_name in grant_all_matches:
            tables_granted.add(table_name)

    missing = []
    for table_name, files in tables_created.items():
        if table_name not in tables_granted:
            missing.append((table_name, files))

    return missing


def main():
    missing = find_tables_without_grants()

    if not missing:
        print("OK: All public schema tables have explicit GRANT statements.")
        sys.exit(0)

    print("ERROR: Missing explicit GRANT statements for table(s):\n")
    for table_name, files in missing:
        print(f"  - public.{table_name}")
        print(f"    Created in: {', '.join(files)}")
        print()

    print("Add grants like:")
    print("  grant select, insert, update, delete on public.{table} to authenticated;")
    print("  grant all on public.{table} to service_role;")
    sys.exit(1)


if __name__ == "__main__":
    main()
