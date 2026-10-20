"""Iteration 8 regression: refactored helpers (jwt decode, photo upload/serve, restore validation)."""
import io
import os
import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

import jwt
import pytest
import requests
from dotenv import load_dotenv
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
STAFF_EMAIL = "test_staff_iter8@cartadeivini.it"
STAFF_PASSWORD = f"Tst-{uuid.uuid4().hex[:12]}"


def _jpeg() -> bytes:
    b = io.BytesIO()
    Image.new("RGB", (64, 48), (120, 20, 40)).save(b, format="JPEG")
    return b.getvalue()


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def staff(admin):
    r = admin.post(f"{API}/users", json={"name": "TEST Staff8", "email": STAFF_EMAIL,
                                          "password": STAFF_PASSWORD, "role": "staff"}, timeout=30)
    assert r.status_code == 201, r.text
    uid = r.json()["id"]
    s = requests.Session()
    assert s.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD}, timeout=30).status_code == 200
    yield s
    admin.delete(f"{API}/users/{uid}", timeout=30)


@pytest.fixture(scope="module")
def wine_ids(admin):
    ids = []
    yield ids
    for i in ids:
        admin.delete(f"{API}/wines/{i}", timeout=30)


# ---------- auth / core._jwt_decode ----------
class TestAuthTokens:
    def test_me_refresh_logout(self, admin):
        assert admin.get(f"{API}/auth/me", timeout=30).json()["email"] == ADMIN_EMAIL
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        r = s.post(f"{API}/auth/refresh", timeout=30)
        assert r.status_code == 200 and r.json()["role"] == "admin"
        assert s.post(f"{API}/auth/logout", timeout=30).status_code == 200
        assert s.get(f"{API}/auth/me", timeout=30).status_code == 401

    def test_expired_token(self, admin):
        me = admin.get(f"{API}/auth/me", timeout=30).json()
        tok = jwt.encode({"sub": me["id"], "email": ADMIN_EMAIL, "type": "access",
                          "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, os.environ["JWT_SECRET"], algorithm="HS256")
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert r.status_code == 401 and r.json()["detail"] == "Sessione scaduta"

    def test_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.x"}, timeout=30)
        assert r.status_code == 401 and r.json()["detail"] == "Token non valido"

    def test_refresh_token_as_access_rejected(self, admin):
        me = admin.get(f"{API}/auth/me", timeout=30).json()
        tok = jwt.encode({"sub": me["id"], "type": "refresh",
                          "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}, os.environ["JWT_SECRET"], algorithm="HS256")
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert r.status_code == 401 and r.json()["detail"] == "Token non valido"

    def test_invalid_refresh_cookie(self):
        r = requests.post(f"{API}/auth/refresh", cookies={"refresh_token": "bad"}, timeout=30)
        assert r.status_code == 401 and r.json()["detail"] == "Token non valido"


# ---------- photos ----------
class TestPhotos:
    def test_upload_and_serve(self, admin, wine_ids):
        r = admin.post(f"{API}/upload", files={"file": ("TEST_label.jpg", _jpeg(), "image/jpeg")}, timeout=120)
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        assert path.startswith("carta-dei-vini/etichette/") and path.endswith(".jpg")
        g = admin.get(f"{API}/files/{path}", timeout=60)
        assert g.status_code == 200 and g.content[:2] == b"\xff\xd8"
        assert requests.get(f"{API}/files/{path}", timeout=30).status_code == 401
        # visible wine with photo -> public foto 200; hidden -> 404
        w = admin.post(f"{API}/wines", json={"nome": "TEST_Foto8", "produttore": "TEST_Prod8", "foto_path": path}, timeout=30).json()
        wine_ids.append(w["id"])
        p = requests.get(f"{API}/public/foto/{w['id']}", timeout=60)
        assert p.status_code == 200 and p.headers["content-type"].startswith("image/")
        admin.put(f"{API}/wines/{w['id']}", json={"nome": "TEST_Foto8", "produttore": "TEST_Prod8",
                                                  "foto_path": path, "visibile": False}, timeout=30)
        assert requests.get(f"{API}/public/foto/{w['id']}", timeout=30).status_code == 404

    def test_upload_non_image(self, admin):
        r = admin.post(f"{API}/upload", files={"file": ("a.txt", b"hello", "text/plain")}, timeout=30)
        assert r.status_code == 400 and "immagine" in r.json()["detail"]

    def test_upload_corrupt_image(self, admin):
        r = admin.post(f"{API}/upload", files={"file": ("a.jpg", b"notreallyjpeg", "image/jpeg")}, timeout=30)
        assert r.status_code == 400 and r.json()["detail"] == "Immagine non leggibile"

    def test_upload_requires_auth(self):
        assert requests.post(f"{API}/upload", files={"file": ("a.jpg", _jpeg(), "image/jpeg")}, timeout=30).status_code == 401

    def test_file_unknown_404(self, admin):
        assert admin.get(f"{API}/files/carta-dei-vini/etichette/nope.jpg", timeout=30).status_code == 404

    def test_public_foto_real_wine(self, admin):
        wines = requests.get(f"{API}/public/carta", timeout=30).json()
        with_photo = [w for w in wines if w["foto"]]
        if not with_photo:
            pytest.skip("no visible wine with photo")
        assert requests.get(f"{API}/public/foto/{with_photo[0]['id']}", timeout=60).status_code == 200


# ---------- restore validation (never valid data) ----------
class TestRestoreValidation:
    def _post(self, s, content: bytes):
        return s.post(f"{API}/backup/restore", files={"file": ("b.json", content, "application/json")}, timeout=60)

    def test_invalid_json(self, admin):
        r = self._post(admin, b"{not json")
        assert r.status_code == 400 and r.json()["detail"] == "File di backup non valido"

    def test_no_marker(self, admin):
        r = self._post(admin, json.dumps({"wines": []}).encode())
        assert r.status_code == 400 and "non è un backup" in r.json()["detail"]

    def test_invalid_wine_catalog_untouched(self, admin):
        before = sorted(w["id"] for w in admin.get(f"{API}/wines", timeout=30).json())
        payload = {"app": "carta-dei-vini", "version": 1,
                   "wines": [{"nome": "TEST_okwine", "produttore": "TEST_p"}, {"produttore": "TEST_p"}], "photos": {}}
        r = self._post(admin, json.dumps(payload).encode())
        assert r.status_code == 400 and r.json()["detail"].startswith("Vino non valido nel backup")
        after = sorted(w["id"] for w in admin.get(f"{API}/wines", timeout=30).json())
        assert before == after

    def test_staff_forbidden(self, staff):
        r = self._post(staff, b"{}")
        assert r.status_code == 403
