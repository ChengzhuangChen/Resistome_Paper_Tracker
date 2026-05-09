import httpx
from typing import Optional, Dict

async def get_location_by_ip(ip: str) -> Optional[Dict]:
    """Use ip-api.com to get geo location (free, no key needed)."""
    # Skip private/local IPs
    if ip in ("127.0.0.1", "localhost", "::1") or ip.startswith(("10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.")):
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,city,lat,lon")
            data = resp.json()
            if data.get("status") == "success":
                return {
                    "country": data.get("country"),
                    "country_code": data.get("countryCode"),
                    "city": data.get("city"),
                    "lat": data.get("lat"),
                    "lng": data.get("lon"),
                }
    except Exception:
        pass
    return None
