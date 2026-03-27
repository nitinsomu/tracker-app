import aiosmtplib
from email.message import EmailMessage

from app.config import settings


async def send_reminder_email() -> None:
    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD or not settings.REMINDER_EMAIL:
        return

    msg = EmailMessage()
    msg["From"] = settings.GMAIL_ADDRESS
    msg["To"] = settings.REMINDER_EMAIL
    msg["Subject"] = "Daily Tracker Reminder"
    msg.set_content(
        "Hey! Don't forget to log today's fitness, expenses, and journal entry in your tracker app."
    )

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.GMAIL_ADDRESS,
        password=settings.GMAIL_APP_PASSWORD,
    )
