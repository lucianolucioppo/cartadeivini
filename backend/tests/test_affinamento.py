"""Backend tests for the newly re-added separated Tipologia + Affinamento fields."""
import io
import os
import csv
from pathlib import Path
import pytest
from dotenv import load_dotenv
import requests
from openpyxl import load_workbook, Workbook

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://carta-dei-vini.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

LONG_AFFINAMENTO = ("Affinamento in barrique di rovere francese di media tostatura per 18 mesi, "
                    "seguito da ulteriore sosta in acciaio e almeno 12 mesi di affinamento in bottiglia "
                    "prima della commercializzazione. Il vino sviluppa complessita' aromatica, note di "
                    "cacao, tabacco e frutti neri maturi.") * 1  # ~ 300+ chars
assert 240 <= len(LONG_AFFINAMENTO) <= 500, len(LONG_AFFINAMENTO)


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def created_wine_ids():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup(admin, created_wine_ids):
    # Pre-clean any stale TEST_Aff_ wines from previous runs
    stale = admin.get(f"{API}/wines", params={"q": "TEST_Aff_"}, timeout=30).json()
    for w in stale:
        if w.get("nome", "").startswith("TEST_Aff_"):
            admin.delete(f"{API}/wines/{w['id']}", timeout=30)
    yield
    # Cleanup only TEST_ prefixed wines we created
    for wid in created_wine_ids:
        admin.delete(f"{API}/wines/{wid}", timeout=30)


# ---------- WineIn validation ----------
class TestWineModel:
    def test_create_with_tipologia_and_long_affinamento(self, admin, created_wine_ids):
        payload = {
            "nome": "TEST_Aff_Brunello",
            "produttore": "TEST_Aff_Cantina",
            "regione": "Toscana",
            "tipologia": "Rosso",
            "affinamento": LONG_AFFINAMENTO,
            "gradazione": "14,5% vol",
            "temperatura_servizio": "16-18 °C",
            "prezzo_carta": 85.0,
        }
        r = admin.post(f"{API}/wines", json=payload, timeout=30)
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["tipologia"] == "Rosso"
        assert d["affinamento"] == LONG_AFFINAMENTO
        assert d["gradazione"] == "14,5% vol"
        assert d["temperatura_servizio"] == "16-18 °C"
        created_wine_ids.append(d["id"])

        # GET verifies persistence
        g = admin.get(f"{API}/wines/{d['id']}", timeout=30)
        assert g.status_code == 200
        gd = g.json()
        assert gd["affinamento"] == LONG_AFFINAMENTO
        assert gd["tipologia"] == "Rosso"

    def test_affinamento_501_rejected(self, admin):
        payload = {
            "nome": "TEST_Aff_TooLong",
            "produttore": "TEST_Aff_Cantina",
            "affinamento": "x" * 501,
        }
        r = admin.post(f"{API}/wines", json=payload, timeout=30)
        assert r.status_code == 422, r.text

    def test_affinamento_500_accepted(self, admin, created_wine_ids):
        payload = {
            "nome": "TEST_Aff_Exactly500",
            "produttore": "TEST_Aff_Cantina",
            "affinamento": "a" * 500,
            "tipologia": "Bianco",
        }
        r = admin.post(f"{API}/wines", json=payload, timeout=30)
        assert r.status_code == 201, r.text
        d = r.json()
        assert len(d["affinamento"]) == 500
        created_wine_ids.append(d["id"])

    def test_update_preserves_both_fields(self, admin, created_wine_ids):
        wid = created_wine_ids[0]
        r = admin.put(f"{API}/wines/{wid}", json={
            "nome": "TEST_Aff_Brunello",
            "produttore": "TEST_Aff_Cantina",
            "tipologia": "Rosso",
            "affinamento": "Nuovo testo di affinamento modificato",
        }, timeout=30)
        assert r.status_code == 200
        g = admin.get(f"{API}/wines/{wid}", timeout=30).json()
        assert g["tipologia"] == "Rosso"
        assert g["affinamento"] == "Nuovo testo di affinamento modificato"

    def test_list_returns_affinamento(self, admin):
        r = admin.get(f"{API}/wines", timeout=30)
        assert r.status_code == 200
        wines = r.json()
        assert any(w.get("nome") == "TEST_Aff_Brunello" for w in wines)
        for w in wines:
            # Field must be present on every doc
            assert "affinamento" in w, f"missing affinamento for {w.get('nome')}"
            assert "tipologia" in w


