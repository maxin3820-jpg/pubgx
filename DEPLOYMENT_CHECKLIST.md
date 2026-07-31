# Deployment Checklist ✅

Use this checklist to ensure everything is set up correctly before and after deployment.

## Pre-Deployment Checklist

### Supabase Configuration
- [ ] Supabase project created
- [ ] Database tables created (`survey_responses`, `user_roles`)
- [ ] SQL functions created (`has_role`, `get_survey_statistics`)
- [ ] Database indexes created
- [ ] Supabase URL copied
- [ ] Publishable key copied
- [ ] Service role key copied (and kept secure!)
- [ ] Test query works in Supabase SQL Editor

### Code Preparation
- [ ] `.env` file created with correct credentials
- [ ] `.env` file added to `.gitignore` (DO NOT commit it!)
- [ ] Local development server runs successfully (`npm run dev`)
- [ ] Can submit test survey locally
- [ ] Admin dashboard loads locally
- [ ] Production build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npm run lint`)

### GitHub Setup
- [ ] Git repository initialized
- [ ] `.gitignore` includes `.env` and sensitive files
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Repository is private (or public if you prefer)
- [ ] All files uploaded correctly

### Netlify Configuration
- [ ] Netlify account created
- [ ] GitHub connected to Netlify
- [ ] Repository selected in Netlify
- [ ] Build command set: `npm run build`
- [ ] Publish directory set: `.output/public`
- [ ] Node version specified: `24.17.0`

### Environment Variables (Netlify)
- [ ] `SUPABASE_PROJECT_ID` added
- [ ] `SUPABASE_URL` added
- [ ] `SUPABASE_PUBLISHABLE_KEY` added
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added
- [ ] `VITE_SUPABASE_URL` added
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` added
- [ ] All keys match Supabase project
- [ ] No typos in environment variable names

---

## Post-Deployment Checklist

### Initial Deployment
- [ ] Netlify build completed successfully
- [ ] No build errors in logs
- [ ] Site is live and accessible
- [ ] Custom Netlify URL works
- [ ] SSL certificate issued (HTTPS works)

### Functionality Testing

#### Survey Form
- [ ] Homepage loads without errors
- [ ] Background image displays correctly
- [ ] All form fields render properly
- [ ] Progress bar works
- [ ] Form validation works (try submitting empty form)
- [ ] All chip selectors work (map, weapon, mode, rank)
- [ ] Range slider works (hours per week)
- [ ] Textarea works (feedback)
- [ ] Can submit a complete survey
- [ ] Success message appears after submission
- [ ] Can submit multiple surveys

#### Admin Dashboard
- [ ] `/admin` route loads
- [ ] Statistics display correctly
- [ ] All 6 charts render:
  - [ ] Favorite maps bar chart
  - [ ] Preferred modes pie chart
  - [ ] Weapons horizontal bar chart
  - [ ] Rank distribution bar chart
  - [ ] Submissions timeline
  - [ ] Statistics overview
- [ ] Response table displays data
- [ ] Can export CSV
- [ ] Refresh button works
- [ ] Link to survey form works

#### Database Connection
- [ ] Survey submissions save to Supabase
- [ ] Can view submissions in Supabase dashboard
- [ ] Timestamps are correct
- [ ] All fields save properly
- [ ] Admin dashboard reads from database
- [ ] Real-time updates work (submit survey, refresh admin)

#### Responsive Design
- [ ] Test on desktop browser
- [ ] Test on mobile browser (or use browser dev tools)
- [ ] Test on tablet size
- [ ] All elements responsive
- [ ] No horizontal scrolling
- [ ] Touch interactions work on mobile

#### Performance
- [ ] Page load time < 3 seconds
- [ ] Charts render smoothly
- [ ] No console errors (F12 → Console)
- [ ] Images load properly
- [ ] Fonts load correctly

---

## Security Checklist

