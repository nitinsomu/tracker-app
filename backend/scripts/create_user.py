"""
Create a user in the database.

Usage:
    python scripts/create_user.py --email you@example.com --username yourname --password yourpassword
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth import hash_password
from sqlalchemy import select


async def create(email: str, username: str, password: str) -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.execute(
            select(User).where((User.email == email) | (User.username == username))
        )
        if existing.scalar_one_or_none():
            print("Error: a user with that email or username already exists.")
            return

        user = User(email=email, username=username, hashed_password=hash_password(password))
        db.add(user)
        await db.commit()
        await db.refresh(user)

    print(f"Created user  id={user.id}  username={user.username}  email={user.email}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a new user.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    asyncio.run(create(args.email, args.username, args.password))


if __name__ == "__main__":
    main()
