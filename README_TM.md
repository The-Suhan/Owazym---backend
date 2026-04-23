# 🚀 Proýekti Noldan Gurmak Gollanmasy

Bu gollanma size proýekti başdan gurmaga kömek eder (PostgreSQL + Backend + Frontend).

---

## 📦 1-nji ädim: PostgreSQL Ýüklemek we Gurmak

1. Şu sahypa gir:
   https://www.postgresql.org/download/windows  

2. **Download the installer** düwmesine bas

3. Gurnama wagtynda:
   - Ähli komponentleri saýlanan goý (pgAdmin hem goşulyp)
   - Port: `5432` (üýtgetme)
   - Parol goý (**ýatdan çykarma!**)

4. Gurnama gutarandan soň:
   - Stack Builder açylar → **Cancel (Ýatyr)** bas

---

## 🗄️ 2-nji ädim: Maglumat Bazasy Döretmek

1. **pgAdmin 4** aç
2. Çep panelde:
   - `Servers → PostgreSQL` üstüne bas
   - Parolyňy gir
3. `Databases` üstüne sag bas:
   - `Create → Database`
4. Name: `owazym`
5. **Save**

---

## ⚙️ 3-nji ädim: Backend `.env` Täzelemek

`backend/.env` faýlyny aç we şu setiri üýtget:

```env
DATABASE_URL="postgresql://postgres:PAROLYŇ@127.0.0.1:5432/owazym?schema=public"


🖥️ 4-nji ädim: Backend Gurmak we Işletmek
cd backend
npm install
npm run prisma:generate
npx prisma db push
npm run dev

🌐 5-nji ädim: Frontend Gurmak we Işletmek

Täze terminal aç:

cd frontend
npm install
npm run dev

🔐 Admin Parol Hash Döretmek

Terminalda şu komandany işled:

node -e "import('bcryptjs').then(m => m.default.hash('ÖZ PAROLYŇY ÝAZ', 12).then(h => console.log(h)))"

Çykan hash koduny kopyala.

🧾 SQL bilen Admin Döretmek

SQL terminalda şu buýruklary işled:

TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (name, subscribes, password, subscription_plan, downloads_used_month, updated_at)
VALUES ('admin', true, 'HASH_KODUŇY_ŞU ÝERE_GOÝ', 'premium', 0, NOW());

🔑 Login Maglumatlary
name: admin
password: hash döretmek üçin ulanan parolyň 

⚠️ Bu admin hökmünde girmek üçin zerurdyr

🔗 URL Salgylar
Frontend: http://localhost:5173
Backend: http://localhost:4000/api

✅ Bellikler

PostgreSQL işläp durmalydyr
.env faýly dogry sazlanan bolmaly
Backend we frontend aýratyn terminalda işledilmeli