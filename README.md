# PUBG Mobile Player Survey 🎮

A modern, battle-royale themed survey application for collecting PUBG Mobile player preferences with real-time analytics dashboard.

![PUBG Mobile Survey](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![TanStack Start](https://img.shields.io/badge/TanStack%20Start-v1.168-purple)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## 🌟 Features

### Survey Form
- **8-step interactive survey** collecting player data
- Beautiful military/gaming themed UI with glassmorphism design
- Real-time form validation with Zod
- Progress tracking
- Responsive design (mobile-first)
- Custom chip selectors and range sliders
- Success animation on submission

### Admin Dashboard
- **Live analytics** with 6 interactive charts:
  - Favorite maps distribution (bar chart)
  - Preferred game modes (pie chart)
  - Weapon preferences (horizontal bar)
  - Rank distribution (bar chart)
  - Submission timeline (line chart)
  - Key statistics overview
- Full response table with sortable columns
- **Export to CSV** functionality
- Real-time data refresh
- Responsive data visualization

### Technical Highlights
- **TanStack Start** - Modern React meta-framework with SSR
- **Supabase** - PostgreSQL database with real-time capabilities
- **Tailwind CSS 4** - Custom design system with utilities
- **Recharts** - Beautiful, responsive charts
- **TypeScript** - Full type safety
- **Radix UI** - Accessible component primitives

## 🚀 Live Demo

**Survey:** [Your Netlify URL]  
**Admin:** [Your Netlify URL]/admin

## 📦 Tech Stack

- **Framework:** TanStack Start (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + Custom utilities
- **Database:** Supabase (PostgreSQL)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **UI Components:** Radix UI (shadcn style)
- **State Management:** TanStack Query
- **Routing:** TanStack Router
- **Build Tool:** Vite
- **Deployment:** Netlify

## 🛠️ Local Development

### Prerequisites

- Node.js 24.17.0 or higher
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/pubg-mobile-survey.git
   cd pubg-mobile-survey
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. **Set up Supabase database:**
   - Go to your Supabase project
   - Run the SQL from `DEPLOYMENT.md` to create tables

5. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080)

## 📤 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Netlify with Supabase backend.

### Quick Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Click the button above
2. Connect your GitHub repository
3. Add environment variables in Netlify dashboard
4. Deploy!

## 🗂️ Project Structure

```
├── src/
│   ├── assets/              # Images and static assets
│   ├── components/
│   │   └── ui/             # Radix UI components (40+)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/
│   │   └── supabase/       # Supabase client & types
│   ├── lib/                # Utility functions & server functions
│   ├── routes/             # File-based routing
│   │   ├── __root.tsx      # Root layout
│   │   ├── index.tsx       # Survey form page
│   │   └── admin.tsx       # Admin dashboard
│   ├── router.tsx          # Router configuration
│   ├── server.ts           # Server entry point
│   └── styles.css          # Global styles & design system
├── public/                 # Static files
├── .env.example           # Environment variables template
├── netlify.toml           # Netlify configuration
├── DEPLOYMENT.md          # Deployment guide
└── package.json           # Dependencies & scripts
```

## 🎨 Design System

### Colors
- **Background:** Dark slate (`oklch(0.17 0.018 265)`)
- **Primary:** Electric indigo (`oklch(0.62 0.19 268)`)
- **Accent:** Lighter blue for highlights
- **Surface:** Layered glass panels with backdrop blur

### Typography
- **Display:** Sora (headers, numbers, stencil text)
- **Body:** Manrope (paragraphs, UI text)

### Custom Utilities
- `.glass` - Frosted glass effect
- `.stencil` - Military-style uppercase text
- `.crate` - Rounded container
- `.form-shell` - Form field styling
- `.range-slim` - Custom range slider

## 📊 Database Schema

### `survey_responses`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| player_name | TEXT | Player's display name |
| ign_id | TEXT | In-game numeric ID (optional) |
| favorite_map | TEXT | Preferred map |
| favorite_weapon | TEXT | Go-to weapon |
| preferred_mode | TEXT | Favorite game mode |
| rank_tier | TEXT | Current rank |
| hours_per_week | INTEGER | Hours played per week |
| feedback | TEXT | Optional feedback |
| created_at | TIMESTAMP | Submission time |

### `user_roles`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| role | ENUM | admin/moderator/user |
| created_at | TIMESTAMP | Role assignment time |

## 🔒 Security Notes

⚠️ **Important:** The admin panel is currently **unauthenticated** and publicly accessible. 

### Recommended Security Improvements:
1. Implement Supabase Auth for admin access
2. Add Row Level Security (RLS) policies
3. Implement rate limiting for survey submissions
4. Add CAPTCHA to prevent spam
5. Secure the service role key (never expose to client)

## 🤝 Contributing

This project was built with [Lovable](https://lovable.dev) and is ready for customization.

### Development Workflow
1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Build to verify: `npm run build`
5. Submit a pull request

### Code Style
- ESLint + Prettier configured
- Run `npm run lint` before committing
- Use `npm run format` to auto-format

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 8080)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

## 🐛 Troubleshooting

### Port 8080 already in use
```bash
# Kill the process on port 8080 (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Build fails on Netlify
- Check environment variables are set correctly
- Verify Node version matches `netlify.toml`
- Clear cache and redeploy

### Database connection issues
- Verify Supabase credentials in `.env`
- Check Supabase project is active
- Test connection with Supabase dashboard

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- Powered by [TanStack Start](https://tanstack.com/start)
- Database by [Supabase](https://supabase.com)
- Deployed on [Netlify](https://netlify.com)
- UI components from [Radix UI](https://radix-ui.com)
- Icons from [Lucide](https://lucide.dev)

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ for the PUBG Mobile community**
