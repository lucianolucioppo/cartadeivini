# Seed/cleanup TEST_ wines for iteration 9 filter-panel UI tests. Usage: python seed_iter9.py seed|clean
import os, sys, requests
BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
s = requests.Session()
r = s.post(f"{BASE}/api/auth/login", json={"email": "admin@cartadeivini.it", "password": "Bordeaux-2026!"})
assert r.status_code == 200, r.text
if sys.argv[1] == "seed":
    for w in [
        {"nome": "TEST_Bianco9", "produttore": "TEST_Cantina9", "tipologia": "Bianco", "regione": "Sicilia", "annata": "2021", "preferito": True},
        {"nome": "TEST_Rosso9", "produttore": "TEST_Cantina9", "tipologia": "Rosso", "regione": "Piemonte", "annata": "2019"},
    ]:
        print(s.post(f"{BASE}/api/wines", json=w).status_code)
else:
    for w in s.get(f"{BASE}/api/wines").json():
        if w["nome"].startswith("TEST_"):
            print("del", w["nome"], s.delete(f"{BASE}/api/wines/{w['id']}").status_code)
print([ (w["nome"], w.get("preferito")) for w in s.get(f"{BASE}/api/wines").json()])
