# Switch Frontend to Spring Boot Backend

## Current Situation

Your frontend is running on `http://localhost:8080` but still using the old data source.

## ✅ Quick Fix (Choose One)

### Option 1: Restart Frontend (Recommended)

```bash
# Stop the current frontend (Ctrl+C in the terminal where it's running)

# Then restart it
cd /Users/kiranlokesh/github/personal/satvik-foods/satvik-site-builder
npm run dev
```

The frontend will now use:
- `VITE_DATA_SOURCE=backend`
- `VITE_COMMERCE_API_URL=http://localhost:8081`

### Option 2: Browser Console (No Restart)

1. Open your frontend: http://localhost:8080
2. Open Browser DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Run these commands:

```javascript
localStorage.setItem('dataSource', 'backend');
location.reload();
```

## ✅ Verify It's Working

After the fix, you should see:

**In Browser Console:**
```
🔄 Data source: BACKEND
```

**In Network Tab:**
```
GET http://localhost:8081/api/sanity/products
Status: 200
```

**In Backend Logs:**
```bash
tail -f /Users/kiranlokesh/github/personal/satvik-foods/satvik-foods-service/backend.log
```

You'll see:
```
GET "/api/sanity/products", parameters={}
```

## 🧪 Test

1. Open http://localhost:8080
2. Products should load
3. Check browser console - should show logs from backend
4. Check network tab - requests to :8081

## 🎉 Success!

When working, you'll have:
- ✅ Frontend on port 8080
- ✅ Spring Boot backend on port 8081
- ✅ Products loading from Sanity via Spring Boot
- ✅ Ready for payment testing!





