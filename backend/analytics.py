"""
Analytics module — lightweight SQLite-based visitor tracking.
Works on both local dev and Vercel (uses /tmp on Vercel for SQLite).
"""

import os
import sqlite3
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Request
from typing import Optional

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

# On Vercel, /tmp is the only writable directory
DB_DIR = "/tmp" if os.environ.get("VERCEL") else os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "analytics.db")


def get_db():
    """Get a database connection with WAL mode for concurrent reads."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db():
    """Create the analytics table if it doesn't exist."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS page_visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            ip TEXT,
            user_agent TEXT,
            referrer TEXT,
            path TEXT DEFAULT '/',
            country TEXT,
            metadata TEXT
        )
    """)
    conn.commit()
    conn.close()


# Init on module load
init_db()


@router.get("/track")
async def track_visit(request: Request, path: str = "/", ref: Optional[str] = None):
    """
    Track a page visit.
    Called by the frontend on page load.
    Uses a 1x1 pixel approach — can also be embedded as an <img> tag.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    referrer = ref or request.headers.get("referer", "direct")
    now = datetime.utcnow().isoformat()

    conn = get_db()
    conn.execute(
        "INSERT INTO page_visits (timestamp, ip, user_agent, referrer, path) VALUES (?, ?, ?, ?, ?)",
        (now, client_ip, user_agent, referrer, path)
    )
    conn.commit()
    conn.close()

    return {"status": "ok", "tracked": True}


@router.get("/stats")
async def get_stats():
    """
    Return analytics dashboard data:
    - Total visits (all time)
    - Unique visitors (by IP)
    - Today's visits
    - Last 30 days daily breakdown
    - Top referrers
    - Hourly heatmap (last 7 days)
    - Recent visits (last 20)
    """
    conn = get_db()
    
    # Total visits
    total = conn.execute("SELECT COUNT(*) as c FROM page_visits").fetchone()["c"]
    
    # Unique IPs
    unique = conn.execute("SELECT COUNT(DISTINCT ip) as c FROM page_visits").fetchone()["c"]
    
    # Today
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    today_count = conn.execute(
        "SELECT COUNT(*) as c FROM page_visits WHERE timestamp LIKE ?",
        (f"{today_str}%",)
    ).fetchone()["c"]
    
    # Last 30 days daily breakdown
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    daily_rows = conn.execute("""
        SELECT DATE(timestamp) as day, COUNT(*) as count
        FROM page_visits
        WHERE timestamp >= ?
        GROUP BY day
        ORDER BY day ASC
    """, (thirty_days_ago,)).fetchall()
    daily = [{"date": row["day"], "count": row["count"]} for row in daily_rows]
    
    # Top referrers
    ref_rows = conn.execute("""
        SELECT referrer, COUNT(*) as count
        FROM page_visits
        WHERE referrer IS NOT NULL AND referrer != 'direct'
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
    """).fetchall()
    referrers = [{"referrer": row["referrer"], "count": row["count"]} for row in ref_rows]
    
    # Hourly heatmap (last 7 days)
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    hourly_rows = conn.execute("""
        SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as count
        FROM page_visits
        WHERE timestamp >= ?
        GROUP BY hour
        ORDER BY hour ASC
    """, (seven_days_ago,)).fetchall()
    hourly = [{"hour": row["hour"], "count": row["count"]} for row in hourly_rows]
    
    # Recent visits (last 20)
    recent_rows = conn.execute("""
        SELECT timestamp, ip, user_agent, referrer, path
        FROM page_visits
        ORDER BY id DESC
        LIMIT 20
    """).fetchall()
    recent = [
        {
            "timestamp": row["timestamp"],
            "ip": row["ip"],
            "user_agent": row["user_agent"][:80] if row["user_agent"] else "",
            "referrer": row["referrer"],
            "path": row["path"]
        }
        for row in recent_rows
    ]
    
    conn.close()
    
    return {
        "status": "success",
        "stats": {
            "total_visits": total,
            "unique_visitors": unique,
            "today_visits": today_count,
            "daily": daily,
            "top_referrers": referrers,
            "hourly_heatmap": hourly,
            "recent_visits": recent
        }
    }


@router.delete("/reset")
async def reset_analytics():
    """Reset all analytics data."""
    conn = get_db()
    conn.execute("DELETE FROM page_visits")
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Analytics data cleared"}
