# NervenPfad backend regression tests: entries, pubmed, auth, admin CRUD, studies, drop-in
import os
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN = {"email": "admin@nervenpfad.de", "password": "Nerven2026!"}
TEST_CODE = "TEST_entry_pytest"
TEST_DROP_CODE = "TEST_dropin_pytest"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.skip(f"login failed {r.status_code}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# --- Entries (public) ---
class TestEntries:
    def test_list_all(self):
        r = requests.get(f"{API}/entries")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 77
        layers = {e["layer"] for e in data}
        assert {"nerven", "druckpunkte", "meridiane", "zaehne", "ketten"} <= layers
        assert sum(len(e["studies"]) for e in data) > 0
        assert all(isinstance(e.get("_id", ""), str) for e in data)

    def test_filter_layer(self):
        r = requests.get(f"{API}/entries", params={"layer": "zaehne"})
        assert r.status_code == 200
        d = r.json()
        assert len(d) > 0 and all(e["layer"] == "zaehne" for e in d)

    def test_filter_q(self):
        r = requests.get(f"{API}/entries", params={"q": "Kopfschmerz"})
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_filter_q_regex_special_chars(self):
        r = requests.get(f"{API}/entries", params={"q": "("})
        assert r.status_code == 200, f"unescaped regex -> {r.status_code}"

    def test_zahn13(self):
        r = requests.get(f"{API}/entries/zahn-13")
        assert r.status_code == 200
        e = r.json()
        assert e["fdi"] == "13"
        assert e["agenesis"] and e["tcm"] and len(e["claims"]) > 0
        assert "kette-zahn13-becken" in e["related"]

    def test_chain_entry_exists(self):
        r = requests.get(f"{API}/entries/kette-zahn13-becken")
        assert r.status_code == 200 and r.json()["layer"] == "ketten"

    def test_404(self):
        assert requests.get(f"{API}/entries/does-not-exist").status_code == 404

    def test_stats(self):
        r = requests.get(f"{API}/stats")
        assert r.status_code == 200 and r.json()["studien"] > 0


# --- PubMed live ---
class TestPubMed:
    def test_search(self):
        r = requests.get(f"{API}/pubmed/search", params={"q": "canine agenesis"}, timeout=40)
        assert r.status_code == 200
        d = r.json()
        assert len(d) > 0
        assert d[0]["pmid"].isdigit() and d[0]["url"].startswith("https://pubmed.ncbi.nlm.nih.gov/")


# --- Auth ---
class TestAuth:
    def test_login_ok_and_cookies(self):
        r = requests.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200
        assert r.json()["role"] == "admin" and r.json()["token"]
        sc = r.headers.get("set-cookie", "")
        assert "access_token" in sc and "HttpOnly" in sc

    def test_login_wrong(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"})
        assert r.status_code == 401
        # reset counter
        requests.post(f"{API}/auth/login", json=ADMIN)

    def test_me(self, auth):
        r = auth.get(f"{API}/auth/me")
        assert r.status_code == 200 and r.json()["email"] == ADMIN["email"]

    def test_me_unauth(self):
        assert requests.get(f"{API}/auth/me").status_code == 401


# --- Admin CRUD + studies ---
class TestAdminCRUD:
    @pytest.fixture(scope="class", autouse=True)
    def cleanup(self, auth):
        auth.delete(f"{API}/entries/{TEST_CODE}")
        yield
        auth.delete(f"{API}/entries/{TEST_CODE}")

    def test_unauth_create(self):
        r = requests.post(f"{API}/entries", json={"code": TEST_CODE, "name": "x", "layer": "druckpunkte"})
        assert r.status_code == 401

    def test_unauth_delete(self):
        assert requests.delete(f"{API}/entries/zahn-13").status_code == 401

    def test_crud_flow(self, auth):
        body = {"code": TEST_CODE, "name": "TEST Punkt", "layer": "druckpunkte", "positions": [[0, 1, 0]]}
        r = auth.post(f"{API}/entries", json=body)
        assert r.status_code == 200 and r.json()["name"] == "TEST Punkt"
        assert auth.post(f"{API}/entries", json=body).status_code == 400
        body["name"] = "TEST Punkt 2"
        r = auth.put(f"{API}/entries/{TEST_CODE}", json=body)
        assert r.status_code == 200
        assert requests.get(f"{API}/entries/{TEST_CODE}").json()["name"] == "TEST Punkt 2"
        # studies
        st = {"title": "TEST study", "pmid": "99999999"}
        r = auth.post(f"{API}/entries/{TEST_CODE}/studies", json=st)
        assert r.status_code == 200 and len(r.json()["studies"]) == 1
        assert auth.post(f"{API}/entries/{TEST_CODE}/studies", json=st).status_code == 400
        r = auth.delete(f"{API}/entries/{TEST_CODE}/studies/0")
        assert r.status_code == 200 and r.json()["studies"] == []
        assert auth.delete(f"{API}/entries/{TEST_CODE}/studies/5").status_code == 404
        # delete
        assert auth.delete(f"{API}/entries/{TEST_CODE}").status_code == 200
        assert requests.get(f"{API}/entries/{TEST_CODE}").status_code == 404

    def test_put_missing_404(self, auth):
        r = auth.put(f"{API}/entries/nope-xyz", json={"code": "nope-xyz", "name": "x", "layer": "nerven"})
        assert r.status_code == 404


# --- Drop-in folder ---
class TestDropIn:
    def test_unauth(self):
        assert requests.get(f"{API}/dropin/files").status_code == 401

    def test_upload_wrong_ext(self, auth):
        r = auth.post(f"{API}/dropin/upload", files={"file": ("x.txt", b"hi", "text/plain")})
        assert r.status_code == 400

    def test_upload_and_import(self, auth):
        auth.delete(f"{API}/entries/{TEST_DROP_CODE}")
        r = auth.post(f"{API}/entries", json={"code": TEST_DROP_CODE, "name": "TEST Dropin", "layer": "druckpunkte"})
        assert r.status_code == 200
        try:
            csv_txt = ("entry_code;title;authors;journal;year;url;source\n"
                       f"{TEST_DROP_CODE};TEST CSV Studie;Muster A;J Test;2024;https://example.org;Eigene Quelle\n"
                       "unknown-code-xyz;TEST Unknown;B;J;2020;;Eigene Quelle\n")
            js = json.dumps([{"entry_code": TEST_DROP_CODE, "title": "TEST JSON Studie", "year": 2023}])
            assert auth.post(f"{API}/dropin/upload", files={"file": ("TEST_pytest.csv", csv_txt.encode(), "text/csv")}).status_code == 200
            assert auth.post(f"{API}/dropin/upload", files={"file": ("TEST_pytest.json", js.encode(), "application/json")}).status_code == 200
            files = auth.get(f"{API}/dropin/files").json()
            assert "TEST_pytest.csv" in files["pending"] and "TEST_pytest.json" in files["pending"]
            rep = auth.post(f"{API}/dropin/import").json()["report"]
            by = {x["file"]: x for x in rep}
            assert by["TEST_pytest.csv"]["studies_added"] == 1
            assert any("unknown-code-xyz" in e for e in by["TEST_pytest.csv"]["errors"])
            assert by["TEST_pytest.json"]["studies_added"] == 1
            files = auth.get(f"{API}/dropin/files").json()
            assert "TEST_pytest.csv" not in files["pending"]
            assert any(f.endswith("TEST_pytest.csv") for f in files["imported"])
            titles = [s["title"] for s in requests.get(f"{API}/entries/{TEST_DROP_CODE}").json()["studies"]]
            assert "TEST CSV Studie" in titles and "TEST JSON Studie" in titles
        finally:
            auth.delete(f"{API}/entries/{TEST_DROP_CODE}")
