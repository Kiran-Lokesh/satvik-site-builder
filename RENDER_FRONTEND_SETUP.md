# Frontend Render Deployment Guide (QA Environment)

## Service Configuration

### Service Type
- **Type**: Static Site (web service)
- **Name**: `satvik-foods-frontend-qa`
- **Region**: Oregon
- **Plan**: Starter

### Build Command
```bash
npm ci && VITE_ENVIRONMENT=test npm run build
```

**Note**: We use the standard `build` command (not `build:test`) because:
- The `build:test` script has hardcoded URLs that won't work on Render
- Environment variables (`VITE_*`) are injected at build time
- The `VITE_ENVIRONMENT=test` prefix ensures the correct environment is set

### Static Publish Path
```
dist
```

This is where Vite outputs the built files.

### Start Command
**Not required** for static sites on Render. Render automatically serves the static files from the `dist` directory.

---

## Required Environment Variables

Set these in Render Dashboard → Your Service → Environment:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Firebase Console → Project Settings → General → Your apps → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Same as above |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Same as above |
| `VITE_BACKEND_API_URL` | Backend API URL | Set to: `https://satvik-foods-service-qa.onrender.com` |
| `VITE_ENVIRONMENT` | Environment name | Set to: `test` |
| `VITE_DATA_SOURCE` | Data source preference | Set to: `backend` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SANITY_PROJECT_ID` | Sanity CMS project ID | `eaaly2y1` |
| `VITE_SANITY_DATASET` | Sanity dataset name | `products` |
| `VITE_SANITY_TOKEN` | Sanity API token | (none) |

---

## Important Notes

### 1. Environment Variables are Build-Time
- All `VITE_*` variables are **embedded at build time**, not runtime
- **You must rebuild** the service after changing any `VITE_*` variable
- Render will automatically rebuild when you update environment variables

### 2. Build Process
1. Render runs `npm ci` to install dependencies
2. Render runs `VITE_ENVIRONMENT=test npm run build`
3. Vite reads all `VITE_*` environment variables
4. Vite builds the app and outputs to `dist/`
5. Render serves files from `dist/` as a static site

### 3. Backend URL
- Make sure `VITE_BACKEND_API_URL` points to your backend service
- Default in `render.yaml`: `https://satvik-foods-service-qa.onrender.com`
- Update this if your backend service has a different URL

### 4. Firebase Configuration
- Get all Firebase config values from Firebase Console
- Go to: Project Settings → General → Your apps → Web app
- Copy the config values to the corresponding `VITE_FIREBASE_*` variables

---

## Deployment Steps

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New" → "Static Site"
   - Connect your GitHub repository
   - Select the `test` branch (or your QA branch)

2. **Configure Service**
   - Name: `satvik-foods-frontend-qa`
   - Build Command: `npm ci && VITE_ENVIRONMENT=test npm run build`
   - Publish Directory: `dist`
   - Region: Oregon (or your preferred region)

3. **Set Environment Variables**
   - Go to Environment tab
   - Add all required `VITE_*` variables
   - Set `VITE_BACKEND_API_URL` to your backend service URL
   - Set `VITE_ENVIRONMENT` to `test`

4. **Deploy**
   - Click "Create Static Site"
   - Render will build and deploy automatically
   - Your site will be available at: `https://satvik-foods-frontend-qa.onrender.com`

---

## Troubleshooting

### Build Fails
- Check that all required `VITE_*` variables are set
- Verify Node.js version (should be 18+)
- Check build logs for specific errors

### Environment Variables Not Working
- Remember: `VITE_*` variables are build-time only
- You must rebuild after changing them
- Check that variable names start with `VITE_`

### Backend Connection Issues
- Verify `VITE_BACKEND_API_URL` is correct
- Check that backend service is running
- Ensure CORS is configured on backend

### Firebase Auth Not Working
- Verify all `VITE_FIREBASE_*` variables are set correctly
- Check Firebase Console for correct values
- Ensure Firebase project is active

---

## Example Environment Variables

```bash
VITE_FIREBASE_API_KEY=AIzaSyB5i_XlajUADqDBUXuXOkuzFYmKz_aqzBA
VITE_FIREBASE_AUTH_DOMAIN=satvik-foods-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=satvik-foods-prod
VITE_FIREBASE_STORAGE_BUCKET=satvik-foods-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_BACKEND_API_URL=https://satvik-foods-service-qa.onrender.com
VITE_ENVIRONMENT=test
VITE_DATA_SOURCE=backend
VITE_SANITY_PROJECT_ID=eaaly2y1
VITE_SANITY_DATASET=products
```

**⚠️ Security Note**: Never commit actual API keys or secrets to git. Always use environment variables.

