"""Backend tests for Carta dei Vini."""
import io
import os
import json
import uuid
from pathlib import Path
import pytest
from dotenv import load_dotenv
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://carta-dei-vini.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

STAFF_EMAIL = "test_staff@cartadeivini.it"
STAFF_PASSWORD = f"Tst-{uuid.uuid4().hex[:12]}"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def staff_session(admin_session):
    # create staff user via admin
    r = admin_session.post(f"{API}/users", json={
        "name": "TEST Staff",
        "email": STAFF_EMAIL,
        "password": STAFF_PASSWORD,
        "role": "staff",
    }, timeout=30)
    assert r.status_code in (201, 400), r.text  # 400 if exists
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Staff login failed: {r.text}"
    return s


# ---------- auth ----------
class TestAuth:
    def test_login_wrong_password(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login",
                   json={"email": "TEST_nonexistent@cartadeivini.it", "password": "wrong"}, timeout=30)
        assert r.status_code == 401
        assert "non corretti" in r.json().get("detail", "").lower() or "email" in r.json().get("detail", "").lower()

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_auth(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"

    def test_no_registration(self):
        for path in ("/auth/register", "/register", "/auth/signup"):
            r = requests.post(f"{API}{path}", json={"email": "x@x.com", "password": "xxxxxxxx"}, timeout=15)
            assert r.status_code in (404, 405), f"{path} returned {r.status_code}"


# ---------- users (admin only) ----------
class TestUsers:
    def test_staff_cannot_list_users(self, staff_session):
        r = staff_session.get(f"{API}/users", timeout=30)
        assert r.status_code == 403

    def test_admin_can_list_users(self, admin_session):
        r = admin_session.get(f"{API}/users", timeout=30)
        assert r.status_code == 200
        emails = [u["email"] for u in r.json()]
        assert ADMIN_EMAIL in emails


# ---------- wines CRUD ----------
class TestWines:
    created_ids: list = []

    def test_create_wine(self, admin_session):
        payload = {
            "nome": "TEST_Barolo Riserva",
            "produttore": "TEST_Cantina Alpha",
            "regione": "Piemonte",
            "denominazione": "Barolo DOCG",
            "tipologia": "Rosso",
            "vitigno": "Nebbiolo",
            "annata": "2018",
            "formato": "0.75L",
            "prezzo_acquisto": 24.5,
            "prezzo_carta": 65.0,
            "note": "Test wine",
        }
        r = admin_session.post(f"{API}/wines", json=payload, timeout=30)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["nome"] == payload["nome"]
        assert data["prezzo_acquisto"] == 24.5
        assert "id" in data
        TestWines.created_ids.append(data["id"])

    def test_get_wine(self, admin_session):
        wid = TestWines.created_ids[0]
        r = admin_session.get(f"{API}/wines/{wid}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == wid

    def test_list_wines(self, admin_session):
        r = admin_session.get(f"{API}/wines", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert any(w["id"] == TestWines.created_ids[0] for w in r.json())

    def test_update_wine(self, admin_session):
        wid = TestWines.created_ids[0]
        r = admin_session.put(f"{API}/wines/{wid}", json={
            "nome": "TEST_Barolo Riserva UP",
            "produttore": "TEST_Cantina Alpha",
            "prezzo_carta": 70.0,
        }, timeout=30)
        assert r.status_code == 200
        g = admin_session.get(f"{API}/wines/{wid}", timeout=30)
        assert g.json()["nome"] == "TEST_Barolo Riserva UP"
        assert g.json()["prezzo_carta"] == 70.0

    def test_favorite_toggle(self, admin_session):
        wid = TestWines.created_ids[0]
        r = admin_session.patch(f"{API}/wines/{wid}/preferito", json={"preferito": True}, timeout=30)
        assert r.status_code == 200
        g = admin_session.get(f"{API}/wines/{wid}", timeout=30)
        assert g.json()["preferito"] is True

    def test_search_and_filter(self, admin_session):
        r = admin_session.get(f"{API}/wines", params={"q": "TEST_Barolo"}, timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 1
        r = admin_session.get(f"{API}/wines", params={"regione": "Piemonte", "tipologia": "Rosso"}, timeout=30)
        assert r.status_code == 200

    def test_facets(self, admin_session):
        r = admin_session.get(f"{API}/wines/facets", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "regione" in data and "tipologia" in data

    def test_stats_produttori(self, admin_session):
        r = admin_session.get(f"{API}/stats/produttori", timeout=30)
        assert r.status_code == 200
        assert any(p["produttore"] == "TEST_Cantina Alpha" for p in r.json())

    def test_stats_regioni(self, admin_session):
        r = admin_session.get(f"{API}/stats/regioni-tipologie", timeout=30)
        assert r.status_code == 200
        assert "regioni" in r.json() and "tipologie" in r.json()

    def test_wine_requires_nome_and_produttore(self, admin_session):
        r = admin_session.post(f"{API}/wines", json={"nome": "", "produttore": ""}, timeout=30)
        assert r.status_code == 422


# ---------- export ----------
class TestExport:
    def test_csv(self, admin_session):
        r = admin_session.get(f"{API}/export/csv", timeout=60)
        assert r.status_code == 200
        assert r.content.startswith("\ufeff".encode("utf-8"))
        text = r.content.decode("utf-8")
        assert ";" in text
        assert "Nome" in text and "Produttore" in text

    def test_xlsx(self, admin_session):
        r = admin_session.get(f"{API}/export/xlsx", timeout=60)
        assert r.status_code == 200
        assert r.content[:2] == b"PK"  # xlsx is a zip

    def test_csv_unauth(self):
        r = requests.get(f"{API}/export/csv", timeout=30)
        assert r.status_code == 401


# ---------- backup / restore ----------
class TestBackup:
    def test_backup_json(self, admin_session):
        r = admin_session.get(f"{API}/backup", timeout=60)
        assert r.status_code == 200
        data = json.loads(r.content)
        assert data["app"] == "carta-dei-vini"
        assert isinstance(data["wines"], list)
        assert "photos" in data

    def test_restore_staff_forbidden(self, staff_session):
        fake = io.BytesIO(json.dumps({"app": "carta-dei-vini", "wines": []}).encode())
        r = staff_session.post(f"{API}/backup/restore",
                               files={"file": ("backup.json", fake, "application/json")}, timeout=60)
        assert r.status_code == 403

    def test_restore_invalid(self, admin_session):
        fake = io.BytesIO(b"not-json")
        r = admin_session.post(f"{API}/backup/restore",
                               files={"file": ("bad.json", fake, "application/json")}, timeout=60)
        assert r.status_code == 400


# ---------- files auth ----------
class TestFiles:
    def test_file_requires_auth(self):
        r = requests.get(f"{API}/files/carta-dei-vini/etichette/does-not-exist.jpg", timeout=30)
        assert r.status_code == 401


# ---------- cleanup ----------
class TestZCleanup:
    """Cleanup runs last due to class name sort."""

    def test_delete_wines(self, admin_session):
        for wid in TestWines.created_ids:
            r = admin_session.delete(f"{API}/wines/{wid}", timeout=30)
            assert r.status_code in (200, 404)
            g = admin_session.get(f"{API}/wines/{wid}", timeout=30)
            assert g.status_code == 404

    def test_delete_staff(self, admin_session):
        users = admin_session.get(f"{API}/users", timeout=30).json()
        for u in users:
            if u["email"] == STAFF_EMAIL:
                r = admin_session.delete(f"{API}/users/{u['id']}", timeout=30)
                assert r.status_code == 200
