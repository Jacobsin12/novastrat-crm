#!/bin/bash
# NovaStrat Server Setup Script (Ubuntu) - FIXED VERSION

echo "🚀 Iniciando configuración del servidor NovaStrat (V2)..."

# 1. Validar que estamos en la carpeta correcta
if [ ! -d "/var/www/novastrat/backend-api" ]; then
    echo "❌ ERROR FATAL: El script debe ejecutarse desde /var/www/novastrat con el repositorio clonado."
    exit 1
fi

echo "🚀 Preparando dependencias (Versión Git)..."

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
pm2 start index.js --name "novastrat-api"
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
        proxy_pass http://127.0.0.1:3000/api/;
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

# Limpiar CUALQUIER configuracin previa que Let's Encrypt haya generado para evitar conflictos (el famoso -le-ssl.conf)
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/*le-ssl.conf
sudo rm -f /etc/nginx/sites-available/*le-ssl.conf

sudo ln -sf /etc/nginx/sites-available/novastrat /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# 5. Obtener Certificado SSL Gratis
echo "🔒 Configurando HTTPS (SSL) con Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --redirect

echo "=========================================================="
echo "✅ ¡Despliegue finalizado exitosamente!"
echo "Tu aplicación ya debería estar viva y segura en https://$DOMAIN"
echo "=========================================================="
