# Auth Testing Playbook (Carta dei Vini)

Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, indexes exist on users.email (unique), login_attempts.identifier.

Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@cartadeivini.it","password":"Bordeaux-2026!"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns the user object and sets `access_token` + `refresh_token` cookies. `/me` returns the same user.
No public registration endpoint exists; staff accounts are created by admin via POST /api/users.
