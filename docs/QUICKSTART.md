# Quick Start Guide 🚀

Get your PUBG Mobile Survey app deployed in **15 minutes**!

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Netlify account (free)
- [ ] Supabase account (free)
- [ ] Git installed on your computer

---

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Project
1. Go to https://app.supabase.com/
2. Click **"New Project"**
3. Fill in:
   - Name: `pubg-survey`
   - Password: Generate strong password (save it!)
   - Region: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### 1.2 Create Database
1. In your Supabase project, click **"SQL Editor"** in left sidebar
2. Open the file `SUPABASE_SETUP.sql` from this project
3. Copy ALL the SQL code
4. Paste into Supabase SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see: "Success. No rows returned"

### 1.3 Get Your Keys
1. Click **"Project Settings"** (gear icon) in left sidebar
2. Click **"API"**
3. Copy these 3 values (you'll need them soon):
   - ✅ **Project URL** (e.g., `https://abc123.supabase.co`)
   - ✅ **anon public** key (starts with `eyJ...`)
   - ✅ **service_role** key (starts with `eyJ...`) ⚠️ Keep this secret!

---

## Step 2: Push to GitHub (3 minutes)

### 2.1 Initialize Git (if not already done)
```bash
# Open terminal in project folder
cd "c:\Users\zc\Downloads\battleground-survey-hub (1)"

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: PUBG Mobile Survey"
```

### 2.2 Create GitHub Repo
1. Go to https://github.com/new
2. Repository name: `pubg-mobile-survey`
3. Make it **Private** (recommended) or Public
4. **DO NOT** check any boxes (README, .gitignore, license)
5. Click **"Create repository"**
6. Copy the HTTPS URL shown (e.g., `https://github.com/yourname/pubg-mobile-survey.git`)

### 2.3 Push Code
```bash
# Add remote (replace with YOUR GitHub URL)
git remote add origin https://github.com/YOUR-USERNAME/pubg-mobile-survey.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## Step 3: Deploy to Netlify (7 minutes)

### 3.1 Connect Repository
1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify (if first time)
5. Find and click your `pubg-mobile-survey` repository

### 3.2 Configure Build
Netlify should auto-detect settings. Verify:
- Base directory: *(leave empty)*
- Build command: `npm run build`
- Publish directory: `.output/public`

### 3.3 Add Environment Variables

**IMPORTANT:** Before clicking "Deploy", add your Supabase credentials:

1. Click **"Show advanced"** or **"Add environment variables"**
2. Add these 6 variables:

| Variable Name | Value | Example |
|---------------|-------|---------|
| `SUPABASE_PROJECT_ID` | Your project ID | `abc123xyz` |
| `SUPABASE_URL` | Your project URL | `https://abc123.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Your anon/public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | `eyJhbGc...` |
| `VITE_SUPABASE_URL` | (same as SUPABASE_URL) | `https://abc123.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (same as SUPABASE_PUBLISHABLE_KEY) | `eyJhbGc...` |

**Where to find project ID?**
- It's the first part of your Supabase URL
- Example: `https://abc123xyz.supabase.co` → ID is `abc123xyz`

### 3.4 Deploy!
1. Click **"Deploy [site name]"**
2. Wait 3-5 minutes for build to complete
3. Watch the deploy logs (optional but satisfying 😊)
4. When done, you'll see: **"Site is live"** ✅

### 3.5 Get Your URL
1. Netlify will give you a random URL like: `https://cheerful-unicorn-123456.netlify.app`
2. Click on it to open your live site!

---

## Step 4: Test Your Deployment (2 minutes)

### 4.1 Test Survey Form
1. Open your Netlify URL
2. Fill out the survey:
   - Name: `Test User`
   - Pick a map, weapon, mode, rank
   - Set hours per week
   - (Optional) Add feedback
3. Click **"Submit intel"**
4. You should see: "Winner Winner, Chicken Dinner" success message ✅

### 4.2 Test Admin Dashboard
1. Go to your URL + `/admin` (e.g., `https://your-site.netlify.app/admin`)
2. You should see:
   - ✅ Total responses: 1
   - ✅ Your test submission in the table
   - ✅ Charts showing your data
3. Try clicking **"Export CSV"** - it should download

---

## ✅ You're Done!

Your PUBG Mobile Survey is now **LIVE** on the internet! 🎉

### What's Next?

**Share your survey:**
```
Your survey: https://your-site.netlify.app
Admin dashboard: https://your-site.netlify.app/admin
```

**Customize it:**
- Change colors in `src/styles.css`
- Update survey questions in `src/routes/index.tsx`
- Add more charts in `src/routes/admin.tsx`

**Make it yours:**
- Add custom domain (see DEPLOYMENT.md)
- Add authentication for admin panel (recommended!)
- Change the prize from "700 UC" to your own incentive

---

## 🆘 Troubleshooting

### Build Failed on Netlify?

**Check build logs:**
1. Click on the failed deploy
2. Read the error message

**Common fixes:**
- ❌ Missing environment variables → Add them in Netlify settings
- ❌ Wrong Supabase keys → Double-check you copied them correctly
- ❌ Node version → Should be 24.17.0 (set in `netlify.toml`)

### Admin Dashboard is Empty?

1. Submit a test survey first
2. Check Supabase dashboard → **"Table Editor"** → `survey_responses`
3. Verify data is there
4. Check browser console for errors (F12)
5. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify

### Can't Connect to Supabase?

1. Check Supabase project is active (not paused)
2. Verify URL and keys are correct
3. Check Supabase **"API"** settings → keys should be enabled
4. Try regenerating keys if needed

### Local Development Not Working?

```bash
# Make sure you have .env file
cp .env.example .env

# Edit .env with your Supabase credentials

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 📞 Need Help?

1. Check the detailed [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Read the [README.md](./README.md)
3. Open an issue on GitHub
4. Check Netlify deploy logs
5. Check Supabase logs

---

## 🎊 Celebrate!

You just deployed a full-stack application with:
- ✅ React frontend
- ✅ Server-side rendering
- ✅ PostgreSQL database
- ✅ Real-time analytics
- ✅ Responsive design
- ✅ Automatic deployments

**That's impressive! Share it with the world! 🚀**

---

Made with ❤️ for PUBG Mobile players