### Environment Variables
- [ ] `.env` file NOT in Git repository
- [ ] Service role key NOT exposed in client code
- [ ] Service role key only used in server functions
- [ ] No credentials hardcoded in source files
- [ ] Netlify environment variables set correctly

### Access Control
- [ ] Understand admin panel is currently PUBLIC
- [ ] Plan to add authentication (if needed)
- [ ] Consider Row Level Security for Supabase
- [ ] No sensitive data in survey responses

### Best Practices
- [ ] Using HTTPS (automatic with Netlify)
- [ ] Dependencies up to date (check `npm outdated`)
- [ ] No critical security warnings (`npm audit`)

---

## Optional Enhancements

### Domain & Branding
- [ ] Custom domain configured (optional)
- [ ] DNS records updated (if using custom domain)
- [ ] Update site name in Netlify
- [ ] Customize survey title/branding
- [ ] Update README with live URLs

### Analytics & Monitoring
- [ ] Add Netlify Analytics (optional, paid)
- [ ] Add Google Analytics (optional)
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Monitor Supabase usage

### Authentication & Security
- [ ] Implement Supabase Auth for admin panel
- [ ] Add Row Level Security (RLS) policies
- [ ] Add rate limiting to prevent spam
- [ ] Add CAPTCHA to survey form
- [ ] Create admin user accounts

### Features & Improvements
- [ ] Add more survey questions
- [ ] Customize chart colors
- [ ] Add data filtering in admin dashboard
- [ ] Add date range picker for analytics
- [ ] Add email notifications for new submissions
- [ ] Add data export in multiple formats (JSON, Excel)

### SEO & Sharing
- [ ] Update meta tags with your info
- [ ] Add Open Graph image
- [ ] Submit to search engines (optional)
- [ ] Create social media share links

---

## Troubleshooting Reference

### If Build Fails
1. Check Netlify build logs
2. Verify environment variables are set
3. Check for typos in variable names
4. Ensure Node version is correct
5. Try local build: `npm run build`

### If Database Connection Fails
1. Verify Supabase credentials in Netlify
2. Check Supabase project is active
3. Test connection from Supabase dashboard
4. Check browser console for errors

### If Admin Dashboard is Empty
1. Submit a test survey
2. Check Supabase table editor for data
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
4. Check browser network tab for API errors

### If Charts Don't Display
1. Check browser console for errors
2. Verify recharts library is installed
3. Check data format in admin.functions.ts
4. Test with sample data

---

## Maintenance Schedule

### Weekly
- [ ] Check for new survey submissions
- [ ] Export data backup
- [ ] Check error logs

### Monthly
- [ ] Review Supabase usage
- [ ] Review Netlify bandwidth usage
- [ ] Update dependencies (`npm update`)
- [ ] Check for security updates

### Quarterly
- [ ] Review and update survey questions
- [ ] Analyze trends in data
- [ ] Consider new features
- [ ] Review and improve documentation

---

## Success Metrics

Track these metrics to measure your survey's success:

- **Submission Rate:** Survey completions per day/week
- **Completion Time:** Average time to complete survey
- **Drop-off Rate:** Where users abandon the form
- **Admin Usage:** How often dashboard is accessed
- **Popular Choices:** Most selected maps, weapons, modes
- **User Feedback:** Sentiment in feedback field

---

## Final Verification

Before announcing your survey is live:

- [ ] Submitted at least 3 test surveys
- [ ] Admin dashboard displays all data correctly
- [ ] Shared with a friend for testing
- [ ] No broken links
- [ ] No spelling errors
- [ ] All images load
- [ ] Works on different browsers (Chrome, Firefox, Safari)
- [ ] Works on mobile devices
- [ ] Export CSV contains all data
- [ ] Backup of initial deployment created

---

## You're Ready! 🚀

If all items are checked, your PUBG Mobile Survey is production-ready and can be shared with your community!

**Live URLs:**
- Survey: `https://your-site.netlify.app`
- Admin: `https://your-site.netlify.app/admin`

**Next:** Share your survey link and watch the data roll in!

Good luck! 🎮
