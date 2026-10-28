"""Fetches real PubMed references for each seed query and caches them in data/seed_studies.json."""
import asyncio
import json
from pathlib import Path
from seed_data import all_entries
from pubmed import search_pubmed

OUT = Path(__file__).parent / "data" / "seed_studies.json"


async def main():
    OUT.parent.mkdir(exist_ok=True)
    cache = json.loads(OUT.read_text()) if OUT.exists() else {}
    queries = sorted({e["pubmed_query"] for e in all_entries() if e.get("pubmed_query")})
    for q in queries:
        if q in cache:
            continue
        try:
            cache[q] = await search_pubmed(q, 3)
            print(q, len(cache[q]))
        except Exception as ex:
            print("fail", q, ex)
        await asyncio.sleep(1.2)
    OUT.write_text(json.dumps(cache, ensure_ascii=False, indent=1))


asyncio.run(main())
