"""
Export Postgres data to tracker_backup.json for mobile app import.
Run from the tracker-app directory:
    python export_to_mobile.py
"""

import json
import re
from datetime import datetime, date, timezone
from decimal import Decimal

# ── connection ────────────────────────────────────────────────────────────────
# Reads the DATABASE_URL from backend/.env and converts it to a psycopg2 URL
def get_db_url():
    with open("backend/.env") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                url = line.split("=", 1)[1].strip()
                # asyncpg driver prefix → standard postgres
                url = re.sub(r"postgresql\+asyncpg://", "postgresql://", url)
                return url
    raise RuntimeError("DATABASE_URL not found in backend/.env")

# ── serialiser ────────────────────────────────────────────────────────────────
def to_json(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Cannot serialise {type(obj)}")

# ── main ──────────────────────────────────────────────────────────────────────
def export():
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("psycopg2 not installed. Run: pip install psycopg2-binary")
        raise SystemExit(1)

    db_url = get_db_url()
    conn = psycopg2.connect(db_url)
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # ── find user ──────────────────────────────────────────────────────────────
    cur.execute("SELECT id, username, email FROM users ORDER BY id")
    users = cur.fetchall()

    if not users:
        print("No users found in the database.")
        raise SystemExit(1)

    if len(users) == 1:
        user = users[0]
        print(f"Exporting data for: {user['username']} ({user['email']})")
    else:
        print("Multiple users found:")
        for u in users:
            print(f"  [{u['id']}] {u['username']} ({u['email']})")
        uid = input("Enter user ID to export: ").strip()
        user = next((u for u in users if str(u['id']) == uid), None)
        if not user:
            print("Invalid user ID.")
            raise SystemExit(1)

    user_id = user['id']

    # ── categories ────────────────────────────────────────────────────────────
    cur.execute(
        "SELECT id, name FROM categories WHERE user_id = %s ORDER BY id",
        (user_id,)
    )
    categories = [dict(r) for r in cur.fetchall()]

    # ── fitness logs ──────────────────────────────────────────────────────────
    cur.execute(
        "SELECT id, date, activities, body_weight_kg, created_at "
        "FROM fitness_logs WHERE user_id = %s ORDER BY date",
        (user_id,)
    )
    fitness_logs = []
    for r in cur.fetchall():
        row = dict(r)
        # Postgres ARRAY → plain Python list (psycopg2 converts it automatically)
        row['activities'] = list(row['activities']) if row['activities'] else []
        row['body_weight_kg'] = float(row['body_weight_kg'])
        fitness_logs.append(row)

    # ── expenses ──────────────────────────────────────────────────────────────
    cur.execute(
        "SELECT id, date, amount, category, description, created_at "
        "FROM expenses WHERE user_id = %s ORDER BY date, id",
        (user_id,)
    )
    expenses = []
    for r in cur.fetchall():
        row = dict(r)
        row['amount'] = float(row['amount'])
        expenses.append(row)

    # ── journal entries ───────────────────────────────────────────────────────
    cur.execute(
        "SELECT id, date, content, created_at "
        "FROM journal_entries WHERE user_id = %s ORDER BY date, id",
        (user_id,)
    )
    journal_entries = [dict(r) for r in cur.fetchall()]

    cur.close()
    conn.close()

    # ── build backup ──────────────────────────────────────────────────────────
    backup = {
        "version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "categories":     categories,
        "fitness_logs":   fitness_logs,
        "expenses":       expenses,
        "journal_entries": journal_entries,
    }

    out = "tracker_backup.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(backup, f, indent=2, default=to_json)

    print(f"\nExported:")
    print(f"  {len(categories)}     categories")
    print(f"  {len(fitness_logs)}  fitness logs")
    print(f"  {len(expenses)}  expenses")
    print(f"  {len(journal_entries)}  journal entries")
    print(f"\nSaved to: {out}")
    print("\nNext: transfer tracker_backup.json to your phone and use")
    print("Settings → Import backup in the mobile app.")

if __name__ == "__main__":
    export()
