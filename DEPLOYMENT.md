# Railway Deployment Guide

## Prerequisites
- GitHub account
- Railway account ([railway.app](https://railway.app))
- This codebase in a GitHub repository

## Deployment Steps

### 1. Connect to Railway
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your wine inventory repository
4. Railway will auto-detect the configuration and start building

### 2. Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```
NODE_ENV=production
DATABASE_PATH=/app/data/wine_inventory.db
UPLOAD_DIR=/app/data/uploads
CORS_ORIGINS=https://your-frontend-url.up.railway.app
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### 3. Add Persistent Volume
1. In Railway dashboard, go to your project → Settings → Volumes
2. Click "Add Volume"
3. Mount path: `/app/data`
4. This will persist your SQLite database and uploaded images

### 4. Deploy Frontend (Optional)
If you want to deploy the frontend separately:
1. Create a new Railway service
2. Connect the same GitHub repo
3. Set root directory to `client`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.up.railway.app`

### 5. Custom Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain
3. Update CORS_ORIGINS environment variable with your domain

## Environment Variables Reference

### Server (.env)
```bash
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/wine_inventory.db
UPLOAD_DIR=/app/data/uploads
CORS_ORIGINS=https://your-frontend-domain.com
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### Client (.env)
```bash
VITE_API_URL=https://your-backend-domain.up.railway.app
VITE_NODE_ENV=production
```

## Troubleshooting

### Common Issues
1. **Build fails**: Check that all dependencies are in package.json
2. **Database errors**: Ensure persistent volume is mounted to `/app/data`
3. **CORS errors**: Verify CORS_ORIGINS matches your frontend URL
4. **Image uploads fail**: Check UPLOAD_DIR environment variable and volume mount

### Logs
View logs in Railway dashboard → your service → Deployments → View Logs

### Health Check
Your deployed app will have a health check endpoint at:
`https://your-app.up.railway.app/api/health`

## Cost Estimation
- Railway offers $5/month free credit
- Typical usage: $3-8/month for a personal wine inventory app
- Volume storage: $0.25/GB/month

## Files Created/Modified for Deployment
- `railway.json` - Railway configuration
- `nixpacks.toml` - Build configuration
- `server/.env.example` - Server environment template
- `client/.env.example` - Client environment template
- Updated `server/package.json` - Production scripts
- Updated `server/src/index.ts` - Production CORS
- Updated `server/knexfile.js` - Production database path
- Updated `server/src/routes/images.ts` - Production upload paths