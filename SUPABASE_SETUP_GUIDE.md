# 🔧 Supabase Database Setup Guide

## ✅ Use the FIXED SQL File

**IMPORTANT**: Use `SUPABASE_SETUP_FIXED.sql` instead of the old file. It handles existing database objects safely.

---

## 📝 Step-by-Step Setup

### 1️⃣ **Open Supabase SQL Editor**

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**

---

### 2️⃣ **Copy the Fixed SQL**

1. Open the file: `SUPABASE_SETUP_FIXED.sql`
2. Select ALL the SQL code (Ctrl+A)
3. Copy it (Ctrl+C)

---

### 3️⃣ **Paste and Run**

1. Paste the SQL into Supabase SQL Editor (Ctrl+V)
2. Click **Run** button (or press F5)
3. Wait for it to finish (should take 2-5 seconds)

---

### 4️⃣ **Check for Success**

You should see:
```
✅ Success. No rows returned
```

Or see verification results showing your tables were created.

---

## 🐛 What if I Get an Error?

### Error: "type app_role already exists"
✅ **FIXED!** The new SQL file handles this automatically.

### Error: "table surveys already exists"
✅ **This is OK!** The script uses `CREATE TABLE IF NOT EXISTS` - it won't recreate existing tables.

### Error: "column pubg_level already exists"
✅ **This is OK!** The script checks before adding the column.

### Error: "policy already exists"
✅ **FIXED!** The script drops old policies before creating new ones.

---

## ✅ Verify Your Setup

After running the SQL, run these verification queries:

### Check Tables Exist:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('surveys', 'site_config', 'survey_analytics', 'user_roles')
ORDER BY tablename;
```

**Expected Result**: Should show 4 tables:
- site_config
- survey_analytics
- surveys
- user_roles

### Check pubg_level Column:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'surveys' 
  AND column_name = 'pubg_level';
```

**Expected Result**: 
- column_name: pubg_level
- data_type: integer

### Check Existing Data:
```sql
SELECT COUNT(*) as total FROM surveys;
```

**Expected Result**: Shows how many survey responses you have.

---

## 📊 Test the Functions

### Get Statistics:
```sql
SELECT get_survey_statistics();
```

This returns JSON with:
- total_responses
- avg_hours_per_week
- avg_pubg_level (NEW!)
- responses_with_level (NEW!)
- top_map, top_weapon, top_rank
- etc.

### Get Daily Responses:
```sql
SELECT * FROM get_daily_responses(7);
```

Shows response counts for last 7 days.

### Get Top Players:
```sql
SELECT * FROM get_top_players_by_hours(10);
```

Shows top 10 players by hours played (now includes pubg_level!)

---

## 🔑 Get Your Supabase Credentials

After setup, you need to connect your app:

### 1. Go to Project Settings
- Click **Settings** (gear icon)
- Click **API**

### 2. Copy These Values:

**Project URL**:
```
https://xxxxxxxxxxxxx.supabase.co
```

**Anon Public Key** (anon public):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Update Your .env File:

Open `.env` file and paste:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANT**: Replace the `xxxxxxxxxxxxx` with your actual values!

---

## 🧪 Test Your Connection

### 1. Start Development Server:
```bash
npm run dev
```

### 2. Open Survey Page:
```
http://localhost:3000
```

### 3. Fill Out and Submit Survey

### 4. Check Supabase:
Go to **Table Editor** → **surveys** → You should see your submission!

---

## 📋 What the Fixed SQL Does

### ✅ Safe Object Creation:
- Checks if `app_role` type exists before creating
- Uses `CREATE TABLE IF NOT EXISTS` for all tables
- Checks if `pubg_level` column exists before adding
- Drops and recreates policies (no conflicts)
- Drops and recreates triggers (no conflicts)

### ✅ Preserves Existing Data:
- Won't delete or modify existing survey responses
- Won't recreate tables that already exist
- Won't duplicate columns

### ✅ Adds New Features:
- `pubg_level` column (if not exists)
- `site_config` table (for admin panel settings)
- `survey_analytics` table (for tracking)
- `user_roles` table (for permissions)
- Helper functions for statistics
- Row Level Security policies

---

## 🚨 Common Mistakes

### ❌ **Mistake 1**: Using the old SQL file
✅ **Solution**: Use `SUPABASE_SETUP_FIXED.sql`

### ❌ **Mistake 2**: Running SQL in wrong project
✅ **Solution**: Make sure you're in the correct Supabase project

### ❌ **Mistake 3**: Not copying full SQL
✅ **Solution**: Select ALL (Ctrl+A) before copying

### ❌ **Mistake 4**: Wrong credentials in .env
✅ **Solution**: Copy URL and Key EXACTLY from Supabase Settings → API

---

## 🎯 What Happens After Setup

### For Your Survey App:
1. ✅ Survey submissions will save to Supabase
2. ✅ Admin panel will show real data
3. ✅ Charts and analytics will work
4. ✅ CSV export will include all fields (including pubg_level)
5. ✅ Leaderboard will show player levels

### Database Features You Get:
- Auto-updating timestamps
- Data validation (age, hours, level ranges)
- Optimized indexes for fast queries
- Security policies (Row Level Security)
- Helper functions for analytics
- Backup and restore capabilities

---

## 🔄 Rollback (If Needed)

If something goes wrong and you want to start fresh:

### Option 1: Drop and Recreate Tables
```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS survey_analytics CASCADE;
DROP TABLE IF EXISTS site_config CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;

-- Then run SUPABASE_SETUP_FIXED.sql again
```

### Option 2: Create New Project
1. Create a new Supabase project
2. Run the fixed SQL
3. Update .env with new credentials

---

## ✅ Checklist

Before moving to production:

- [ ] Ran `SUPABASE_SETUP_FIXED.sql` successfully
- [ ] Verified all 4 tables exist
- [ ] Verified `pubg_level` column exists
- [ ] Copied Supabase URL and Key to .env
- [ ] Tested survey submission locally
- [ ] Checked data appears in Supabase Table Editor
- [ ] Tested admin panel shows real data
- [ ] Verified CSV export works
- [ ] Tested all statistics functions
- [ ] Enabled Row Level Security (RLS)
- [ ] Backed up existing data (if any)

---

## 🎉 Success!

If you can:
1. ✅ Submit a survey from your app
2. ✅ See the data in Supabase Table Editor
3. ✅ See the data in Admin Panel
4. ✅ Export CSV with all fields

**Then your setup is complete!** 🚀

---

## 📞 Need Help?

### Check These First:
1. **Browser Console**: F12 → Console tab (look for errors)
2. **Network Tab**: F12 → Network tab (check API calls)
3. **Supabase Logs**: Dashboard → Logs (check for errors)

### Common Solutions:
- **No data showing**: Check .env credentials
- **403 Forbidden**: Check RLS policies
- **500 Error**: Check SQL functions exist
- **CORS Error**: Check Supabase project settings

---

*Setup time: 5 minutes*  
*Difficulty: Easy*  
*Status: ✅ Ready for production*
