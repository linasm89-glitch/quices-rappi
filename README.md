# The Training Hour — Rappi

> Quiz en tiempo real para el equipo comercial de Rappi (~260 usuarios)

## Stack
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion + Socket.io-client
- **Backend:** Node.js + Express + Socket.io + ExcelJS
- **Deploy:** Railway (backend) + Vercel (frontend)

---

## Inicio rápido (local)

### 1. Instalar dependencias
```bash
cd Desktop/Quices-Rappi
npm install
```

### 2. Configurar variables de entorno
```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env — agregar tu correo en ADMIN_EMAILS
```

### 3. Levantar servidores
```bash
# Terminal 1
npm run dev:backend    # → http://localhost:3001

# Terminal 2
npm run dev:frontend   # → http://localhost:5173
```

---

## Roles de usuario

| Rol     | Acceso                                         | Cómo obtenerlo                              |
|---------|------------------------------------------------|---------------------------------------------|
| Admin   | Panel completo, crear sesiones, ver analytics  | Agregar email a ADMIN_EMAILS en .env        |
| Trainer | Controlar el quiz en vivo                      | Mismo que admin (está en ADMIN_EMAILS)      |
| Player  | Participar en el quiz                          | Cualquier @rappi.com                        |

---

## Deploy en producción

### Backend → Railway
1. Crear cuenta en [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo → seleccionar carpeta `backend/`
   (O usar Railway CLI: `cd backend && railway up`)
3. Agregar variables de entorno en Railway dashboard:
   - `PORT=3001` (Railway lo setea automáticamente)
   - `FRONTEND_URL=https://tu-app.vercel.app`
   - `ADMIN_EMAILS=admin@rappi.com,trainer@rappi.com`
   - `NODE_ENV=production`
4. Copiar la URL pública de Railway (ej: `https://training-hour-production.railway.app`)

### Frontend → Vercel
```bash
cd frontend
cp .env.production.example .env.production
# Editar .env.production: VITE_BACKEND_URL=https://tu-backend.railway.app

# Opción A — Vercel CLI
npm i -g vercel
vercel --prod

# Opción B — conectar repo en vercel.com
# Project Settings → Environment Variables → agregar VITE_BACKEND_URL
```

### URLs finales
- Players abren: `https://tu-app.vercel.app` (desde celular)
- Trainer comparte su pantalla en Google Meet con el mismo URL
- Admin accede al panel en: `https://tu-app.vercel.app/admin`

---

## Flujo de una sesión

1. **Admin** crea el quiz en `/admin` → "Nueva Sesión" → agrega preguntas con feedback
2. **Trainer** entra con su correo admin, va a `/trainer` → selecciona la sesión
3. **Players** entran con su `@rappi.com` desde el celular → `/play`
4. Trainer hace clic en "Iniciar Quiz" — todos sincronizan en tiempo real
5. Por cada pregunta: 20 segundos de timer, respuesta, feedback inmediato
6. Al finalizar: Podium animado (trainer) + ScoreBoard personal (players)
7. Admin descarga el reporte Excel desde `/admin/sessions/{id}/results`

---

## Estructura del proyecto

```
Quices-Rappi/
├── package.json                  # Workspace raíz (npm workspaces)
├── README.md
│
├── backend/
│   ├── server.js                 # Entry point — Express + Socket.io
│   ├── railway.json              # Deploy config para Railway
│   ├── .env.example
│   ├── .env.production.example
│   ├── package.json
│   └── src/
│       ├── analyticsService.js   # Cálculo de stats por sesión
│       ├── authMiddleware.js     # Validación de dominio @rappi.com
│       ├── exportService.js      # Generación de Excel con ExcelJS
│       └── roomManager.js        # Lógica de salas y fases del quiz
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── vercel.json               # SPA rewrites + cache headers
    ├── .env.example
    ├── .env.production.example
    ├── package.json
    └── src/
        ├── App.jsx               # Rutas + providers + page transitions
        ├── main.jsx
        ├── index.css             # Tailwind base + mobile utilities
        │
        ├── contexts/
        │   ├── AuthContext.jsx   # Autenticación por email @rappi.com
        │   ├── GameContext.jsx   # Estado del juego en tiempo real
        │   └── SocketContext.jsx # Conexión Socket.io + reconnection
        │
        ├── routes/
        │   ├── AdminShell.jsx    # Layout admin con sidebar
        │   ├── TrainerShell.jsx  # Layout trainer con controles
        │   ├── PlayerShell.jsx   # Layout mobile player
        │   └── LoginPage.jsx
        │
        ├── views/
        │   ├── admin/
        │   │   ├── Dashboard.jsx
        │   │   ├── SessionEditor.jsx
        │   │   ├── SessionResults.jsx
        │   │   ├── QuestionForm.jsx
        │   │   └── QuestionList.jsx
        │   ├── trainer/
        │   │   ├── Lobby.jsx
        │   │   ├── QuestionBroadcast.jsx
        │   │   ├── AnswerReveal.jsx
        │   │   └── Podium.jsx
        │   └── player/
        │       ├── WaitingRoom.jsx
        │       ├── QuestionCard.jsx
        │       ├── FeedbackCard.jsx
        │       └── ScoreBoard.jsx
        │
        ├── components/
        │   ├── ui/
        │   │   ├── ConnectionBanner.jsx  # Reconexión automática banner
        │   │   ├── PageTransition.jsx    # Framer Motion page wrapper
        │   │   ├── CountdownRing.jsx
        │   │   ├── LeaderboardRow.jsx
        │   │   ├── LoadingSpinner.jsx
        │   │   ├── OptionButton.jsx
        │   │   ├── RappiLogo.jsx
        │   │   └── Toast.jsx
        │   ├── admin/
        │   │   ├── ExportButton.jsx
        │   │   └── SessionCard.jsx
        │   └── charts/
        │       └── QuestionBarChart.jsx
        │
        ├── hooks/
        │   └── useCountdown.js
        └── lib/
            ├── constants.js
            ├── formatters.js
            └── validators.js
```

---

## Variables de entorno

### Backend (`.env`)

| Variable       | Descripción                                      | Ejemplo                              |
|----------------|--------------------------------------------------|--------------------------------------|
| PORT           | Puerto del servidor                              | 3001                                 |
| FRONTEND_URL   | URL del frontend para CORS                       | https://tu-app.vercel.app            |
| ADMIN_EMAILS   | Emails con acceso admin/trainer (coma separados) | admin@rappi.com,trainer@rappi.com    |
| NODE_ENV       | Entorno                                          | production                           |

### Frontend (`.env`)

| Variable          | Descripción                      | Ejemplo                                    |
|-------------------|----------------------------------|--------------------------------------------|
| VITE_BACKEND_URL  | URL del backend Railway          | https://tu-backend.railway.app             |
