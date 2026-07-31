# 🔧 Fix "Table Not Found" Error

## ❌ Error You're Getting:
```
Failed to fetch survey data: Could not find the table 'public.surveys' in the schema cache
```

## ✅ Solution: Create the Table

The `surveys` table doesn't exist in your Supabase database yet. Let's create it!

---

## 📝 **STEP 1: Open Supabase SQL Editor**

1. Go to: https://app.supabase.com
2. Click on your project: `olphisjnquhokmqtcwlk`
3. In the left sidebar, click **SQL Editor**
4. Click **New Query** button (top right)

---

## 📝 **STEP 2: Run the Create Table SQL**

1. Open the file: **`CREATE_SURVEYS_TABLE.sql`**
2. **Select ALL** the SQL code (Ctrl+A)
3. **Copy** it (Ctrl+C)
4. **Paste** into Supabase SQL Editor (Ctrl+V)
5. Click **RUN** button (or press F5)

**Wait 2-3 seconds...**

---

## ✅ **STEP 3: Verify Success**

You should see:
```
Success. Rows returned: 11
```

This means the table was created with 11 columns!

---

## 🧪 **STEP 4: Test It**

### Test 1: Check Table Exists
Run this in SQL Editor:
```sql
SELECT COUNT(*) FROM surveys;
```

**Expected Result**: `0` (table is empty but exists!)

### Test 2: Submit a Survey
1. Go to your website homepage
2. Fill out the survey
3. Click Submit
4. ✅ Should succeed!

### Test 3: Check Data in Supabase
```sql
SELECT * FROM surveys ORDER BY created_at DESC LIMIT 5;
```

**Expected Result**: Your submission should appear!

### Test 4: Open Admin Panel
1. Go to `/admin`
2. Password: `Doodle`
3. ✅ Should show your data!

---

## 🎯 **What This SQL Does**

1. ✅ Creates `surveys` table with all columns:
   - player_name
   - ign_id
   - pubg_level
   - favorite_map
   - favorite_weapon
   - preferred_mode
   - rank_tier
   - hours_per_week
   - feedback
   - created_at
   - (and more...)

2. ✅ Creates indexes for fast queries

3. ✅ Sets up Row Level Security (RLS):
   - Anyone can INSERT (submit surveys)
   - Anyone can SELECT (read data)
   - Only admins can UPDATE/DELETE

4. ✅ Handles errors if table already exists

---

## 🚨 **Troubleshooting**

### Problem: "relation already exists"
✅ **This is OK!** It means the table was already created. Just continue.

### Problem: "permission denied"
❌ **Solution**: Make sure you're logged into the correct Supabase project.

### Problem: Still getting "table not found"
**Try these steps:**
1. **Refresh** the Supabase page (Ctrl+R)
2. Go to **Table Editor** tab
3. Check if `surveys` table is listed
4. If not, run the SQL again
5. **Restart your dev server**: Stop (Ctrl+C) and run `npm run dev` again

---

## 📊 **Alternative: Use Table Editor UI**

If SQL doesn't work, you can create the table manually:

1. Go to Supabase → **Table Editor**
2. Click **New Table**
3. Name: `surveys`
4. Add these columns:
   - `id` (uuid, primary key, default: gen_random_uuid())
   - `player_name` (text, required)
   - `ign_id` (text, nullable)
   - `pubg_level` (int4, nullable)
   - `favorite_map` (text, required)
   - `favorite_weapon` (text, required)
   - `preferred_mode` (text, required)
   - `rank_tier` (text, required)
   - `hours_per_week` (int4, required)
   - `feedback` (text, nullable)
   - `created_at` (timestamptz, default: now())
   - `updated_at` (timestamptz, default: now())
5. Enable RLS
6. Add Insert policy (Allow all)
7. Add Select policy (Allow all)

---

## ✅ **After Running SQL**

Your database will have:
- ✅ `surveys` table ready
- ✅ Security policies enabled
- ✅ Fast indexes created
- ✅ Ready to accept submissions

**Refresh your app and try submitting a survey!**

---

## 🎉 **Success Indicators**

You'll know it worked when:

1. ✅ No more "table not found" errors
2. ✅ Survey submissions succeed
3. ✅ Data appears in Supabase Table Editor
4. ✅ Admin panel shows real data
5. ✅ Charts and statistics work

---

## 📞 **Need More Help?**

### Quick Checks:
1. **Table exists?**
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename = 'surveys';
   ```
   Should return: `surveys`

2. **Columns correct?**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'surveys';
   ```
   Should show all 12+ columns

3. **RLS enabled?**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'surveys';
   ```
   Should show: `true`

---

## 🚀 **You're Almost There!**

Just run that one SQL file and everything will work!

**File to run**: `CREATE_SURVEYS_TABLE.sql`  
**Where to run it**: Supabase SQL Editor  
**Time needed**: 30 seconds  

**Then your site will be LIVE with real data!** 🎉

---

*Having issues? Check that you're in the correct Supabase project: olphisjnquhokmqtcwlk*
