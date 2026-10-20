"""Iteration 12: 'abbinamenti' field - CRUD, public carta, search exclusion, export/import, backup."""
import os
import io
import csv
import json
from pathlib import Path
import pytest
import requests
from dotenv import load_dotenv
from openpyxl import load_workbook, Workbook

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
UNIQUE = "Zibellinoquaglia"  # term only present in abbinamenti


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    orig = s.get(f"{API}/settings", timeout=30).json()
    s.put(f"{API}/settings", json={"carta_pubblica_attiva": True}, timeout=30)
    yield s
    for w in s.get(f"{API}/wines", timeout=30).json():
        if w["nome"].startswith("TEST_"):
            s.delete(f"{API}/wines/{w['id']}", timeout=30)
    s.put(f"{API}/settings", json={"carta_pubblica_attiva": orig.get("carta_pubblica_attiva", True)}, timeout=30)


@pytest.fixture(scope="module")
def wine(admin):
    r = admin.post(f"{API}/wines", json={"nome": "TEST_Abb Rosso", "produttore": "TEST_Cantina Abb",
                                          "prezzo_acquisto": 10, "fornitore": "TEST_Forn",
                                          "abbinamenti": f"   Brasato, {UNIQUE} al tartufo  "}, timeout=30)
    assert r.status_code == 201, r.text
    return r.json()


# CRUD
def test_create_trims(wine):
    assert wine["abbinamenti"] == f"Brasato, {UNIQUE} al tartufo"


def test_get_returns_value(admin, wine):
    r = admin.get(f"{API}/wines/{wine['id']}", timeout=30)
    assert r.status_code == 200 and r.json()["abbinamenti"] == f"Brasato, {UNIQUE} al tartufo"


def test_default_empty(admin):
    r = admin.post(f"{API}/wines", json={"nome": "TEST_Abb Vuoto", "produttore": "TEST_Cantina Abb"}, timeout=30)
    assert r.status_code == 201 and r.json()["abbinamenti"] == ""


def test_null_becomes_empty(admin):
    r = admin.post(f"{API}/wines", json={"nome": "TEST_Abb Null", "produttore": "TEST_Cantina Abb", "abbinamenti": None}, timeout=30)
    assert r.status_code == 201 and r.json()["abbinamenti"] == ""


def test_max_length(admin):
    r = admin.post(f"{API}/wines", json={"nome": "TEST_Abb Long", "produttore": "X", "abbinamenti": "a" * 1001}, timeout=30)
    assert r.status_code == 422
    r = admin.post(f"{API}/wines", json={"nome": "TEST_Abb Max", "produttore": "X", "abbinamenti": "a" * 1000}, timeout=30)
    assert r.status_code == 201


def test_put_updates(admin, wine):
    body = {**wine, "abbinamenti": f"Selvaggina, {UNIQUE}"}
    r = admin.put(f"{API}/wines/{wine['id']}", json=body, timeout=30)
    assert r.status_code == 200 and r.json()["abbinamenti"] == f"Selvaggina, {UNIQUE}"
    assert admin.get(f"{API}/wines/{wine['id']}", timeout=30).json()["abbinamenti"] == f"Selvaggina, {UNIQUE}"


# search exclusion
def test_search_excludes_abbinamenti(admin, wine):
    r = admin.get(f"{API}/wines", params={"q": UNIQUE}, timeout=30)
    assert r.status_code == 200 and r.json() == []
    r = admin.get(f"{API}/wines", params={"q": "TEST_Abb Rosso"}, timeout=30)
    assert any(w["id"] == wine["id"] for w in r.json())


# public
def test_public_carta_includes_abbinamenti(admin, wine):
    r = requests.get(f"{API}/public/carta", timeout=30)
    assert r.status_code == 200
    w = next(x for x in r.json() if x["id"] == wine["id"])
    assert UNIQUE in w["abbinamenti"]
    assert "prezzo_acquisto" not in w and "fornitore" not in w


