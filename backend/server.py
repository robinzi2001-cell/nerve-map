from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import csv
import io
import json
import shutil
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Annotated

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from starlette.middleware.cors import CORSMiddleware

from seed_data import all_entries
from pubmed import search_pubmed
import nerve_sim
import hrv
from fastapi import Form

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
DROPIN = ROOT_DIR / "dropin"
SEED_STUDIES = ROOT_DIR / "data" / "seed_studies.json"
JWT_ALGORITHM = "HS256"

app = FastAPI()
api = APIRouter(prefix="/api")
logger = logging.getLogger("nerv")

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc):
        return cls.model_validate(doc) if doc else None

    def to_mongo(self):
        d = self.model_dump(by_alias=True, exclude={"id"})
        return d


class Study(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    authors: str = ""
    journal: str = ""
    year: str = ""
    pmid: str = ""
    url: str = ""
    source: str = "Eigene Quelle"
    pubtype: str = ""
    evidence: str = ""
    notes: str = ""


class Claim(BaseModel):
    label: str
    text: str
    evidence: str
    tradition: str = "Schulmedizin"


class EntryIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    code: str
    name: str
    latin: str = ""
    layer: str
    tradition: str = "Schulmedizin"
    color: str = "#2F6FB0"
    description: str = ""
    symptoms: List[str] = []
    conditions: List[str] = []
    technique: str = ""
    contraindications: str = ""
    evidence: str = "schwach"
    pubmed_query: str = ""
    related: List[str] = []
    positions: Optional[List[List[float]]] = None
    paths: Optional[List[List[List[float]]]] = None
    claims: List[Claim] = []
    studies: List[Study] = []
    fdi: Optional[str] = None
    agenesis: Optional[str] = None
    tcm: Optional[dict] = None


class Entry(BaseDocument, EntryIn):
    updated_at: Optional[str] = None


class LoginIn(BaseModel):
    email: str
    password: str


# ---------- auth ----------
def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_password(p, h): return bcrypt.checkpw(p.encode(), h.encode())


def make_token(uid, email, kind, delta):
    return jwt.encode({"sub": uid, "email": email, "type": kind, "exp": datetime.now(timezone.utc) + delta}, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def set_cookies(resp: Response, uid, email):
    access = make_token(uid, email, "access", timedelta(hours=8))
    resp.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=8 * 3600, path="/")
    resp.set_cookie("refresh_token", make_token(uid, email, "refresh", timedelta(days=7)), httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return access


async def current_admin(request: Request):
    token = request.cookies.get("access_token")
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        raise HTTPException(401, "Nicht angemeldet")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sitzung abgelaufen")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Ungültiges Token")
    if payload.get("type") != "access":
        raise HTTPException(401, "Ungültiges Token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])}, {"password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(403, "Kein Admin")
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name"), "role": user["role"]}


@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.strip().lower()
    ident = f"login:{email}"
    att = await db.login_attempts.find_one({"identifier": ident})
    if att and att.get("count", 0) >= 5 and att.get("locked_until") and att["locked_until"] > datetime.now(timezone.utc).isoformat():
        raise HTTPException(429, "Zu viele Versuche. Bitte 15 Minuten warten.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        cnt = (att or {}).get("count", 0) + 1
        await db.login_attempts.update_one({"identifier": ident}, {"$set": {"count": cnt, "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}}, upsert=True)
        raise HTTPException(401, "E-Mail oder Passwort falsch")
    await db.login_attempts.delete_many({"identifier": ident})
    token = set_cookies(response, str(user["_id"]), email)
    return {"id": str(user["_id"]), "email": email, "name": user.get("name"), "role": user["role"], "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(current_admin)):
    return user


# ---------- entries ----------
LAYERS = ["nerven", "druckpunkte", "meridiane", "zaehne", "ketten"]


@api.get("/entries", response_model=List[Entry])
async def list_entries(layer: Optional[str] = None, q: Optional[str] = None):
    flt: dict = {}
    if layer:
        flt["layer"] = layer
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        flt["$or"] = [{"name": rx}, {"latin": rx}, {"symptoms": rx}, {"conditions": rx}, {"description": rx}, {"code": rx}]
    docs = await db.entries.find(flt).sort("name", 1).to_list(2000)
    return [Entry.from_mongo(d) for d in docs]


@api.get("/entries/{code}", response_model=Entry)
async def get_entry(code: str):
    doc = await db.entries.find_one({"code": code})
    if not doc:
        raise HTTPException(404, "Eintrag nicht gefunden")
    return Entry.from_mongo(doc)


@api.post("/entries", response_model=Entry)
async def create_entry(body: EntryIn, _=Depends(current_admin)):
    if await db.entries.find_one({"code": body.code}):
        raise HTTPException(400, "Code existiert bereits")
    e = Entry(**body.model_dump(), updated_at=datetime.now(timezone.utc).isoformat())
    res = await db.entries.insert_one(e.to_mongo())
    return Entry.from_mongo(await db.entries.find_one({"_id": res.inserted_id}))


@api.put("/entries/{code}", response_model=Entry)
async def update_entry(code: str, body: EntryIn, _=Depends(current_admin)):
    data = Entry(**body.model_dump(), updated_at=datetime.now(timezone.utc).isoformat()).to_mongo()
    data.pop("studies")
    if body.code != code and await db.entries.find_one({"code": body.code}):
        raise HTTPException(400, "Code existiert bereits")
    res = await db.entries.update_one({"code": code}, {"$set": data})
    if not res.matched_count:
        raise HTTPException(404, "Eintrag nicht gefunden")
    return Entry.from_mongo(await db.entries.find_one({"code": body.code}))


@api.delete("/entries/{code}")
async def delete_entry(code: str, _=Depends(current_admin)):
    res = await db.entries.delete_one({"code": code})
    if not res.deleted_count:
        raise HTTPException(404, "Eintrag nicht gefunden")
    return {"ok": True}


@api.post("/entries/{code}/studies", response_model=Entry)
async def add_study(code: str, study: Study, _=Depends(current_admin)):
    doc = await db.entries.find_one({"code": code})
    if not doc:
        raise HTTPException(404, "Eintrag nicht gefunden")
    if study.pmid and any(s.get("pmid") == study.pmid for s in doc.get("studies", [])):
        raise HTTPException(400, "Studie ist bereits verknüpft")
    await db.entries.update_one({"code": code}, {"$push": {"studies": study.model_dump()}})
    return Entry.from_mongo(await db.entries.find_one({"code": code}))


@api.delete("/entries/{code}/studies/{idx}", response_model=Entry)
async def remove_study(code: str, idx: int, _=Depends(current_admin)):
    doc = await db.entries.find_one({"code": code})
    if not doc or idx < 0 or idx >= len(doc.get("studies", [])):
        raise HTTPException(404, "Nicht gefunden")
    studies = doc["studies"]
    studies.pop(idx)
    await db.entries.update_one({"code": code}, {"$set": {"studies": studies}})
    return Entry.from_mongo(await db.entries.find_one({"code": code}))


@api.get("/stats")
async def stats():
    out = {l: await db.entries.count_documents({"layer": l}) for l in LAYERS}
    pipe = [{"$project": {"n": {"$size": {"$ifNull": ["$studies", []]}}}}, {"$group": {"_id": None, "t": {"$sum": "$n"}}}]
    agg = await db.entries.aggregate(pipe).to_list(1)
    out["studien"] = agg[0]["t"] if agg else 0
    return out


# ---------- pubmed ----------
@api.get("/pubmed/search")
async def pubmed(q: str, limit: int = 10):
    try:
        return await search_pubmed(q, min(limit, 25))
    except Exception as ex:
        logger.warning("pubmed failed: %s", ex)
        raise HTTPException(502, "PubMed ist gerade nicht erreichbar")


# ---------- labs: NEURON conduction + NeuroKit2 HRV ----------
class SimIn(BaseModel):
    condition: str
    temperature: float = Field(33.0, ge=20, le=40)


@api.get("/sim/conditions")
def sim_conditions():
    return [{"key": k, **v} for k, v in nerve_sim.CONDITIONS.items()]


@api.post("/sim/axon")
def sim_axon(body: SimIn):
    if body.condition not in nerve_sim.CONDITIONS:
        raise HTTPException(400, "Unbekannter Zustand")
    return nerve_sim.simulate(body.condition, body.temperature)


@api.post("/hrv/analyze")
def hrv_analyze(file: UploadFile = File(...), kind: str = Form("rr"), sampling_rate: int = Form(1000)):
    raw = file.file.read(5_000_001)
    if len(raw) > 5_000_000:
        raise HTTPException(400, "Datei zu groß (max. 5 MB)")
    try:
        return hrv.analyze(raw.decode("utf-8-sig", errors="ignore"), kind, sampling_rate)
    except Exception as ex:
        raise HTTPException(400, f"Analyse fehlgeschlagen: {ex}")


@api.get("/hrv/demo")
def hrv_demo(heart_rate: int = 70, variability: float = 3.0):
    return hrv.demo(max(45, min(heart_rate, 120)), max(0.5, min(variability, 10)))


# ---------- drop-in folder ----------
def parse_file(path: Path):
    """Returns (studies_by_code, entries)."""
    studies, entries = [], []
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            entries = data.get("entries", [])
            studies = data.get("studies", [])
        else:
            studies = data
    elif path.suffix.lower() == ".csv":
        text = path.read_text(encoding="utf-8-sig")
        dialect = csv.Sniffer().sniff(text.splitlines()[0], delimiters=",;\t")
        studies = list(csv.DictReader(io.StringIO(text), dialect=dialect))
    return studies, entries


@api.get("/dropin/files")
async def dropin_files(_=Depends(current_admin)):
    DROPIN.mkdir(exist_ok=True)
    pending = [f.name for f in sorted(DROPIN.iterdir()) if f.is_file() and f.suffix.lower() in (".json", ".csv")]
    done_dir = DROPIN / "importiert"
    done = [f.name for f in sorted(done_dir.iterdir())] if done_dir.exists() else []
    return {"folder": str(DROPIN), "pending": pending, "imported": done}


@api.post("/dropin/upload")
async def dropin_upload(file: UploadFile = File(...), _=Depends(current_admin)):
    if not file.filename.lower().endswith((".json", ".csv")):
        raise HTTPException(400, "Nur .json oder .csv")
    DROPIN.mkdir(exist_ok=True)
    (DROPIN / Path(file.filename).name).write_bytes(await file.read())
    return {"ok": True, "file": file.filename}


@api.post("/dropin/import")
async def dropin_import(_=Depends(current_admin)):
    DROPIN.mkdir(exist_ok=True)
    done_dir = DROPIN / "importiert"
    done_dir.mkdir(exist_ok=True)
    report = []
    for f in sorted(DROPIN.iterdir()):
        if not f.is_file() or f.suffix.lower() not in (".json", ".csv"):
            continue
        added, upserted, errors = 0, 0, []
        try:
            studies, entries = parse_file(f)
            for e in entries:
                try:
                    ent = Entry(**EntryIn(**e).model_dump(), updated_at=datetime.now(timezone.utc).isoformat())
                    data = ent.to_mongo()
                    data.pop("studies")
                    await db.entries.update_one({"code": ent.code}, {"$set": data, "$setOnInsert": {"studies": []}}, upsert=True)
                    for s in ent.studies:
                        await db.entries.update_one({"code": ent.code}, {"$push": {"studies": s.model_dump()}})
                    upserted += 1
                except Exception as ex:
                    errors.append(f"Eintrag {e.get('code')}: {ex}")
            for s in studies:
                code = (s.get("entry_code") or "").strip()
                if not code or not await db.entries.find_one({"code": code}):
                    errors.append(f"Unbekannter entry_code '{code}' bei '{s.get('title', '')[:40]}'")
                    continue
                try:
                    st = Study(**{k: str(v) for k, v in s.items() if v is not None and k != "entry_code"})
                except Exception as ex:
                    errors.append(f"Zeile ungültig ('{str(s)[:40]}'): {ex}")
                    continue
                await db.entries.update_one({"code": code}, {"$push": {"studies": st.model_dump()}})
                added += 1
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            shutil.move(str(f), str(done_dir / f"{stamp}_{f.name}"))
        except Exception as ex:
            errors.append(str(ex))
        report.append({"file": f.name, "studies_added": added, "entries_upserted": upserted, "errors": errors})
    return {"report": report}


# ---------- startup ----------
async def seed():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.entries.create_index("code", unique=True)
    email = os.environ["ADMIN_EMAIL"].lower()
    if not await db.users.find_one({"email": email}):
        await db.users.insert_one({"email": email, "password_hash": hash_password(os.environ["ADMIN_PASSWORD"]), "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
    if await db.entries.count_documents({}) == 0:
        cache = json.loads(SEED_STUDIES.read_text()) if SEED_STUDIES.exists() else {}
        docs = []
        for e in all_entries():
            e["studies"] = [dict(s, notes="Automatisch aus PubMed-Suche: " + e["pubmed_query"]) for s in cache.get(e["pubmed_query"], [])]
            docs.append(Entry(**EntryIn(**e).model_dump(), updated_at=datetime.now(timezone.utc).isoformat()).to_mongo())
        await db.entries.insert_many(docs)
    DROPIN.mkdir(exist_ok=True)


@app.on_event("startup")
async def startup():
    await seed()


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ["CORS_ORIGINS"].split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