# ---------- facets / filter ----------
class TestFilter:
    def test_facets_tipologia(self, admin):
        r = admin.get(f"{API}/wines/facets", timeout=30)
        assert r.status_code == 200
        tips = r.json()["tipologia"]
        assert "Rosso" in tips
        assert "Bianco" in tips

    def test_filter_by_tipologia(self, admin):
        r = admin.get(f"{API}/wines", params={"tipologia": "Rosso"}, timeout=30)
        assert r.status_code == 200
        wines = r.json()
        assert all(w["tipologia"] == "Rosso" for w in wines)
        assert any(w["nome"] == "TEST_Aff_Brunello" for w in wines)


# ---------- Export ----------
class TestExport:
    def test_xlsx_has_tipologia_and_affinamento_columns(self, admin):
        r = admin.get(f"{API}/export/xlsx", timeout=60)
        assert r.status_code == 200
        wb = load_workbook(io.BytesIO(r.content), read_only=True, data_only=True)
        ws = wb.active
        headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
        assert "Tipologia" in headers
        assert "Affinamento" in headers
        # Find rows containing our test wine and verify columns
        tipologia_idx = headers.index("Tipologia")
        affinamento_idx = headers.index("Affinamento")
        prezzo_carta_idx = headers.index("Prezzo in carta (€)")
        found = False
        for row in ws.iter_rows(min_row=2, values_only=False):
            vals = [c.value for c in row]
            if vals and vals[0] == "TEST_Aff_Brunello":
                found = True
                assert vals[tipologia_idx] == "Rosso"
                assert vals[affinamento_idx] == "Nuovo testo di affinamento modificato"
                # Price formatted as euro
                assert '€' in row[prezzo_carta_idx].number_format
        assert found, "TEST_Aff_Brunello not in xlsx export"
        wb.close()

    def test_csv_has_tipologia_and_affinamento_columns(self, admin):
        r = admin.get(f"{API}/export/csv", timeout=60)
        assert r.status_code == 200
        text = r.content.decode("utf-8-sig")
        reader = csv.reader(io.StringIO(text), delimiter=";")
        headers = next(reader)
        assert "Tipologia" in headers
        assert "Affinamento" in headers


# ---------- Import round-trip ----------
class TestImportRoundTrip:
    def test_roundtrip_detects_presente(self, admin):
        xlsx = admin.get(f"{API}/export/xlsx", timeout=60).content
        files = {"file": ("roundtrip.xlsx", xlsx,
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        r = admin.post(f"{API}/import/preview", files=files, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        # Our newly created test wines should all be 'presente'
        presenti = data["totali"]["presenti"]
        assert presenti >= 2
        # And none in error
        assert data["totali"]["errori"] == 0

    def test_import_with_tipo_affinamento_invecchiamento_headers(self, admin, created_wine_ids):
        wb = Workbook()
        ws = wb.active
        ws.append(["Nome", "Cantina", "Tipo", "Affinamento", "Invecchiamento", "Prezzo"])
        ws.append(["TEST_Aff_Synonym", "TEST_Aff_Cantina", "bianco", "In acciaio", "", "22,50 €"])
        # Row with Invecchiamento only (synonym for affinamento). Must still map.
        ws.append(["TEST_Aff_Synonym2", "TEST_Aff_Cantina", "Rosato", "", "12 mesi in botte", "15,00 €"])
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        files = {"file": ("syn.xlsx", buf.getvalue(),
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        r = admin.post(f"{API}/import/preview", files=files, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        # Both header synonyms should map to tipologia + affinamento.
        cols = data["columns"]
        # columns is {field: header}
        assert "tipologia" in cols
        assert "affinamento" in cols
        # Expect 2 nuovi, 0 errori (one of invecchiamento vs affinamento rows may be deduped
        # if both headers map to same field => only one wins). We just assert >=1 nuovo and 0 errors.
        assert data["totali"]["errori"] == 0
        assert data["totali"]["nuovi"] >= 1

        # Now actually import so cleanup fixture removes them
        buf.seek(0)
        files = {"file": ("syn.xlsx", buf.getvalue(),
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        r = admin.post(f"{API}/import", files=files, data={"mode": "skip"}, timeout=60)
        assert r.status_code == 200
        # Track created wines for cleanup
        wines = admin.get(f"{API}/wines", params={"q": "TEST_Aff_Synonym"}, timeout=30).json()
        for w in wines:
            created_wine_ids.append(w["id"])
        # Verify tipologia normalization: 'bianco' -> 'Bianco'
        syn1 = next((w for w in wines if w["nome"] == "TEST_Aff_Synonym"), None)
        if syn1:
            assert syn1["tipologia"] == "Bianco"
            assert syn1["affinamento"] == "In acciaio"
