import os
import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any

class DivergenceCache:
    def __init__(self):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.cache_file = os.path.join(base_dir, ".divergence_cache.json")
        self._lock = asyncio.Lock()

    def _get_key(self, commodity: str, region: str, days: int) -> str:
        return f"{commodity.strip().lower()}:{region.strip().lower()}:{days}"

    def _get_today_date_str(self) -> str:
        # Standardized UTC date string
        return datetime.utcnow().date().isoformat()

    async def get(self, commodity: str, region: str, days: int) -> Optional[Dict[str, Any]]:
        async with self._lock:
            if not os.path.exists(self.cache_file):
                return None
            try:
                # Run synchronous file reading in executor to keep it async-safe
                loop = asyncio.get_running_loop()
                def _read():
                    with open(self.cache_file, "r", encoding="utf-8") as f:
                        return json.load(f)
                
                cache_data = await loop.run_in_executor(None, _read)
                key = self._get_key(commodity, region, days)
                
                if key in cache_data:
                    entry = cache_data[key]
                    if entry.get("cache_date") == self._get_today_date_str():
                        return entry.get("data")
            except Exception as e:
                # Fail silently and return None if cache read fails
                print("Cache read failed:", e)
            return None

    async def set(self, commodity: str, region: str, days: int, data: Dict[str, Any]):
        async with self._lock:
            cache_data = {}
            if os.path.exists(self.cache_file):
                try:
                    with open(self.cache_file, "r", encoding="utf-8") as f:
                        cache_data = json.load(f)
                except Exception:
                    cache_data = {}

            key = self._get_key(commodity, region, days)
            cache_data[key] = {
                "cache_date": self._get_today_date_str(),
                "data": data
            }

            try:
                loop = asyncio.get_running_loop()
                def _write():
                    with open(self.cache_file, "w", encoding="utf-8") as f:
                        json.dump(cache_data, f, ensure_ascii=False, indent=2)
                
                await loop.run_in_executor(None, _write)
            except Exception as e:
                print("Cache write failed:", e)

divergence_cache = DivergenceCache()
