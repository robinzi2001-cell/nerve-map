import httpx

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


async def search_pubmed(query: str, limit: int = 10):
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{EUTILS}/esearch.fcgi", params={"db": "pubmed", "term": query, "retmode": "json", "retmax": limit, "sort": "relevance"})
        ids = r.json().get("esearchresult", {}).get("idlist", [])
        if not ids:
            return []
        r = await c.get(f"{EUTILS}/esummary.fcgi", params={"db": "pubmed", "id": ",".join(ids), "retmode": "json"})
        res = r.json().get("result", {})
    out = []
    for pid in ids:
        d = res.get(pid)
        if not d:
            continue
        authors = ", ".join(a["name"] for a in d.get("authors", [])[:3]) + (" et al." if len(d.get("authors", [])) > 3 else "")
        out.append({
            "pmid": pid, "title": d.get("title", ""), "authors": authors, "journal": d.get("fulljournalname") or d.get("source", ""),
            "year": (d.get("pubdate") or "")[:4], "pubtype": ", ".join(d.get("pubtype", [])),
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pid}/", "source": "PubMed",
        })
    return out