# export
def test_export_csv(admin, wine):
    r = admin.get(f"{API}/export/csv", timeout=30)
    rows = list(csv.reader(io.StringIO(r.content.decode("utf-8-sig")), delimiter=";"))
    assert "Abbinamenti" in rows[0]
    idx = rows[0].index("Abbinamenti")
    assert any(UNIQUE in row[idx] for row in rows[1:])


def test_export_xlsx(admin, wine):
    r = admin.get(f"{API}/export/xlsx", timeout=30)
    ws = load_workbook(io.BytesIO(r.content)).active
    hdr = [c.value for c in ws[1]]
    assert "Abbinamenti" in hdr
    idx = hdr.index("Abbinamenti")
    assert any(row[idx] and UNIQUE in row[idx] for row in ws.iter_rows(min_row=2, values_only=True))


def test_template_has_column(admin):
    r = admin.get(f"{API}/import/template", timeout=30)
    assert "Abbinamenti" in [c.value for c in load_workbook(io.BytesIO(r.content)).active[1]]


# import
def test_import_xlsx(admin):
    wb = Workbook(); ws = wb.active
    ws.append(["Nome", "Produttore", "Abbinamenti"])
    ws.append(["TEST_Imp Xlsx", "TEST_ImpCant", "Pesce crudo"])
    buf = io.BytesIO(); wb.save(buf); buf.seek(0)
    files = {"file": ("t.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    pv = admin.post(f"{API}/import/preview", files=files, timeout=30).json()
    assert "abbinamenti" in pv["columns"]
    r = admin.post(f"{API}/import", files=files, data={"mode": "skip"}, timeout=30)
    assert r.json()["inseriti"] == 1
    w = next(x for x in admin.get(f"{API}/wines", params={"q": "TEST_Imp Xlsx"}).json())
    assert w["abbinamenti"] == "Pesce crudo"


def test_import_csv_alias_and_update(admin):
    content = "Nome;Produttore;Food pairing\nTEST_Imp Csv;TEST_ImpCant;Formaggi\n".encode()
    r = admin.post(f"{API}/import", files={"file": ("t.csv", content, "text/csv")}, data={"mode": "skip"}, timeout=30)
    assert r.json()["inseriti"] == 1
    content2 = "Nome;Produttore;Abbinamento\nTEST_Imp Csv;TEST_ImpCant;Salumi\n".encode()
    r = admin.post(f"{API}/import", files={"file": ("t.csv", content2, "text/csv")}, data={"mode": "update"}, timeout=30)
    assert r.json()["aggiornati"] == 1
    w = next(x for x in admin.get(f"{API}/wines", params={"q": "TEST_Imp Csv"}).json())
    assert w["abbinamenti"] == "Salumi"
    # update without the column must not wipe value
    content3 = "Nome;Produttore;Regione\nTEST_Imp Csv;TEST_ImpCant;Piemonte\n".encode()
    admin.post(f"{API}/import", files={"file": ("t.csv", content3, "text/csv")}, data={"mode": "update"}, timeout=30)
    w = next(x for x in admin.get(f"{API}/wines", params={"q": "TEST_Imp Csv"}).json())
    assert w["abbinamenti"] == "Salumi" and w["regione"] == "Piemonte"


# backup (restore tested on parsed payload only, to avoid wiping real data)
def test_backup_contains_field(admin, wine):
    r = admin.get(f"{API}/backup", timeout=60)
    payload = json.loads(r.content)
    w = next(x for x in payload["wines"] if x["id"] == wine["id"])
    assert UNIQUE in w["abbinamenti"]


def test_restore_roundtrip(admin, wine):
    # full backup -> restore same payload -> data identical (real data preserved)
    raw = admin.get(f"{API}/backup", timeout=60).content
    before = {w["id"]: w for w in json.loads(raw)["wines"]}
    r = admin.post(f"{API}/backup/restore", files={"file": ("b.json", raw, "application/json")}, timeout=120)
    assert r.status_code == 200, r.text
    after = {w["id"]: w for w in admin.get(f"{API}/wines", timeout=30).json()}
    assert set(before) == set(after)
    assert after[wine["id"]]["abbinamenti"] == before[wine["id"]]["abbinamenti"]
    for k in before:
        assert before[k]["abbinamenti"] == after[k]["abbinamenti"]
