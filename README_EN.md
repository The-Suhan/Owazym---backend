# 🚀 Project Setup Guide from Scratch

This guide will help you set up the project from the beginning (PostgreSQL + Backend + Frontend).

---

## 📦 Step 1: Install PostgreSQL

1. Go to:
   https://www.postgresql.org/download/windows  

2. Click **Download the installer**

3. During installation:
   - Keep all components selected (including pgAdmin)
   - Port: `5432` (do not change)
   - Set a password (**do not forget it!**)

4. After installation:
   - Stack Builder will open → click **Cancel**

---

## 🗄️ Step 2: Create Database

1. Open **pgAdmin 4**
2. In the left panel:
   - Click `Servers → PostgreSQL`
   - Enter your password
3. Right-click on `Databases`:
   - `Create → Database`
4. Name: `owazym`
5. Click **Save**

---

## ⚙️ Step 3: Update Backend `.env`

Open `backend/.env` and update this line:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/owazym?schema=public"

🖥️ Step 4: Setup and Run Backend

cd backend
npm install
npm run prisma:generate
npx prisma db push
npm run dev

🔐 Generate Admin Password Hash

Run this command in terminal:

node -e "import('bcryptjs').then(m => m.default.hash('ENTER_YOUR_PASSWORD', 12).then(h => console.log(h)))"

Copy the generated hash.

🧾 Create Admin via SQL

Run these commands in your SQL terminal:

TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (name, subscribes, password, subscription_plan, downloads_used_month, updated_at)
VALUES ('admin', true, 'PASTE_YOUR_HASH_HERE', 'premium', 0, NOW());

🌐 Step 5: Setup and Run Frontend

Open a new terminal:

cd frontend
npm install
npm run dev

🔑 Login Info

name: admin
password: the password you used when generating the hash

⚠️ This is required to log in as admin

🔗 URLs

Frontend: http://localhost:5173
Backend: http://localhost:4000/api

✅ Notes

PostgreSQL must be running

.env file must be configured correctly
Backend and frontend should run in separate terminals

