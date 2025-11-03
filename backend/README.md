# Backend Proxy - הסבר והדרכה

## למה זה נחוץ?

באפליקציות client-side, המפתח API מוטמע בקוד ה-JavaScript שנשלח לדפדפן. **זה אומר שכל מי שיפתח את האתר יכול לראות את המפתח שלך!**

Backend proxy שומר את המפתח בצד השרת, כך שהוא לא נגיש ל-client.

## ⚠️ אתגר עם Gemini Live API

האפליקציה הזו משתמשת ב-**Gemini Live API** שזה **WebSocket streaming** - לא REST API רגיל. זה מקשה על יצירת proxy כי צריך:

1. WebSocket connection בין client ל-backend
2. WebSocket connection בין backend ל-Gemini API
3. Proxy/relay של המידע בזמן אמת בין השניים

## פתרונות אפשריים

### פתרון 1: WebSocket Proxy (מורכב)

צור backend שיעשה relay של WebSocket connections:
- Client ↔ Backend (WebSocket)
- Backend ↔ Gemini API (WebSocket)
- Backend מחזיק את המפתח

### פתרון 2: Server-Sent Events (SSE) או REST API

שנה את האפליקציה להשתמש ב-REST API במקום Live API:
- Client שולח אודיו ל-backend (REST/WebSocket)
- Backend קורא ל-Gemini API
- Backend מחזיר את התשובה ל-client

### פתרון 3: API Key עם הגבלות (הכי פשוט)

הגדר הגבלות על המפתח ב-Google Cloud Console:
- Domain restrictions (רק מהדומיין שלך)
- IP restrictions
- Quotas נמוכים

**לפרויקטים דמואים זה מספיק!**

## איך להפעיל (אם רוצה לנסות WebSocket Proxy)

```bash
cd backend
npm install
# הוסף .env עם GEMINI_API_KEY
npm run dev
```

**הערה**: צריך גם לשנות את ה-client code כדי שיעבוד דרך ה-backend.

