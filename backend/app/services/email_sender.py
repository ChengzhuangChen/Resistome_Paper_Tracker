import asyncio
from datetime import datetime
from typing import List
import aiosmtplib
from email.message import EmailMessage
from jinja2 import Template
from app.config import settings

EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ARG 前沿追踪日报</title>
<style>
body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 20px; color: #333; }
.container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 32px; }
h1 { color: #1a56db; font-size: 22px; margin-bottom: 8px; }
.subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
.paper { border-left: 4px solid #1a56db; padding-left: 16px; margin-bottom: 24px; }
.paper-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 6px; }
.paper-title a { color: #1a56db; text-decoration: none; }
.paper-meta { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-left: 4px; }
.badge-q1 { background: #d1fae5; color: #065f46; }
.badge-q2 { background: #dbeafe; color: #1e40af; }
.badge-q3 { background: #ffedd5; color: #9a3412; }
.badge-q4 { background: #f3f4f6; color: #4b5563; }
.badge-na { background: #f3f4f6; color: #9ca3af; }
.paper-section { font-size: 13px; color: #374151; line-height: 1.6; }
.paper-section strong { color: #111827; }
.footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<div class="container">
<h1>ARG 前沿追踪日报</h1>
<p class="subtitle">{{ date }} · 新增 {{ count }} 篇文献</p>
{% for p in papers %}
<div class="paper">
  <div class="paper-title">
    <a href="https://pubmed.ncbi.nlm.nih.gov/{{ p.pmid }}/">{{ p.title }}</a>
  </div>
  <div class="paper-meta">
    {{ p.journal or 'Unknown Journal' }}
    <span class="badge badge-{{ p.badge_class }}">{{ p.jcr_quartile or 'NA' }}</span>
  </div>
  <div class="paper-section">
    <strong>创新点：</strong>{{ p.highlights or '—' }}<br>
    <strong>结论：</strong>{{ p.conclusion or '—' }}
  </div>
</div>
{% endfor %}
<div class="footer">
  ARG Tracker · 自动推送 · 如需取消订阅请联系管理员
</div>
</div>
</body>
</html>
"""

class EmailSender:
    def __init__(self):
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.user = settings.smtp_user
        self.password = settings.smtp_password
        self.sender = settings.smtp_from
        self.recipients = [e.strip() for e in settings.notify_email_list.split(",") if e.strip()]

    async def send_daily_digest(self, papers: List[dict], date_str: str) -> bool:
        if not papers or not self.recipients:
            return False

        def badge_class(q: str) -> str:
            m = {"Q1": "q1", "Q2": "q2", "Q3": "q3", "Q4": "q4"}
            return m.get(q, "na")

        ctx = {
            "date": date_str,
            "count": len(papers),
            "papers": [
                {
                    **p,
                    "badge_class": badge_class(p.get("jcr_quartile")),
                }
                for p in papers
            ],
        }
        html = Template(EMAIL_TEMPLATE).render(ctx)

        msg = EmailMessage()
        msg["Subject"] = f"ARG 前沿追踪日报 ({date_str}) - 新增 {len(papers)} 篇文献"
        msg["From"] = self.sender
        msg["To"] = ", ".join(self.recipients)
        msg.set_content("您的邮件客户端不支持 HTML，请使用支持 HTML 的客户端查看。")
        msg.add_alternative(html, subtype="html")

        try:
            await aiosmtplib.send(
                msg,
                hostname=self.host,
                port=self.port,
                start_tls=True,
                username=self.user,
                password=self.password,
            )
            return True
        except Exception:
            return False

email_sender = EmailSender()
