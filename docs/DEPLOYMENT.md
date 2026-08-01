# Deployment Guide: Netlify + Supabase

This guide will help you deploy the PUBG Mobile Survey application to Netlify with Supabase as the backend.

## Prerequisites

- GitHub account
- Netlify account (free tier works)
- Supabase account (free tier works)
- Git installed locally

---

## Step 1: Set Up Supabase Database

### 1.1 Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in project details:
   - Name: `pubg-survey` (or your choice)
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
4. Wait for project to finish provisioning (~2 minutes)

### 1.2 Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Run this SQL to create the tables:

```sql
-- Create survey_responses table
CREATE TABLE survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  ign_id TEXT,
  favorite_map TEXT NOT NULL,
  favorite_weapon TEXT NOT NULL,
  preferred_mode TEXT NOT NULL,
  rank_tier TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enum type for roles
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- Create function to check user roles
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS) - OPTIONAL
-- Uncomment these if you want to add authentication later
-- ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for survey submissions)
-- CREATE POLICY "Allow public survey submissions"
-- ON survey_responses FOR INSERT
-- TO anon
-- WITH CHECK (true);

-- Create policy to allow public reads (for admin dashboard)
-- You can restrict this later by adding authentication
-- CREATE POLICY "Allow public reads"
-- ON survey_responses FOR SELECT
-- TO anon
-- USING (true);
```

3. Click "Run" to execute the SQL

### 1.3 Get Your Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project API keys**:
     - `anon` / `public` key (Publishable Key)
     - `service_role` key (Service Role Key - keep secret!)

---

## Step 2: Push to GitHub

### 2.1 Initialize Git Repository (if not already done)

```bash
# Navigate to your project directory
cd "c:\Users\zc\Downloads\battleground-survey-hub (1)"

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: PUBG Mobile Survey App"
```

### 2.2 Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository:
   - Name: `pubg-mobile-survey` (or your choice)
   - Description: "PUBG Mobile Player Survey with Analytics Dashboard"
   - Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license
3. Copy the repository URL

### 2.3 Push to GitHub

```bash
# Add remote origin
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## Step 3: Deploy to Netlify

### 3.1 Connect GitHub Repository

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub repositories
5. Select your `pubg-mobile-survey` repository

### 3.2 Configure Build Settings

Netlify should auto-detect the settings from `netlify.toml`, but verify:

- **Base directory:** (leave empty)
- **Build command:** `npm run build`
- **Publish directory:** `.output/public`
- **Functions directory:** `.output/server`

### 3.3 Add Environment Variables

Before deploying, add your environment variables:

1. In the Netlify deploy configuration, go to **"Advanced"** → **"Environment variables"**
2. Add these variables with your Supabase credentials:

```
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
```

**Important:** 
- The `VITE_` prefixed variables are exposed to the client
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Double-check all values are correct

### 3.4 Deploy

1. Click **"Deploy site"**
2. Wait for build to complete (~3-5 minutes)
3. Once deployed, Netlify will provide a URL like: `https://random-name-123456.netlify.app`

---

## Step 4: Test Your Deployment

1. Visit your Netlify URL
2. Test the survey form:
   - Fill out all fields
   - Submit the form
   - Verify success message appears
3. Test the admin dashboard:
   - Go to `/admin`
   - Verify your submission appears in the table
   - Check that charts display correctly

---

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain in Netlify

1. In Netlify dashboard, go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `survey.yourdomain.com`)
4. Follow Netlify's instructions to update DNS records

### 5.2 Enable HTTPS

- Netlify automatically provisions SSL certificates
- Wait a few minutes for certificate to be issued
- Your site will be accessible via HTTPS

---

## Step 6: Enable Automatic Deployments

Good news! This is already configured. Any push to your `main` branch will trigger an automatic deployment.

```bash
# Make changes to your code
git add .
git commit -m "Update survey questions"
git push

# Netlify will automatically rebuild and deploy
```

---

## Troubleshooting

### Build Fails

**Check build logs in Netlify:**
1. Go to **"Deploys"** tab
2. Click on the failed deploy
3. Read the error messages

**Common issues:**
- Missing environment variables → Add them in Netlify settings
- Node version mismatch → Check `netlify.toml` specifies correct Node version
- Dependency errors → Clear cache and retry deploy

### Database Connection Issues

**Verify Supabase credentials:**
1. Check environment variables are set correctly
2. Test Supabase connection from local dev:
   ```bash
   npm run dev
   # Submit a test survey
   ```
3. Check Supabase logs for errors

### Admin Dashboard Empty

1. Make sure you've submitted at least one survey
2. Check browser console for errors
3. Verify Supabase `survey_responses` table has data
4. Check that `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify

---

## Security Recommendations

### 1. Add Authentication to Admin Panel

Currently, the admin panel is publicly accessible. To secure it:

1. Implement Supabase Auth
2. Add authentication middleware
3. Require login for `/admin` route
4. Use Row Level Security (RLS) policies

### 2. Environment Variables

- Never commit `.env` file to Git
- Use `.env.example` as a template
- Store sensitive keys only in Netlify dashboard

### 3. Rate Limiting

Consider adding rate limiting to prevent spam submissions:
- Use Netlify Functions edge handlers
- Implement CAPTCHA (e.g., hCaptcha, reCAPTCHA)

---

## Useful Commands

```bash
# Local development
npm run dev

# Production build (test before deploying)
npm run build
npm run preview

# Check for errors
npm run lint

# Format code
npm run format
```

---

## Support & Resources

- **Netlify Docs:** https://docs.netlify.com/
- **Supabase Docs:** https://supabase.com/docs
- **TanStack Start Docs:** https://tanstack.com/start/latest
- **GitHub Repo:** [Your repository URL]

---

## Next Steps

1. ✅ Set up Supabase database
2. ✅ Push to GitHub
3. ✅ Deploy to Netlify
4. ✅ Test deployment
5. 🔲 Add custom domain
6. 🔲 Implement authentication for admin panel
7. 🔲 Add rate limiting
8. 🔲 Set up monitoring and analytics

---

**Congratulations! Your PUBG Mobile Survey is now live! 🎮**
