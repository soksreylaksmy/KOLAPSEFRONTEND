# KOLAPSE Frontend

KOLAPSE is an elderly-care monitoring platform designed to support fall detection, activity monitoring, alerts, and caregiver response.

This repository contains the KOLAPSE web application used by both customers and administrators.

## Technology Stack

- React
- TypeScript
- Vite
- CSS
- Google OAuth 2.0
- WebSocket
- Nginx
- Docker

## Application Roles

The frontend supports two main roles.

### Customer

Customers can:

- Sign in using an approved Google account
- View registered elders
- View registered cameras
- Monitor activity
- View movement history
- View alert history
- Manage notification settings
- Connect Telegram for alerts
- Manage profile and account settings

### Administrator

Administrators can:

- View registered customers
- Create customer accounts
- Configure customer plans and status
- Register elders
- Register cameras
- Generate camera device keys
- Manage customer setup

User roles are determined by the KOLAPSE backend and database. Users cannot select their own role from the frontend.

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── package-lock.json
└── README.md
```

## Environment Variables

Create a local `.env` file based on `.env.example`.

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
VITE_WS_URL=
```

### VITE_API_URL

Address of the KOLAPSE FastAPI backend.

Local example:

```text
http://127.0.0.1:8000
```

Production example:

```text
https://api.yourdomain.com
```

### VITE_GOOGLE_CLIENT_ID

Google OAuth Client ID used for Google authentication.

The production frontend domain must also be added to the Google OAuth Authorized JavaScript Origins.

### VITE_WS_URL

Optional WebSocket endpoint.

If this variable is empty, the frontend derives the WebSocket address automatically from `VITE_API_URL`.

For example:

```text
VITE_API_URL=http://127.0.0.1:8000
```

automatically uses:

```text
ws://127.0.0.1:8000/ws
```

A production HTTPS backend such as:

```text
https://api.yourdomain.com
```

automatically uses:

```text
wss://api.yourdomain.com/ws
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The application normally runs at:

```text
http://localhost:5173
```

The FastAPI backend should also be running.

## Production Build

Create a production build with:

```bash
npm run build
```

The generated static application is stored in:

```text
dist/
```

The `dist` directory is intentionally excluded from Git.

## Docker

The frontend uses a multi-stage Docker build.

The first stage builds the React/Vite application using Node.js.

The second stage serves the generated static files using Nginx.

Build the frontend image:

```bash
docker build \
  --build-arg VITE_API_URL="https://api.yourdomain.com" \
  --build-arg VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID" \
  -t kolapse-frontend .
```

Run the container:

```bash
docker run -p 8080:80 kolapse-frontend
```

The frontend will then be available at:

```text
http://localhost:8080
```

## Important Vite Deployment Note

Vite environment variables are inserted during the build process.

Therefore, setting `VITE_API_URL` or `VITE_GOOGLE_CLIENT_ID` only after the Docker image has already been built will not update the frontend.

Production values must be supplied when building the image.

## Backend Connection

The frontend communicates with the KOLAPSE FastAPI backend through:

- REST API requests
- JWT authentication
- Google OAuth authentication
- WebSocket communication

The production backend must allow the production frontend domain through its CORS configuration.

## Google Authentication

Before production deployment:

1. Add the production frontend domain to Google OAuth Authorized JavaScript Origins.
2. Build the frontend using the correct Google Client ID.
3. Ensure the backend uses the corresponding Google OAuth configuration.
4. Ensure the customer's email has been approved in the KOLAPSE database.

Google verifies the user's identity.

KOLAPSE determines authorization and roles through the backend database.

## Security

Do not commit the real `.env` file.

The repository contains `.env.example` only as a configuration template.

Do not store:

- Private credentials
- Backend secrets
- JWT secrets
- Telegram bot tokens
- Camera device keys
- Database passwords

inside frontend source code.

The Google OAuth Client ID is a public application identifier, but deployment-specific configuration should still be managed through the environment configuration.

## Production Deployment

The production deployment should provide:

- HTTPS for the frontend
- HTTPS for the FastAPI backend
- Secure WebSocket communication using WSS
- Production backend CORS configuration
- Production Google OAuth origin configuration
- Production environment values

Example architecture:

```text
Customer Browser
       |
       | HTTPS
       v
KOLAPSE Frontend
       |
       | HTTPS / WSS
       v
FastAPI Backend
       |
       v
PostgreSQL
```

The AI inference service operates separately from this frontend and communicates with the backend.

## Current Status

The frontend has been locally tested with:

- Docker
- Nginx
- FastAPI backend
- PostgreSQL
- Google authentication
- Administrator access
- Customer access
- Customer creation
- Elder registration
- Camera registration
- Customer dashboard access

AI inference and production camera-to-cloud transport are handled separately and are not part of this frontend Docker image.

## Handoff

For production deployment, the deployment engineer should:

1. Configure production environment values.
2. Configure the production backend URL.
3. Configure Google OAuth production origins.
4. Build the frontend Docker image with production Vite variables.
5. Deploy the frontend behind HTTPS.
6. Configure backend CORS for the production frontend domain.
7. Verify HTTPS and WSS communication.
8. Test administrator and customer Google login.
9. Perform final end-to-end testing with the backend and AI service.

---

KOLAPSE  
Elderly Care Monitoring and Fall Detection Platform