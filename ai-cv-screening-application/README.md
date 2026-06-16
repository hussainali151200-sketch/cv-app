# 🏆 CV Screening Gateway — No-Code / Beginner's Guide

Welcome! This application is completely built and 100% ready for production. 

If you are new to coding, GitHub, Supabase, or Vercel, don't worry! Follow these **exact, step-by-step "Baby Steps"** to get your application fully connected and deployed to the live web in under 10 minutes.

---

## 🛑 Step 1: Get Your AI API Key

This app uses an AI model to evaluate candidate CVs. You can use **OpenAI**, **Groq**, **OpenRouter**, or any OpenAI-compatible provider.

### Option A: OpenAI (Recommended)
1. Go to [platform.openai.com](https://platform.openai.com/) and sign up or log in.
2. On the left sidebar, click on **API keys** (or go directly to [API Keys](https://platform.openai.com/api-keys)).
3. Click the **"+ Create new secret key"** button.
4. Name it `CV Gateway` and click **Create secret key**.
5. 📋 **Copy the key immediately** (it will start with `sk-...`). Paste it in a safe Notepad file for now.

---

## 🐘 Step 2: Connect Your Supabase Database

We need a database to save all candidate CV evaluation results. Supabase is 100% free to start.

1. Go to [supabase.com](https://supabase.com/) and click **Start your project** to sign up (you can sign in with GitHub).
2. Click **"+ New Project"**, choose your organization, and name your project `CV Screening`.
3. Create a strong database password and click **Create new project** (it takes about 1-2 minutes to set up).

### 👉 Get Your Supabase Credentials
1. In your Supabase dashboard, look at the left sidebar and click the **⚙️ Project Settings** icon (near the bottom).
2. Click on **API** in the settings menu.
3. Under the **Project URL** section, copy the `URL` (it looks like `https://xyz...supabase.co`). Paste it in your Notepad.
4. Under the **Project API Keys** section, copy the `anon` / `public` key (`eyJh...`). Paste it in your Notepad.

### 👉 Create the `cv_evaluations` Table
1. On the left sidebar of Supabase, click on the **SQL Editor** icon (`</>`).
2. Click **"+ New SQL query"**.
3. Paste exactly the following SQL code into the editor:

```sql
CREATE TABLE IF NOT EXISTS cv_evaluations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name   TEXT,
  keyword_score INT,
  ai_score    INT,
  final_score FLOAT,
  decision    TEXT,
  ai_reason   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cv_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow server inserts"
  ON cv_evaluations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access"
  ON cv_evaluations
  FOR SELECT
  TO anon
  USING (true);
```

4. Click the green **"Run"** button in the bottom right corner. It should say *Success, No rows returned*. Your database is now 100% fully configured!

---

## 🐙 Step 3: Upload Your Code to GitHub

Vercel deploys websites directly from your GitHub repository.

1. If you haven't already, go to [github.com](https://github.com/) and create a free account.
2. In the top right corner of GitHub, click the **"+"** icon and select **New repository**.
3. Repository name: `cv-screening-app`.
4. Keep it **Public** (or Private, up to you) and click **Create repository**.
5. Upload your project files:
   - If you have Git installed, follow the terminal instructions on GitHub to push your folder.
   - Or, simply click **"uploading an existing file"** on the GitHub page, drag and drop all the files from your downloaded folder, and click **Commit changes**.

---

## 🚀 Step 4: Deploy on Vercel

Here is where the magic happens! We will deploy the app and add our Notepad secrets.

1. Go to [vercel.com](https://vercel.com/) and sign in with your **GitHub account**.
2. Click the black **"Add New..."** button in the top right and select **Project**.
3. You will see your GitHub repositories. Find `cv-screening-app` and click the **"Import"** button next to it.
4. On the **Configure Project** page:
   - **Framework Preset**: Vercel should automatically detect **Vite** (leave it as is).
   - Click the **"Environment Variables"** dropdown to open it.

### 👉 Add Your 3 Environment Variables
You will copy-paste the 3 secrets from your Notepad here. Add them exactly like this:

1. **Variable 1**:
   - Name: `SUPABASE_URL`
   - Value: `https://your-project-id.supabase.co` (Your Supabase URL)
   - Click **Add**.

2. **Variable 2**:
   - Name: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOi...` (Your Supabase anon key)
   - Click **Add**.

3. **Variable 3**:
   - Name: `AI_API_KEY`
   - Value: `sk-...` (Your OpenAI secret key)
   - Click **Add**.

### 👉 Click Deploy
1. Click the big blue **"Deploy"** button.
2. Wait about 60 seconds while Vercel builds your beautiful UI and connects your serverless API backend automatically.
3. 🎉 **CONGRATULATIONS!** You will see a confetti screen. Click **"Continue to Dashboard"** and click your live link (e.g. `https://cv-screening-app.vercel.app`).

---

## 🧪 Step 5: Test Your Live App
1. Open your live Vercel web link.
2. Drag and drop a candidate CV (PDF, DOC, or DOCX) into the drop zone.
3. Click **"Analyze My CV"**.
4. The backend serverless function will securely parse the document, count the exact customer support keywords, ask your AI model to grade their experience, and return your final match decision!
5. Go back to your Supabase dashboard, click the **Table Editor** (table icon) on the left sidebar, click `cv_evaluations`, and you will see your live test record safely saved in the database!
