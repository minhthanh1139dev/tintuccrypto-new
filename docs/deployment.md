# Deployment Guide

To deploy this API in a production environment:

1. Validate your environment variables are correctly set in the server's `.env` or system environment.
2. If using Docker:
   - Make sure `docker-compose.yml` is correctly defining standard Mongo and Redis services.
   - Build and start using `docker-compose up -d --build`.
   - The application relies on Node.js `process.cwd()` for the local `uploads/` dir. Make sure you map a volume to `/app/uploads` so files persist across container restarts if `STORAGE_PROVIDER=local`.
3. If deploying manually on a VPS (PM2):
   - Navigate to the directory
   - `npm install --production`
   - Start with PM2: `pm2 start src/bin/api/api.js --name "tintuccrypto-api"`
4. Use Nginx or another reverse proxy in front of this API to manage SSL and map traffic to `PORT`.
