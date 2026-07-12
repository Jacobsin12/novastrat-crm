const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("=== CONFIGURACIÓN DE GOOGLE DRIVE (OAuth2) ===");
console.log("Para evitar límites de cuota, usaremos tu cuenta real de Google Drive.\n");

rl.question('Pega tu CLIENT_ID: ', (clientId) => {
  rl.question('Pega tu CLIENT_SECRET: ', (clientSecret) => {
    const oAuth2Client = new google.auth.OAuth2(
      clientId.trim(),
      clientSecret.trim(),
      'urn:ietf:wg:oauth:2.0:oob'
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive'],
      prompt: 'consent'
    });

    console.log('\n---------------------------------------------------------');
    console.log('1. Abre este enlace en tu navegador e inicia sesión con tu cuenta de Admin:');
    console.log(authUrl);
    console.log('---------------------------------------------------------\n');

    rl.question('2. Pega el código de autorización que te dio Google: ', async (code) => {
      try {
        const { tokens } = await oAuth2Client.getToken(code.trim());
        console.log('\n¡Éxito! Token obtenido correctamente.\n');
        
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Quitar credenciales viejas de Drive si existen
        envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*\n?/g, '');
        envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*\n?/g, '');
        envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*\n?/g, '');
        
        // Agregar nuevas
        envContent += `\nGOOGLE_CLIENT_ID=${clientId.trim()}\nGOOGLE_CLIENT_SECRET=${clientSecret.trim()}\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        fs.writeFileSync(envPath, envContent.trim() + '\n');
        
        console.log('✅ Credenciales guardadas en el archivo .env\n');
        console.log('Ahora solo falta que yo (la IA) actualice index.js para usar esto. ¡Avisame cuando hayas terminado!');
        rl.close();
      } catch (err) {
        console.error('Error al obtener el token:', err.message);
        rl.close();
      }
    });
  });
});
