#!/bin/bash
# NovaStrat Server Setup Script (Ubuntu) - FIXED VERSION

echo "🚀 Iniciando configuración del servidor NovaStrat (V2)..."

# Validar que el zip exista
if [ ! -f ~/novastrat_deploy.zip ]; then
    echo "❌ ERROR FATAL: No se encuentra el archivo novastrat_deploy.zip."
    echo "Asegúrate de haberlo subido usando el botón de 'Upload file' y que el nombre sea exactamente novastrat_deploy.zip"
    exit 1
fi

# 1. Descomprimir el proyecto (lo forzamos a estar en /var/www para evitar problemas de permisos o $USER)
echo "📂 Preparando archivos del proyecto en /var/www/novastrat..."
sudo mkdir -p /var/www/novastrat
sudo unzip -o ~/novastrat_deploy.zip -d /var/www/novastrat
sudo chown -R $USER:$USER /var/www/novastrat

# 2. Instalar dependencias y compilar
echo "⚙️ Instalando dependencias del Backend..."
cd /var/www/novastrat/backend-api
npm install

echo "⚙️ Instalando y compilando Web App..."
cd /var/www/novastrat/web-app
npm install
npm run build

echo "⚙️ Instalando y compilando Landing Page..."
cd /var/www/novastrat/landing-page
npm install
npm run build

# 3. Levantar Backend con PM2 (Matamos el anterior por si acaso)
echo "🚀 Levantando Backend API con PM2..."
cd /var/www/novastrat/backend-api
pm2 delete novastrat-api 2>/dev/null || true
pm2 start index.js --name "novastrat-api" -i max
pm2 save

# 4. Configurar Nginx
echo "🌐 Configurando Nginx Reverse Proxy..."
DOMAIN="novastratmx.com"

# Escribimos la configuración asegurando las rutas absolutas (/var/www/...)
sudo bash -c "cat > /etc/nginx/sites-available/novastrat" << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Landing Page (Raíz)
    location / {
        root /var/www/novastrat/landing-page/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Web App (CRM / Bóveda)
    location /app {
        alias /var/www/novastrat/web-app/dist;
        index index.html;
        try_files \$uri \$uri/ /app/index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        client_max_body_size 100M;
    }
    
    # Subidas de archivos locales (opcional)
    location /uploads/ {
        alias /var/www/novastrat/backend-api/uploads/;
    }
}
EOL

sudo ln -sf /etc/nginx/sites-available/novastrat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# 5. Obtener Certificado SSL Gratis
echo "🔒 Configurando HTTPS (SSL) con Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --redirect

echo "=========================================================="
echo "✅ ¡Despliegue finalizado exitosamente!"
echo "Tu aplicación ya debería estar viva y segura en https://$DOMAIN"
echo "=========================================================="
