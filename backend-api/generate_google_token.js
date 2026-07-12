require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');

const PORT = 3001;

// Estas variables deben estar en el .env antes de ejecutar este script
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("ERROR: Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en tu archivo .env.");
  console.log("Por favor, sigue las instrucciones para crearlos en Google Cloud Console.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive'
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Importante para recibir un refresh_token
  prompt: 'consent',      // Forza la pantalla de consentimiento para garantizar que nos den un nuevo refresh_token
  scope: scopes
});

const app = express();

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.send('Error: No se recibió ningún código.');
    return;
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    console.log('\n\n======================================================');
    console.log('¡ÉXITO! Autenticación completada.');
    console.log('Copia el siguiente token y ponlo en tu archivo .env como GOOGLE_REFRESH_TOKEN:\n');
    console.log(tokens.refresh_token);
    console.log('======================================================\n\n');
    
    res.send('<h1>¡Autenticación completada!</h1><p>Ya puedes cerrar esta pestaña y volver a la terminal en Visual Studio Code.</p>');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (err) {
    console.error('Error al obtener los tokens:', err);
    res.send('Error al obtener los tokens.');
  }
});

app.listen(PORT, () => {
  console.log('======================================================');
  console.log('Paso 1: Por favor, abre esta URL en tu navegador web para autorizar la aplicación:');
  console.log('\n' + url + '\n');
  console.log('Paso 2: Inicia sesión con la cuenta de Gmail de la empresa (o la cuenta gratuita que usarás para alojar los archivos).');
  console.log('Paso 3: Si te sale "Google no ha verificado esta aplicación", haz clic en "Configuración avanzada" y luego en "Ir a NovaStrat (no seguro)".');
  console.log('======================================================');
});
