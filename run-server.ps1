$env:DATABASE_PATH="./data/bookamaze.db"
$env:JWT_SECRET="bookamaze-dev-secret-change-in-production-at-least-32-characters-long"
$env:VITE_APP_URL="http://localhost:3000"
node dist/server/server.js