# MLH TTU Chapter Website - Deployment Guide

## Vercel Deployment (Recommended)

This application is configured for easy deployment on Vercel with both frontend and backend.

### Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Production Database**: Set up a production database (PostgreSQL recommended)

### Step 1: Prepare for Deployment

1. **Commit all changes** to your GitHub repository
2. **Set up production database** (Supabase, PlanetScale, or Neon recommended)
3. **Update Google OAuth** redirect URIs (will be done after deployment)

### Step 2: Deploy to Vercel

1. **Connect GitHub**: Link your repository to Vercel
2. **Import Project**: Select your MLH TTU repository
3. **Configure Build Settings**:
   - Framework Preset: `Other`
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm install`

### Step 3: Set Environment Variables

In Vercel dashboard, add these environment variables:

```env
# Database
DATABASE_URL=your-production-database-url

# Authentication
SESSION_SECRET=your-secure-session-secret
JWT_SECRET=your-secure-jwt-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
FROM_EMAIL=your-email@gmail.com

# URLs (update with your actual Vercel URL)
CLIENT_URL=https://your-app-name.vercel.app
SERVER_URL=https://your-app-name.vercel.app

# Other
NODE_ENV=production
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### Step 4: Update Google OAuth

After deployment, update your Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Add your Vercel URL to Authorized redirect URIs:
   ```
   https://your-app-name.vercel.app/auth/google/callback
   ```

### Step 5: Database Migration

Run database migrations in production:
```bash
# If using Prisma
npx prisma migrate deploy
npx prisma generate
```

### Features After Deployment

✅ **Multi-device Authentication**: Works from any device  
✅ **Google OAuth**: Stable redirect URLs  
✅ **Magic Link**: Email authentication from any device  
✅ **File Uploads**: Profile pictures and resumes  
✅ **HTTPS**: Secure by default  
✅ **Custom Domain**: Easy to add later  

### Post-Deployment

1. **Test authentication** from multiple devices
2. **Verify file uploads** work correctly
3. **Check email functionality** (magic links)
4. **Monitor performance** in Vercel dashboard

### Custom Domain (Optional)

To add a custom domain:
1. Go to Vercel dashboard → Domains
2. Add your domain (e.g., `mlhttu.com`)
3. Update DNS settings as instructed
4. Update environment variables with new domain

## Alternative Deployment Options

### Railway
- Similar to Vercel but with built-in database
- Good for full-stack applications

### Netlify + Supabase
- Netlify for frontend
- Supabase for backend and database

### DigitalOcean App Platform
- Full-stack deployment
- More control over server configuration

## Database Recommendations

### For Production:
1. **Supabase** (PostgreSQL + Auth + Storage)
2. **PlanetScale** (MySQL with branching)
3. **Neon** (PostgreSQL with serverless)
4. **Railway** (PostgreSQL + deployment)

### Migration from SQLite:
Your current SQLite database will need to be migrated to a production database. The schema is already defined in `server/prisma/schema.prisma`.

## Security Considerations

- ✅ Environment variables are secure in Vercel
- ✅ HTTPS is enforced by default
- ✅ CORS is properly configured
- ✅ Session management is secure
- ✅ File uploads are validated

## Monitoring and Analytics

Vercel provides:
- Performance monitoring
- Error tracking
- Usage analytics
- Build logs

## Cost

- **Vercel**: Free tier includes 100GB bandwidth
- **Database**: Most providers have free tiers
- **Total**: $0-10/month for moderate usage

---

**Ready to deploy!** Your application is fully configured for production deployment on Vercel.