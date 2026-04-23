# Deployment Guide - Grounding Designer Pro

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository connected to Vercel

### Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy Frontend**
```bash
cd c:\grounding-calculator
vercel --prod
```

4. **Set Environment Variables**
- In Vercel dashboard, go to Project Settings → Environment Variables
- Add: `REACT_APP_API_URL` = Your backend URL (e.g., `https://grounding-backend.onrender.com`)

### Alternative: GitHub Integration
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
6. Add environment variable: `REACT_APP_API_URL`
7. Click Deploy

---

## Backend Deployment (Render)

### Prerequisites
- Render account (free tier available)
- GitHub repository connected to Render

### Steps

1. **Push Backend Code to GitHub**
   - Ensure `server/` folder is in your repository
   - Commit and push changes

2. **Create Web Service on Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `grounding-backend`
     - Root Directory: `server`
     - Build Command: `npm install`
     - Start Command: `node index.js`
     - Instance Type: Free (or Starter for production)

3. **Set Environment Variables**
   - In Render dashboard, add these variables:
     ```
     PORT=3001
     NODE_ENV=production
     JWT_SECRET=your-secret-key
     DB_USER=postgres
     DB_PASSWORD=your-db-password
     DB_HOST=your-db-host
     DB_PORT=5432
     DB_NAME=grounding_db
     ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your backend URL will be: `https://grounding-backend.onrender.com`

---

## Post-Deployment Configuration

### Update Frontend API URL
After backend is deployed, update the frontend environment variable:

1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Update `REACT_APP_API_URL` to your Render backend URL
4. Redeploy frontend

### Test Deployment
```bash
# Test backend health
curl https://grounding-backend.onrender.com/health

# Test frontend
# Open your Vercel URL in browser
```

---

## Environment Variables Reference

### Frontend (Vercel)
```bash
REACT_APP_API_URL=https://grounding-backend.onrender.com
```

### Backend (Render)
```bash
PORT=3001
NODE_ENV=production
JWT_SECRET=<generate-secure-random-string>
DB_USER=postgres
DB_PASSWORD=<generate-secure-password>
DB_HOST=<render-provided-db-host>
DB_PORT=5432
DB_NAME=grounding_db
```

---

## Troubleshooting

### Frontend Issues
- **Build fails**: Check `vercel.json` configuration
- **API errors**: Verify `REACT_APP_API_URL` is correct
- **Blank page**: Check browser console for errors

### Backend Issues
- **Port binding**: Ensure PORT env var is set to 3001
- **Database connection**: Verify DB credentials in Render
- **Python scripts**: Ensure Python is available in Render environment

### Common Solutions
1. Clear Vercel cache: `vercel --force`
2. Redeploy on Render: Click "Manual Deploy" → "Deploy latest commit"
3. Check logs in both Vercel and Render dashboards

---

## Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Environment variables configured
- [ ] API URL updated in frontend
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] PDF generation works
- [ ] Excel export works
- [ ] All features tested in production

---

## Cost Summary

### Vercel (Frontend)
- Free tier: 100GB bandwidth/month
- Hobby: $20/month (additional features)

### Render (Backend)
- Free tier: 750 hours/month
- Starter: $7/month (more reliable)

### Total: $0-$27/month depending on tier
