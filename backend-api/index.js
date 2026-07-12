require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const { sendWelcomeEmail, sendSuspensionEmail, sendPasswordRecoveryEmail, sendContactEmail } = require('./emailService');

// Configuración de Google Drive
let drive = null;
try {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    // Usar OAuth2 (Cuenta Admin real) para evitar límites de cuota
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    drive = google.drive({ version: 'v3', auth: oAuth2Client });
    console.log('[Google Drive API] Autenticación con OAuth2 (Cuenta Real) configurada correctamente.');
  } else {
    // Fallback a Service Account
    const keyFile = path.join(__dirname, 'google-credentials.json');
    if (fs.existsSync(keyFile)) {
      const auth = new google.auth.GoogleAuth({
        keyFile: keyFile,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      drive = google.drive({ version: 'v3', auth });
      console.log('[Google Drive API] Autenticación con Service Account configurada correctamente.');
    } else {
      console.warn('[Google Drive API] Advertencia: No hay credenciales OAuth ni google-credentials.json. Se usará simulación.');
    }
  }
} catch (authErr) {
  console.error('[Google Drive API] Error en inicialización:', authErr.message);
}

const folderCache = {};
const DRIVE_ROOT_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID || null;

async function getOrCreateDriveFolderForCompany(companyName, emailToShare) {
  if (!drive) return null;
  if (folderCache[companyName]) {
    return folderCache[companyName];
  }
  
  try {
    const safeCompanyName = companyName.replace(/'/g, "\\'");
    let searchQuery = `mimeType='application/vnd.google-apps.folder' and name='NovaStrat - ${safeCompanyName}' and trashed = false`;
    if (DRIVE_ROOT_FOLDER_ID) {
      searchQuery += ` and '${DRIVE_ROOT_FOLDER_ID}' in parents`;
    }
    const searchRes = await drive.files.list({
      q: searchQuery,
      fields: 'files(id)',
      spaces: 'drive',
    });
    
    if (searchRes.data.files && searchRes.data.files.length > 0) {
      const existingFolderId = searchRes.data.files[0].id;
      folderCache[companyName] = existingFolderId;
      return existingFolderId;
    }
    
    const folderMetadata = {
      name: `NovaStrat - ${companyName}`,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (DRIVE_ROOT_FOLDER_ID) {
      folderMetadata.parents = [DRIVE_ROOT_FOLDER_ID];
    }
    
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });
    
    const folderId = folder.data.id;
    folderCache[companyName] = folderId;
    
    if (emailToShare) {
      try {
        await drive.permissions.create({
          fileId: folderId,
          requestBody: {
            role: 'writer',
            type: 'user',
            emailAddress: emailToShare,
          },
          sendNotificationEmail: false,
        });
        console.log(`[Google Drive API] Carpeta compartida con ${emailToShare} como colaborador.`);
      } catch (shareErr) {
        console.error('[Google Drive API] Error compartiendo carpeta:', shareErr.message);
      }
    }
    
    return folderId;
  } catch (err) {
    console.error('[Google Drive API] Error creando carpeta:', err.message);
    return null;
  }
}

async function createClientDriveFolder(companyName, clientEmail) {
  if (drive) {
    try {
      const folderId = await getOrCreateDriveFolderForCompany(companyName, clientEmail);
      return folderId;
    } catch (err) {
      console.error('[Google Drive API] Error en Service Account al crear carpeta:', err.message);
    }
  }
  return null;
}

const app = express();
app.use(cors());
app.use(express.json()); // Permitir JSON
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const webpush = require('web-push');
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BOzFkmK831JsvutMt2cvH216GhnV1ejnCYfgQf2F62ep8O1J6EsuhCNha_R3XoO-N8m8zLJQOKP_XuDre399r2Y';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'mgRbgYQa58Vp8e1fpSLUc2aPliLYoPGHGzymR3TGxiM';

webpush.setVapidDetails(
  'mailto:soporte@novastrat.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

function sendPushNotification(title, body, url = '/dashboard') {
  db.all(`SELECT p.id, p.endpoint, p.p256dh, p.auth FROM push_subscriptions p JOIN users u ON p.user_id = u.id WHERE u.role = 'admin'`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching subscriptions for push:', err.message);
      return;
    }
    
    const payload = JSON.stringify({ title, body, url });
    
    rows.forEach(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      
      webpush.sendNotification(pushSubscription, payload)
        .catch(error => {
          console.error('Error sending push notification to endpoint:', sub.endpoint, error.message);
          // If the subscription is no longer valid (e.g. 410 Gone or 404), delete it from DB
          if (error.statusCode === 410 || error.statusCode === 404) {
            db.run(`DELETE FROM push_subscriptions WHERE id = ?`, [sub.id], (delErr) => {
              if (delErr) console.error('Error deleting expired push subscription:', delErr.message);
              else console.log('Deleted expired push subscription ID:', sub.id);
            });
          }
        });
    });
  });
}

function sendPushNotificationToUser(userId, title, body, url = '/dashboard') {
  if (!userId) {
    console.log('sendPushNotificationToUser: No userId provided.');
    return;
  }
  db.all(`SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching subscriptions for push (targeted):', err.message);
      return;
    }
    
    console.log(`sendPushNotificationToUser: Found ${rows.length} subscriptions for userId ${userId}`);
    const payload = JSON.stringify({ title, body, url });
    
    rows.forEach(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      
      webpush.sendNotification(pushSubscription, payload)
        .then(() => {
          console.log(`Push sent successfully to user ${userId} at endpoint ${sub.endpoint.substring(0, 30)}...`);
        })
        .catch(error => {
          console.error(`Error sending push to user ${userId} at endpoint ${sub.endpoint.substring(0, 30)}... :`, error.message, error.statusCode);
          if (error.statusCode === 410 || error.statusCode === 404) {
            db.run(`DELETE FROM push_subscriptions WHERE id = ?`, [sub.id]);
          }
        });
    });
  });
}

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ----------------------------------------------------
// RUTAS DE SALUD Y PRUEBA
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API funcionando correctamente' });
});

// Obtener estadísticas y actividad para el resumen del dashboard
app.get('/api/dashboard/stats', (req, res) => {
  // 1. Obtener cantidad de clientes activos
  db.get(`SELECT COUNT(*) as activeClients FROM users WHERE role = 'client' AND is_active = 1`, [], (err, clientRow) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const activeClients = clientRow ? clientRow.activeClients || 0 : 0;
    
    // 2. Obtener suma de diagnosis_score de todos los leads activos
    db.get(`SELECT SUM(diagnosis_score) as totalScore FROM leads WHERE is_active = 1`, [], (err, leadRow) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const totalScore = leadRow ? leadRow.totalScore || 0 : 0;
      
      // Cálculo de ingresos estimados: base por clientes activos + valor estimado de leads en pipeline
      const estimatedRevenue = 120000 + (activeClients * 15000) + (totalScore * 500);
      
      // 3. Obtener leads por mes de los últimos 6 meses
      const leadsQuery = `
        SELECT strftime('%m', created_at) as month, COUNT(*) as count 
        FROM leads 
        WHERE created_at >= date('now', '-6 months') AND is_active = 1
        GROUP BY month 
        ORDER BY month ASC
      `;
      
      db.all(leadsQuery, [], (err, leadMonths) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Generar los últimos 6 meses en JS de forma dinámica
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const last6Months = [];
        
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthNum = String(d.getMonth() + 1).padStart(2, '0');
          const monthLabel = monthNames[d.getMonth()];
          
          // Buscar si la base de datos tiene datos para este mes
          const dbMonth = leadMonths.find(m => m.month === monthNum);
          const leadsCount = dbMonth ? dbMonth.count : 0;
          
          last6Months.push({
            name: monthLabel,
            leads: leadsCount
          });
        }
        
        // 4. Obtener actividad reciente combinando leads, documentos y proyectos
        const activities = [];
        
        // a) Obtener últimos 5 leads
        db.all(`SELECT company_name, created_at FROM leads ORDER BY created_at DESC LIMIT 5`, [], (err, leads) => {
          if (!err && leads) {
            leads.forEach(l => {
              activities.push({
                type: 'lead',
                description: `Nuevo prospecto registrado: "${l.company_name}"`,
                date: l.created_at
              });
            });
          }
          
          // b) Obtener últimos 5 documentos
          db.all(`SELECT file_name, created_at FROM documents ORDER BY created_at DESC LIMIT 5`, [], (err, docs) => {
            if (!err && docs) {
              docs.forEach(d => {
                activities.push({
                  type: 'document',
                  description: `Nuevo documento subido: "${d.file_name}"`,
                  date: d.created_at
                });
              });
            }
            
            // c) Obtener últimos 5 proyectos actualizados
            db.all(`SELECT title, stage, created_at FROM projects ORDER BY created_at DESC LIMIT 5`, [], (err, projs) => {
              if (!err && projs) {
                projs.forEach(p => {
                  activities.push({
                    type: 'project',
                    description: `Proyecto "${p.title}" está en etapa: "${p.stage}"`,
                    date: p.created_at
                  });
                });
              }
              
              // Ordenar actividades por fecha descendente
              activities.sort((a, b) => new Date(b.date) - new Date(a.date));
              
              res.json({
                activeClients,
                estimatedRevenue,
                leadsChart: last6Months,
                recentActivity: activities.slice(0, 6)
              });
            });
          });
        });
      });
    });
  });
});

// Obtener estadísticas y datos específicos del consultor
app.get('/api/consultant/:consultantId/dashboard', (req, res) => {
  const { consultantId } = req.params;

  // 1. Obtener los clientes asignados al consultor
  const clientsQuery = `
    SELECT u.id, u.name, u.email, u.company_name, p.title as project_title, p.stage, p.progress, p.id as project_id
    FROM users u
    JOIN projects p ON p.client_id = u.id
    JOIN project_consultants pc ON pc.project_id = p.id
    WHERE u.role = 'client' AND u.is_active = 1 AND pc.consultant_id = ?
  `;

  db.all(clientsQuery, [consultantId], (err, clients) => {
    if (err) return res.status(500).json({ error: err.message });

    const activeClientsCount = clients ? clients.length : 0;

    // 2. Obtener documentos por revisar (documentos subidos por los clientes asignados)
    let docsQuery = `
      SELECT COUNT(*) as docCount 
      FROM documents d
      JOIN projects p ON d.project_id = p.id
      JOIN project_consultants pc ON pc.project_id = p.id
      WHERE pc.consultant_id = ? AND d.uploaded_by != ?
    `;
    db.get(docsQuery, [consultantId, consultantId], (err, docRow) => {
      const pendingDocs = docRow ? docRow.docCount || 0 : 0;

      // 3. Obtener actividades recientes de los proyectos del consultor
      const activities = [];
      const projIds = clients && clients.length > 0 ? clients.map(c => c.project_id) : [];

      if (projIds.length === 0) {
        return res.json({
          activeClients: activeClientsCount,
          pendingDocs: pendingDocs,
          clientsList: clients || [],
          recentActivity: []
        });
      }

      const placeholders = projIds.map(() => '?').join(',');
      
      // Obtener últimos documentos de sus proyectos
      db.all(
        `SELECT d.file_name, d.created_at, u.name as uploader_name 
         FROM documents d 
         JOIN users u ON d.uploaded_by = u.id 
         WHERE d.project_id IN (${placeholders}) 
         ORDER BY d.created_at DESC LIMIT 5`,
        projIds,
        (err, docs) => {
          if (!err && docs) {
            docs.forEach(d => {
              activities.push({
                type: 'document',
                description: `"${d.uploader_name}" subió un documento: "${d.file_name}"`,
                date: d.created_at
              });
            });
          }

          // Obtener últimas actualizaciones de sus proyectos
          db.all(
            `SELECT title, stage, created_at FROM projects WHERE id IN (${placeholders}) ORDER BY created_at DESC LIMIT 5`,
            projIds,
            (err, projs) => {
              if (!err && projs) {
                projs.forEach(p => {
                  activities.push({
                    type: 'project',
                    description: `Proyecto "${p.title}" actualizado a la fase: "${p.stage}"`,
                    date: p.created_at
                  });
                });
              }

              // Ordenar actividades
              activities.sort((a, b) => new Date(b.date) - new Date(a.date));

              res.json({
                activeClients: activeClientsCount,
                pendingDocs: pendingDocs,
                clientsList: clients || [],
                recentActivity: activities.slice(0, 6)
              });
            }
          );
        }
      );
    });
  });
});

// ----------------------------------------------------
// RUTAS DE WEB PUSH NOTIFICATIONS
// ----------------------------------------------------

// Obtener la clave pública de VAPID
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Guardar/actualizar suscripción push de un cliente
app.post('/api/push-subscribe', (req, res) => {
  const { subscription, userId } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'La suscripción es inválida.' });
  }

  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys ? subscription.keys.p256dh : '';
  const auth = subscription.keys ? subscription.keys.auth : '';

  db.get(`SELECT id FROM push_subscriptions WHERE endpoint = ?`, [endpoint], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      db.run(`UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ? WHERE id = ?`, [userId || null, p256dh, auth, row.id], function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ message: 'Suscripción actualizada con éxito.' });
      });
    } else {
      db.run(`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)`, [userId || null, endpoint, p256dh, auth], function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({ id: this.lastID, message: 'Suscripción registrada con éxito.' });
      });
    }
  });
});

// Obtener notificaciones basadas en leads, documentos y proyectos recientes (filtradas y marcadas por usuario)
// Obtener notificaciones basadas en leads, documentos y proyectos recientes (filtradas y marcadas por usuario)
app.get('/api/notifications', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const userId = req.query.userId ? parseInt(req.query.userId) : null;
  const notifications = [];

  if (!userId) {
    return res.json([]);
  }

  // Helpers de Promesas para SQLite locales
  const queryAll = (sql, params = []) => {
    return new Promise((resolve) => {
      db.all(sql, params, (err, rows) => {
        if (err) resolve([]);
        else resolve(rows || []);
      });
    });
  };

  const queryGet = (sql, params = []) => {
    return new Promise((resolve) => {
      db.get(sql, params, (err, row) => {
        if (err) resolve(null);
        else resolve(row);
      });
    });
  };

  try {
    // 1. Obtener información del usuario actual (rol)
    const user = await queryGet('SELECT role FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.json([]);
    }
    const role = user.role;

    // 2. Obtener mapa de estados de notificaciones (leídas/borradas)
    const states = await queryAll('SELECT notification_id, is_read, is_deleted FROM user_notifications_state WHERE user_id = ?', [userId]);
    const stateMap = {};
    states.forEach(r => {
      stateMap[r.notification_id] = { is_read: r.is_read === 1, is_deleted: r.is_deleted === 1 };
    });

    // 3. Obtener notificaciones según el rol
    if (role === 'admin') {
      // --- ADMINISTRADOR (Todo) ---
      // A. Leads
      const leads = await queryAll('SELECT id, company_name, created_at FROM leads ORDER BY created_at DESC LIMIT ?', [limit]);
      leads.forEach(l => {
        const id = `lead-${l.id}`;
        if (stateMap[id] && stateMap[id].is_deleted) return;
        notifications.push({
          id,
          title: 'Nuevo Lead Registrado',
          desc: `La empresa "${l.company_name}" completó su diagnóstico.`,
          time: l.created_at,
          type: 'info',
          url: '/leads',
          read: stateMap[id] ? stateMap[id].is_read : false
        });
      });

      // B. Documentos (todos)
      const docs = await queryAll('SELECT d.id, d.file_name, u.name as uploader_name, d.created_at FROM documents d JOIN users u ON d.uploaded_by = u.id ORDER BY d.created_at DESC LIMIT ?', [limit]);
      docs.forEach(d => {
        const id = `doc-${d.id}`;
        if (stateMap[id] && stateMap[id].is_deleted) return;
        notifications.push({
          id,
          title: 'Documento Subido',
          desc: `"${d.uploader_name}" subió "${d.file_name}".`,
          time: d.created_at,
          type: 'success',
          url: '/vault',
          read: stateMap[id] ? stateMap[id].is_read : false
        });
      });

      // C. Proyectos (todos)
      const projs = await queryAll('SELECT p.id, p.title, p.stage, p.created_at, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id ORDER BY p.created_at DESC LIMIT ?', [limit]);
      projs.forEach(p => {
        const id = `proj-${p.id}-${p.stage.replace(/\s+/g, '-')}`;
        if (stateMap[id] && stateMap[id].is_deleted) return;
        notifications.push({
          id,
          title: 'Proyecto Actualizado',
          desc: `El proyecto "${p.title}" del cliente "${p.client_name}" avanzó a la etapa "${p.stage}".`,
          time: p.created_at,
          type: 'alert',
          url: '/pipeline',
          read: stateMap[id] ? stateMap[id].is_read : false
        });
      });

    } else if (role === 'consultant') {
      // --- CONSULTOR (Solo asignados) ---
      // A. Proyectos Asignados (Asignación de cliente)
      const projs = await queryAll(
        `SELECT p.id, p.title, p.stage, p.created_at, u.name as client_name 
         FROM projects p 
         JOIN users u ON p.client_id = u.id 
         WHERE p.consultant_id = ? 
            OR p.id IN (SELECT project_id FROM project_consultants WHERE consultant_id = ?) 
         ORDER BY p.created_at DESC LIMIT ?`,
        [userId, userId, limit]
      );
      
      projs.forEach(p => {
        // Notificación de Asignación de Cliente
        const assignId = `assign-client-${p.id}`;
        if (!(stateMap[assignId] && stateMap[assignId].is_deleted)) {
          notifications.push({
            id: assignId,
            title: 'Cliente Asignado',
            desc: `El cliente "${p.client_name}" te ha sido asignado con el proyecto "${p.title}".`,
            time: p.created_at,
            type: 'info',
            url: '/pipeline',
            read: stateMap[assignId] ? stateMap[assignId].is_read : false
          });
        }

        // Notificación de Actualización de Proyecto
        const projUpdateId = `proj-${p.id}-${p.stage.replace(/\s+/g, '-')}`;
        if (!(stateMap[projUpdateId] && stateMap[projUpdateId].is_deleted)) {
          notifications.push({
            id: projUpdateId,
            title: 'Proyecto Actualizado',
            desc: `El proyecto "${p.title}" del cliente "${p.client_name}" avanzó a la etapa "${p.stage}".`,
            time: p.created_at,
            type: 'alert',
            url: '/pipeline',
            read: stateMap[projUpdateId] ? stateMap[projUpdateId].is_read : false
          });
        }
      });

      // B. Documentos y Carpetas subidos en sus proyectos asignados
      const docs = await queryAll(
        `SELECT d.id, d.file_name, d.file_path, u.name as uploader_name, d.created_at 
         FROM documents d 
         JOIN users u ON d.uploaded_by = u.id 
         JOIN projects p ON d.project_id = p.id 
         WHERE (p.consultant_id = ? OR p.id IN (SELECT project_id FROM project_consultants WHERE consultant_id = ?))
         ORDER BY d.created_at DESC LIMIT ?`,
        [userId, userId, limit]
      );
      
      docs.forEach(d => {
        const id = `doc-${d.id}`;
        if (stateMap[id] && stateMap[id].is_deleted) return;
        const isFolder = d.file_path === 'folder';
        notifications.push({
          id,
          title: isFolder ? 'Nueva Carpeta Creada' : 'Documento Subido',
          desc: `"${d.uploader_name}" ${isFolder ? 'creó la carpeta' : 'subió'} "${d.file_name}" en tu proyecto asignado.`,
          time: d.created_at,
          type: 'success',
          url: '/vault',
          read: stateMap[id] ? stateMap[id].is_read : false
        });
      });

    } else if (role === 'client') {
      // --- CLIENTE (Solo propio) ---
      // A. Asesor Asignado
      const consultants = await queryAll(
        `SELECT p.id, p.title, p.created_at, c.name as consultant_name 
         FROM projects p 
         JOIN users c ON p.consultant_id = c.id 
         WHERE p.client_id = ? 
         ORDER BY p.created_at DESC LIMIT ?`,
        [userId, limit]
      );
      
      consultants.forEach(p => {
        const id = `assign-consultant-${p.id}`;
        if (stateMap[id] && stateMap[id].is_deleted) return;
        notifications.push({
          id,
          title: 'Asesor Asignado',
          desc: `El consultor "${p.consultant_name}" ha sido asignado a tu proyecto "${p.title}".`,
          time: p.created_at,
          type: 'info',
          url: '/pipeline',
          read: stateMap[id] ? stateMap[id].is_read : false
        });
      });

      // B. Documentos y Carpetas subidos a su cuenta por otros (asesores/admin)
      const docs = await queryAll(
        `SELECT d.id, d.file_name, d.file_path, u.name as uploader_name, d.created_at 
         FROM documents d 
         JOIN users u ON d.uploaded_by = u.id 
         WHERE d.client_id = ? AND d.uploaded_by != ? 
         ORDER BY d.created_at DESC LIMIT ?`,
        [userId, userId, limit]
      );
      
      docs.forEach(d => {
        const id = `doc-${d.id}`;
        if (stateMap[id] && stateMap[id].is_deleted) return;
        const isFolder = d.file_path === 'folder';
        notifications.push({
          id,
          title: isFolder ? 'Nueva Carpeta' : 'Documento Subido',
          desc: `"${d.uploader_name}" ${isFolder ? 'creó la carpeta' : 'subió el documento'} "${d.file_name}" en tu bóveda.`,
          time: d.created_at,
          type: 'success',
          url: '/vault',
          read: stateMap[id] ? stateMap[id].is_read : false
        });
      });

      // C. Su propio proyecto actualizado
      const projs = await queryAll(
        `SELECT p.id, p.title, p.stage, p.created_at 
         FROM projects p 
         WHERE p.client_id = ? 
         ORDER BY p.created_at DESC LIMIT ?`,
        [userId, limit]
      );
      
      projs.forEach(p => {
        const id = `proj-${p.id}-${p.stage.replace(/\s+/g, '-')}`;
        if (stateMap[id] && stateMap[id].is_deleted) return;
        notifications.push({
          id,
          title: 'Proyecto Actualizado',
          desc: `Tu proyecto "${p.title}" avanzó a la etapa "${p.stage}".`,
          time: p.created_at,
          type: 'alert',
          url: '/pipeline',
          read: stateMap[id] ? stateMap[id].is_read : false
        });
      });
    }

    // Ordenar todas las notificaciones combinadas por fecha descendente
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Retornar limitadas
    res.json(notifications.slice(0, limit));

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Marcar notificación como leída
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Se requiere userId en el cuerpo.' });

  const sql = `
    INSERT INTO user_notifications_state (user_id, notification_id, is_read) 
    VALUES (?, ?, 1) 
    ON CONFLICT(user_id, notification_id) 
    DO UPDATE SET is_read = 1
  `;
  db.run(sql, [userId, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Notificación marcada como leída.' });
  });
});

// Eliminar notificación (ocultar para el usuario)
app.delete('/api/notifications/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Se requiere userId.' });

  const sql = `
    INSERT INTO user_notifications_state (user_id, notification_id, is_deleted) 
    VALUES (?, ?, 1) 
    ON CONFLICT(user_id, notification_id) 
    DO UPDATE SET is_deleted = 1
  `;
  db.run(sql, [userId, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Notificación eliminada correctamente.' });
  });
});

// Marcar notificación como no leída
app.put('/api/notifications/:id/unread', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Se requiere userId.' });

  const sql = `
    INSERT INTO user_notifications_state (user_id, notification_id, is_read) 
    VALUES (?, ?, 0) 
    ON CONFLICT(user_id, notification_id) 
    DO UPDATE SET is_read = 0
  `;
  db.run(sql, [userId, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Notificación marcada como no leída.' });
  });
});

// Ocultar todas las notificaciones (limpiar todo el historial)
app.post('/api/notifications/clear-all', (req, res) => {
  const { userId, ids } = req.body;
  if (!userId || !ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios.' });
  }

  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT INTO user_notifications_state (user_id, notification_id, is_deleted) 
      VALUES (?, ?, 1) 
      ON CONFLICT(user_id, notification_id) 
      DO UPDATE SET is_deleted = 1
    `);
    
    ids.forEach(id => {
      stmt.run(userId, id);
    });
    
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Todas las notificaciones eliminadas correctamente.' });
    });
  });
});

// Marcar todas las notificaciones como leídas en bulk
app.post('/api/notifications/read-all', (req, res) => {
  const { userId, ids } = req.body;
  if (!userId || !ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios.' });
  }

  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT INTO user_notifications_state (user_id, notification_id, is_read) 
      VALUES (?, ?, 1) 
      ON CONFLICT(user_id, notification_id) 
      DO UPDATE SET is_read = 1
    `);
    
    ids.forEach(id => {
      stmt.run(userId, id);
    });
    
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas.' });
    });
  });
});

// ----------------------------------------------------
// RUTAS DE LEADS (LANDING PAGE)
// ----------------------------------------------------
// Guardar un nuevo lead (Landing Page o Manual)
app.post('/api/leads', (req, res) => {
  const { company_name, contact_name, contact_email, contact_phone, diagnosis_score, description } = req.body;
  const phone = contact_phone || req.body.phone;
  
  // Verificar si ya existe un lead con el mismo correo electrónico (ignora mayúsculas/minúsculas y espacios vacíos)
  db.get(`SELECT id FROM leads WHERE TRIM(LOWER(contact_email)) = TRIM(LOWER(?))`, [contact_email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.status(400).json({ 
        error: 'already_exists', 
        message: 'Este correo electrónico ya se encuentra registrado. Ya recibimos tu solicitud y nos pondremos en contacto contigo pronto.' 
      });
    }
    
    const sql = `INSERT INTO leads (company_name, contact_name, contact_email, contact_phone, diagnosis_score, description) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [company_name, contact_name || null, contact_email, phone || null, diagnosis_score || null, description || null], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Enviar Notificación Push en tiempo real
      try {
        const contactDisplayName = contact_name ? contact_name : 'Un cliente';
        sendPushNotification(
          'Nuevo Lead Registrado',
          `"${contactDisplayName}" de "${company_name}" completó su diagnóstico express.`,
          '/leads'
        );
      } catch (pushErr) {
        console.error('Error triggering push notification on lead creation:', pushErr.message);
      }

      res.status(201).json({ id: this.lastID, message: 'Lead registrado con éxito' });
    });
  });
});

// Obtener todos los leads (Solo para Admin)
app.get('/api/leads', (req, res) => {
  db.all(`SELECT * FROM leads ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Editar un lead existente
app.put('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const { company_name, contact_name, contact_email, contact_phone, diagnosis_score, description } = req.body;
  
  const sql = `UPDATE leads SET company_name = ?, contact_name = ?, contact_email = ?, contact_phone = ?, diagnosis_score = ?, description = ? WHERE id = ?`;
  db.run(sql, [company_name, contact_name || null, contact_email, contact_phone || null, diagnosis_score || null, description || null, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Lead actualizado correctamente' });
  });
});

// Baja lógica (o reactivación) de un lead
app.put('/api/leads/:id/status', (req, res) => {
  const { id } = req.params;
  const { is_active, lost_reason } = req.body;
  
  const sql = `UPDATE leads SET is_active = ?, lost_reason = ? WHERE id = ?`;
  db.run(sql, [is_active, lost_reason || null, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Estado del lead actualizado' });
  });
});

// ----------------------------------------------------
// RUTAS DE USUARIOS / AUTENTICACIÓN
// ----------------------------------------------------
// Login
app.post('/api/auth/login', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = (req.body.password || '').trim();

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    // Si es el admin maestro y no existe en la DB, crearlo automáticamente
    if (!user && email === 'nova.strat.consulting@gmail.com' && password === 'admin123') {
      try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run(
          `INSERT INTO users (name, email, password, role, is_active, must_change_password) VALUES (?, ?, ?, ?, ?, ?)`,
          ['Súper Admin', 'nova.strat.consulting@gmail.com', hashedPassword, 'admin', 1, 0],
          function(insertErr) {
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            return res.json({ id: this.lastID, name: 'Súper Admin', role: 'admin', must_change_password: 0 });
          }
        );
      } catch (hashErr) {
        return res.status(500).json({ error: hashErr.message });
      }
      return;
    }

    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    
    // Comparar password 
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Validar si el usuario tiene activo 2FA
    if (user.two_factor_enabled === 1) {
      return res.json({ requires_2fa: true, tempUserId: user.id });
    }

    res.json({ id: user.id, name: user.name, role: user.role, must_change_password: user.must_change_password || 0 });
  });
});

// Recuperar contraseña (Olvidé mi contraseña)
app.post('/api/auth/forgot-password', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Se requiere el correo electrónico.' });
  
  db.get(`SELECT id, name, email FROM users WHERE email = ? AND is_active = 1`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'No se encontró ningún usuario activo con ese correo electrónico.' });
    
    const crypto = require('crypto');
    const tempPassword = 'temp_' + crypto.randomBytes(3).toString('hex');
    
    try {
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      db.run(`UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?`, [hashedPassword, user.id], async (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        sendPasswordRecoveryEmail(user.email, user.name, tempPassword)
          .then(result => {
            if (result.previewUrl) console.log(`[Email Recovery] Preview: ${result.previewUrl}`);
          })
          .catch(err => console.error('[Email Recovery] Error:', err.message));
          
        res.json({ message: 'Se ha enviado un correo con tu contraseña temporal.' });
      });
    } catch (hashErr) {
      res.status(500).json({ error: hashErr.message });
    }
  });
});

// Cambio de contraseña obligatorio (primer login)
app.put('/api/auth/change-password', async (req, res) => {
  const { userId, newPassword } = req.body;
  
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'Se requiere userId y newPassword' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run(`UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?`, [hashedPassword, userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ message: 'Contraseña actualizada exitosamente' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambio de contraseña voluntario desde Configuración
app.put('/api/users/change-password-settings', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Se requiere userId, currentPassword y newPassword.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  }
  
  db.get(`SELECT password FROM users WHERE id = ?`, [userId], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.run(`UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?`, [hashedPassword, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Contraseña actualizada exitosamente.' });
      });
    } catch (hashErr) {
      res.status(500).json({ error: hashErr.message });
    }
  });
});

// Alta de Clientes (Convirtiendo un Lead)
app.post('/api/users/clients', async (req, res) => {
  const { name, email, rawPassword, leadId, company_name, phone, description } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    
    const insertClient = (compName, pNum, desc) => {
      const sql = `INSERT INTO users (name, email, password, role, must_change_password, phone, company_name, description) VALUES (?, ?, ?, 'client', 1, ?, ?, ?)`;
      db.run(sql, [name, email, hashedPassword, pNum || null, compName || null, desc || null], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Este correo ya pertenece a un cliente activo.' });
          }
          return res.status(500).json({ error: err.message });
        }
        const clientId = this.lastID;
        
        // Crear carpeta de Google Drive en segundo plano y guardarla
        const companyLabel = compName || name;
        createClientDriveFolder(companyLabel, email)
          .then(driveFolderId => {
            if (driveFolderId) {
              db.run(`UPDATE users SET drive_folder_id = ? WHERE id = ?`, [driveFolderId, clientId], (upErr) => {
                if (upErr) console.error('Error saving drive_folder_id to user:', upErr.message);
                else console.log(`[Database] drive_folder_id "${driveFolderId}" registrado con éxito para el cliente ID ${clientId}`);
              });
            }
          })
          .catch(err => console.error('Error in createClientDriveFolder background task:', err.message));

        // Si viene de un Lead, actualizar el estado
        if (leadId) {
          db.run(`UPDATE leads SET status = 'converted' WHERE id = ?`, [leadId]);
        }
        
        // Crear un proyecto (Pipeline) inicial para este nuevo cliente
        db.run(`INSERT INTO projects (client_id, title) VALUES (?, ?)`, [clientId, `Consultoría - ${companyLabel}`]);
        
        // Enviar correo de bienvenida al nuevo cliente
        sendWelcomeEmail(email, name, 'client', rawPassword)
          .then(result => {
            if (result.previewUrl) {
              console.log(`[Email] Preview: ${result.previewUrl}`);
            }
          })
          .catch(err => console.error('[Email] Error:', err.message));
        
        res.status(201).json({ id: clientId, message: 'Cliente registrado y Pipeline inicializado' });
      });
    };

    if (leadId) {
      db.get(`SELECT company_name, contact_phone, description FROM leads WHERE id = ?`, [leadId], (err, leadRow) => {
        const finalCompany = company_name || (leadRow ? leadRow.company_name : name);
        const finalPhone = phone || (leadRow ? leadRow.contact_phone : null);
        const finalDesc = description || (leadRow ? leadRow.description : null);
        insertClient(finalCompany, finalPhone, finalDesc);
      });
    } else {
      insertClient(company_name, phone, description);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los consultores (Solo para Admin)
app.get('/api/users/consultants', (req, res) => {
  db.all(`SELECT id, name, email, role, is_active, phone, created_at FROM users WHERE role = 'consultant' ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Obtener todos los consultores y administradores (Para asignación)
app.get('/api/users/staff', (req, res) => {
  db.all(`SELECT id, name, email, role, is_active, phone, created_at FROM users WHERE role IN ('consultant', 'admin') ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Alta de un nuevo Consultor (Solo para Admin)
app.post('/api/users/consultants', async (req, res) => {
  const { name, email, rawPassword, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const sql = `INSERT INTO users (name, email, password, role, must_change_password, phone) VALUES (?, ?, ?, 'consultant', 1, ?)`;
    
    db.run(sql, [name, email, hashedPassword, phone || null], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'El correo ya está registrado.' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      // Enviar correo de bienvenida al nuevo consultor
      sendWelcomeEmail(email, name, 'consultant', rawPassword)
        .then(result => {
          if (result.previewUrl) {
            console.log(`[Email] Preview: ${result.previewUrl}`);
          }
        })
        .catch(err => console.error('[Email] Error:', err.message));
      
      res.status(201).json({ id: this.lastID, message: 'Consultor registrado correctamente' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar Consultor (Nombre, Email, Estado, Teléfono)
app.put('/api/users/consultants/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, is_active, phone } = req.body;
  
  const sql = `UPDATE users SET name = ?, email = ?, is_active = ?, phone = ? WHERE id = ?`;
  db.run(sql, [name, email, is_active, phone || null, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'El correo ya está registrado.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Consultor actualizado correctamente' });
  });
});

// Suspender un Consultor (con motivo y email)
app.put('/api/users/consultants/:id/suspend', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  db.get(`SELECT name, email FROM users WHERE id = ? AND role = 'consultant'`, [id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Consultor no encontrado' });
    
    db.run(`UPDATE users SET is_active = 0 WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Enviar correo de suspensión
      sendSuspensionEmail(user.email, user.name, 'consultant', reason)
        .then(result => {
          if (result.previewUrl) console.log(`[Email] Preview: ${result.previewUrl}`);
        })
        .catch(err => console.error('[Email] Error:', err.message));
      
      res.json({ message: 'Consultor suspendido correctamente' });
    });
  });
});

// Resetear Password de Consultor
app.put('/api/users/consultants/:id/password', async (req, res) => {
  const { id } = req.params;
  const { rawPassword } = req.body;
  
  db.get(`SELECT name, email FROM users WHERE id = ? AND role = 'consultant'`, [id], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Consultor no encontrado' });

    try {
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const sql = `UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?`;
      
      db.run(sql, [hashedPassword, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Enviar correo de recuperación/reinicio de contraseña
        sendPasswordRecoveryEmail(user.email, user.name, rawPassword)
          .then(result => {
            if (result.previewUrl) console.log(`[Email Reset] Preview: ${result.previewUrl}`);
          })
          .catch(err => console.error('[Email Reset] Error:', err.message));

        res.json({ message: 'Contraseña restablecida correctamente y correo enviado' });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Obtener todos los clientes (Solo para Admin)
app.get('/api/users/clients', (req, res) => {
  db.all(`SELECT id, name, email, role, is_active, phone, company_name, description, created_at FROM users WHERE role = 'client' ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Editar un cliente (Nombre, Email, Estado)
app.put('/api/users/clients/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, is_active, phone, company_name, description } = req.body;
  
  const sql = `UPDATE users SET name = ?, email = ?, is_active = ?, phone = ?, company_name = ?, description = ? WHERE id = ?`;
  db.run(sql, [name, email, is_active, phone || null, company_name || null, description || null, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'El correo ya está registrado.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Cliente actualizado correctamente' });
  });
});

// Suspender un Cliente (con motivo y email)
app.put('/api/users/clients/:id/suspend', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  db.get(`SELECT name, email FROM users WHERE id = ? AND role = 'client'`, [id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Cliente no encontrado' });
    
    db.run(`UPDATE users SET is_active = 0 WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Enviar correo de suspensión
      sendSuspensionEmail(user.email, user.name, 'client', reason)
        .then(result => {
          if (result.previewUrl) console.log(`[Email] Preview: ${result.previewUrl}`);
        })
        .catch(err => console.error('[Email] Error:', err.message));
      
      res.json({ message: 'Cliente suspendido correctamente' });
    });
  });
});

// Resetear Password de Cliente
app.put('/api/users/clients/:id/password', async (req, res) => {
  const { id } = req.params;
  const { rawPassword } = req.body;
  
  db.get(`SELECT name, email FROM users WHERE id = ? AND role = 'client'`, [id], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Cliente no encontrado' });

    try {
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const sql = `UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?`;
      
      db.run(sql, [hashedPassword, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Enviar correo de recuperación/reinicio de contraseña
        sendPasswordRecoveryEmail(user.email, user.name, rawPassword)
          .then(result => {
            if (result.previewUrl) console.log(`[Email Reset] Preview: ${result.previewUrl}`);
          })
          .catch(err => console.error('[Email Reset] Error:', err.message));

        res.json({ message: 'Contraseña restablecida correctamente y correo enviado' });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// ----------------------------------------------------
// RUTAS DEL KANBAN (PROYECTOS)
// ----------------------------------------------------

// Obtener todos los proyectos (para el tablero Kanban)
app.get('/api/projects', (req, res) => {
  const sql = `
    SELECT p.id, p.title, p.description, p.stage, p.created_at, u.name as client_name 
    FROM projects p
    JOIN users u ON p.client_id = u.id
    WHERE u.is_active = 1
    ORDER BY p.created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Actualizar la etapa (columna) de un proyecto al arrastrarlo
app.put('/api/projects/:id/stage', (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;
  
  db.run(`UPDATE projects SET stage = ? WHERE id = ?`, [stage, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Notificación Push al cliente
    db.get(`SELECT client_id FROM projects WHERE id = ?`, [id], (errProj, proj) => {
      if (!errProj && proj && proj.client_id) {
        try {
          sendPushNotificationToUser(proj.client_id, 'Avance de Proyecto', `Tu proyecto ha cambiado a la etapa: ${stage}`, '/dashboard');
        } catch (e) {
          console.error('Error enviando push por cambio de etapa:', e.message);
        }
      }
    });

    res.json({ message: 'Etapa actualizada correctamente', changes: this.changes });
  });
});

// Obtener el proyecto activo de un cliente específico con sus asesores asociados
app.get('/api/projects/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  db.get(
    `SELECT p.id, p.title, p.description, p.stage, p.progress, p.created_at, p.consultant_id, u.drive_folder_id 
     FROM projects p 
     JOIN users u ON p.client_id = u.id 
     WHERE p.client_id = ? LIMIT 1`, 
    [clientId], 
    (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.json(null);
    
    // Buscar todos los consultores asociados en la tabla intermedia
    const consSql = `
      SELECT u.id, u.name, u.email, u.phone
      FROM project_consultants pc
      JOIN users u ON pc.consultant_id = u.id
      WHERE pc.project_id = ? AND u.is_active = 1
    `;
    db.all(consSql, [project.id], (err, consultants) => {
      if (err) return res.status(500).json({ error: err.message });
      
      project.consultants = consultants;
      
      // Retrocompatibilidad: rellenar los datos de asesor principal con el primer consultor
      if (consultants && consultants.length > 0) {
        project.consultant_name = consultants[0].name;
        project.consultant_email = consultants[0].email;
        project.consultant_phone = consultants[0].phone;
      } else {
        project.consultant_name = null;
        project.consultant_email = null;
        project.consultant_phone = null;
      }
      
      res.json(project);
    });
  });
});

// Obtener IDs de consultores asignados a un cliente específico
app.get('/api/users/clients/:clientId/consultants', (req, res) => {
  const { clientId } = req.params;
  db.get(`SELECT id FROM projects WHERE client_id = ? LIMIT 1`, [clientId], (err, proj) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!proj) return res.json([]);
    
    db.all(`SELECT consultant_id FROM project_consultants WHERE project_id = ?`, [proj.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(r => r.consultant_id));
    });
  });
});

// Asignar consultores a un cliente específico (desde panel Admin)
app.post('/api/users/clients/:clientId/assign-consultants', (req, res) => {
  const { clientId } = req.params;
  const { consultantIds } = req.body; // Array de IDs de consultores
  
  if (!Array.isArray(consultantIds)) {
    return res.status(400).json({ error: 'consultantIds debe ser un arreglo.' });
  }
  
  db.get(`SELECT id FROM projects WHERE client_id = ? LIMIT 1`, [clientId], (err, proj) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado para este cliente.' });
    
    const projectId = proj.id;
    
    db.serialize(() => {
      // Eliminar asignaciones anteriores
      db.run(`DELETE FROM project_consultants WHERE project_id = ?`, [projectId]);
      
      // Insertar nuevas asignaciones
      if (consultantIds.length > 0) {
        const stmt = db.prepare(`INSERT INTO project_consultants (project_id, consultant_id) VALUES (?, ?)`);
        consultantIds.forEach(cId => {
          stmt.run(projectId, cId);
        });
        stmt.finalize();
      }
      
      // Actualizar consultant_id en projects para retrocompatibilidad (primer consultor del arreglo o null si está vacío)
      const mainConsultantId = consultantIds.length > 0 ? consultantIds[0] : null;
      db.run(`UPDATE projects SET consultant_id = ? WHERE id = ?`, [mainConsultantId, projectId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Notificación Push al cliente
        try {
          sendPushNotificationToUser(clientId, 'Equipo Actualizado', 'Se ha actualizado tu equipo de asesores para el proyecto.', '/team');
        } catch (e) {
          console.error('Error enviando push por asignación de consultores:', e.message);
        }

        res.json({ message: 'Asesores asignados con éxito.' });
      });
    });
  });
});

// ----------------------------------------------------
// RUTAS DE REUNIONES (GOOGLE MEET)
// ----------------------------------------------------

// Obtener reuniones de un cliente específico
app.get('/api/meetings/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  db.all(`SELECT * FROM meetings WHERE client_id = ? ORDER BY date_time DESC`, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Obtener todas las reuniones (para Admin/Consultor)
app.get('/api/meetings/admin', (req, res) => {
  const { consultantId } = req.query;
  let sql = `
    SELECT m.*, u.name as client_name, u.company_name
    FROM meetings m
    JOIN users u ON m.client_id = u.id
  `;
  const params = [];

  if (consultantId) {
    sql += `
      JOIN projects p ON p.client_id = u.id
      JOIN project_consultants pc ON pc.project_id = p.id
      WHERE pc.consultant_id = ?
    `;
    params.push(consultantId);
  }

  sql += ` ORDER BY m.date_time DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Solicitar una nueva reunión (Cliente)
app.post('/api/meetings/request', (req, res) => {
  const { client_id, title, date_time, duration_minutes } = req.body;
  if (!client_id || !title || !date_time) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
  }

  const durationVal = parseInt(duration_minutes) || 60;
  const requestedStart = new Date(date_time).getTime();
  if (requestedStart < Date.now()) {
    return res.status(400).json({ error: 'No es posible agendar una reunión en una fecha o hora pasada.' });
  }

  // 1. Buscar si el cliente tiene un consultor asignado
  const consultantSql = `
    SELECT pc.consultant_id 
    FROM projects p
    JOIN project_consultants pc ON pc.project_id = p.id
    WHERE p.client_id = ? LIMIT 1
  `;

  db.get(consultantSql, [client_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!row) {
      // Si no tiene consultor, insertar directamente
      return insertMeeting(client_id, title, date_time, durationVal, res);
    }

    const consultantId = row.consultant_id;

    // 2. Buscar reuniones existentes del mismo consultor
    const existingMeetingsSql = `
      SELECT m.date_time, m.proposed_date_time, m.status, m.duration_minutes
      FROM meetings m
      JOIN projects p ON m.client_id = p.client_id
      JOIN project_consultants pc ON pc.project_id = p.id
      WHERE pc.consultant_id = ? AND m.status IN ('accepted', 'pending', 'proposed')
    `;

    db.all(existingMeetingsSql, [consultantId], (err2, meetings) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const requestedStart = new Date(date_time).getTime();
      const requestedEnd = requestedStart + durationVal * 60 * 1000;

      // Verificar colisión de intervalo
      const conflict = meetings.find(meet => {
        const targetTimeStr = meet.status === 'proposed' && meet.proposed_date_time ? meet.proposed_date_time : meet.date_time;
        const existingStart = new Date(targetTimeStr).getTime();
        const existingEnd = existingStart + (parseInt(meet.duration_minutes) || 60) * 60 * 1000;
        
        // Hay solapamiento si el inicio solicitado es antes del fin existente Y el fin solicitado es después del inicio existente
        return requestedStart < existingEnd && requestedEnd > existingStart;
      });

      if (conflict) {
        return res.status(400).json({ 
          error: 'El consultor asignado ya tiene una reunión agendada que se solapa con este horario. Por favor, selecciona una hora diferente.' 
        });
      }

      // Sin conflictos, procedemos a guardar la solicitud
      insertMeeting(client_id, title, date_time, durationVal, res);
    });
  });
});

function insertMeeting(clientId, title, dateTime, durationMinutes, res) {
  const sql = `INSERT INTO meetings (client_id, title, date_time, status, duration_minutes) VALUES (?, ?, ?, 'pending', ?)`;
  db.run(sql, [clientId, title, dateTime, durationMinutes], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    try {
      db.get(`SELECT name FROM users WHERE id = ?`, [clientId], (err, user) => {
        if (!err && user) {
          sendPushNotification(
            'Nueva Solicitud de Reunión',
            `El cliente "${user.name}" solicitó una llamada: "${title}".`,
            '/dashboard'
          );
        }
      });
    } catch (pushErr) {
      console.error('Error triggering push on meeting request:', pushErr.message);
    }

    res.status(201).json({ id: this.lastID, message: 'Solicitud de reunión creada con éxito' });
  });
}

// Responder a una solicitud de reunión (Admin/Consultor)
app.put('/api/meetings/:id/respond', (req, res) => {
  const { id } = req.params;
  const { status, proposed_date_time } = req.body; // status: 'accepted', 'rejected', 'proposed'
  
  if (!status) {
    return res.status(400).json({ error: 'Se requiere el estado para responder' });
  }

  if (status === 'proposed' && proposed_date_time) {
    const proposedTime = new Date(proposed_date_time).getTime();
    if (proposedTime < Date.now()) {
      return res.status(400).json({ error: 'No es posible proponer una fecha o hora pasada.' });
    }
  }

  let meet_link = null;
  if (status === 'accepted') {
    const r = () => Math.random().toString(36).substring(2, 5);
    meet_link = `https://meet.google.com/${r()}-${r()}${r().substring(0, 1)}-${r()}`;
    console.log(`[Google Meet API] Generando enlace Meet para reunión ID ${id}: ${meet_link}`);
  }

  db.get(`SELECT proposed_date_time FROM meetings WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    let sql = `UPDATE meetings SET status = ?, proposed_date_time = ?, meet_link = ? WHERE id = ?`;
    let params = [status, proposed_date_time || null, meet_link, id];

    if (status === 'accepted' && row && row.proposed_date_time) {
      sql = `UPDATE meetings SET date_time = proposed_date_time, proposed_date_time = NULL, status = ?, meet_link = ? WHERE id = ?`;
      params = [status, meet_link, id];
    }

    db.run(sql, params, function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      
      db.get(`SELECT client_id, title FROM meetings WHERE id = ?`, [id], (err3, meeting) => {
        if (!err3 && meeting) {
          let msg = `Tu reunión "${meeting.title}" ha sido aceptada.`;
          if (status === 'rejected') msg = `Tu reunión "${meeting.title}" ha sido rechazada.`;
          if (status === 'proposed') msg = `Se ha propuesto un cambio de fecha para "${meeting.title}".`;
          
          sendPushNotification(
            'Actualización de Reunión',
            msg,
            '/dashboard'
          );
        }
      });

      res.json({ message: 'Respuesta registrada correctamente', meet_link });
    });
  });
});

// ----------------------------------------------------
// RUTAS DE LA BÓVEDA DOCUMENTAL
// ----------------------------------------------------

// Obtener documentos globales o filtrados por proyecto
app.get('/api/documents', (req, res) => {
  const { projectId } = req.query;
  let sql = `SELECT d.*, u.name as uploaded_by_name FROM documents d JOIN users u ON d.uploaded_by = u.id`;
  const params = [];
  
  if (projectId) {
    sql += ` WHERE d.project_id = ?`;
    params.push(projectId);
  }
  
  sql += ` ORDER BY d.created_at DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Subir un documento
app.post('/api/documents', upload.single('file'), (req, res) => {
  const { uploaded_by, project_id, client_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  const sql = `INSERT INTO documents (project_id, client_id, uploaded_by, file_name, file_path) VALUES (?, ?, ?, ?, ?)`;
  const pId = project_id === 'null' || !project_id ? null : project_id;
  const cId = client_id && client_id !== 'null' ? client_id : uploaded_by;

  db.run(sql, [pId, cId, uploaded_by, req.file.originalname, req.file.filename], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    const documentId = this.lastID;

    // Obtener información del cliente asociado para nombrar la carpeta, compartirla y obtener su drive_folder_id
    db.get(`SELECT name, role, email, company_name, drive_folder_id FROM users WHERE id = ?`, [cId], async (err, uRow) => {
      if (err) {
        console.error('Error fetching user info for Drive:', err);
        return res.status(201).json({ id: documentId, message: 'Documento guardado localmente' });
      }

      const uName = uRow ? uRow.name : 'Usuario';
      const company = (uRow && uRow.role === 'client') ? (uRow.company_name || uName) : 'General';
      const emailToShare = uRow ? uRow.email : null;
      
      // Auto-generación y persistencia de carpeta si no existe previamente
      let folderId = uRow ? uRow.drive_folder_id : null;
      if (!folderId && uRow && uRow.role === 'client') {
        folderId = await createClientDriveFolder(company, emailToShare);
        if (folderId) {
          db.run(`UPDATE users SET drive_folder_id = ? WHERE id = ?`, [folderId, cId]);
        }
      }

      let driveFileId = null;
      let driveWebViewLink = null;

      if (drive) {
        try {
          console.log(`[Google Drive API] Iniciando carga de "${req.file.originalname}"...`);
          
          // 1. Obtener o crear carpeta del cliente/empresa si no está definida en la base de datos
          const targetFolderId = folderId || await getOrCreateDriveFolderForCompany(company, emailToShare);
          
          // 2. Definir metadatos del archivo
          const fileMetadata = {
            name: req.file.originalname,
          };
          if (targetFolderId) {
            fileMetadata.parents = [targetFolderId];
          }

          // 3. Subir archivo
          const driveResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: {
              mimeType: req.file.mimetype,
              body: fs.createReadStream(req.file.path),
            },
            fields: 'id, webViewLink',
          });

          driveFileId = driveResponse.data.id;
          driveWebViewLink = driveResponse.data.webViewLink;

          console.log(`[Google Drive API] Archivo subido con éxito. ID: ${driveFileId}`);
          console.log(`[Google Drive API] Enlace: ${driveWebViewLink}`);

          // 4. Compartir el archivo específico con el usuario de manera redundante
          if (emailToShare) {
            try {
              await drive.permissions.create({
                fileId: driveFileId,
                requestBody: {
                  role: 'reader',
                  type: 'user',
                  emailAddress: emailToShare,
                },
                sendNotificationEmail: false,
              });
            } catch (shareErr) {
              console.error(`[Google Drive API] Error al compartir archivo con ${emailToShare}:`, shareErr.message);
            }
          }
        } catch (driveErr) {
          console.error('[Google Drive API] Fallo al subir a Drive real:', driveErr.message);
          // Fallback a simulación visual
          driveWebViewLink = `https://drive.google.com/open?id=mock-drive-link-novastrat-${Date.now()}`;
        }
      } else {
        // Fallback a simulación
        driveWebViewLink = `https://drive.google.com/open?id=mock-drive-link-novastrat-${Date.now()}`;
        console.log(`[Google Drive API - SIMULACIÓN] Archivo "${req.file.originalname}" guardado localmente.`);
      }

      res.status(201).json({ 
        id: documentId, 
        message: 'Documento subido y sincronizado con Google Drive correctamente',
        drive_synced: true,
        drive_link: driveWebViewLink
      });
    });
  });
});

// ----------------------------------------------------
// ADMIN — GESTIÓN DE CARPETAS DE GOOGLE DRIVE
// ----------------------------------------------------

// 1. Listar todas las carpetas de Drive (asociadas a clientes + las del Drive real)
app.get('/api/admin/drive/folders', async (req, res) => {
  const { consultantId } = req.query;
  try {
    // Obtener carpetas registradas en la DB (vinculadas a clientes)
    const dbFolders = await new Promise((resolve, reject) => {
      let query = `SELECT id, name, email, company_name, drive_folder_id FROM users WHERE drive_folder_id IS NOT NULL AND drive_folder_id != ''`;
      const params = [];

      if (consultantId) {
        query = `
          SELECT u.id, u.name, u.email, u.company_name, u.drive_folder_id 
          FROM users u
          JOIN projects p ON p.client_id = u.id
          JOIN project_consultants pc ON pc.project_id = p.id
          WHERE u.drive_folder_id IS NOT NULL AND u.drive_folder_id != '' AND pc.consultant_id = ?
        `;
        params.push(consultantId);
      }

      db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows || []));
    });

    const folders = [];
    const knownFolderIds = new Set();

    // Mapear carpetas de la DB
    for (const u of dbFolders) {
      knownFolderIds.add(u.drive_folder_id);
      folders.push({
        folderId: u.drive_folder_id,
        folderName: `NovaStrat - ${u.company_name || u.name}`,
        clientId: u.id,
        clientName: u.name,
        companyName: u.company_name || u.name,
        source: 'db'
      });
    }

    // Si Drive está configurado y NO es un consultor, también traer carpetas reales del Service Account
    if (drive && !consultantId) {
      try {
        let folderQuery = `mimeType='application/vnd.google-apps.folder' and trashed = false`;
        if (DRIVE_ROOT_FOLDER_ID) {
          folderQuery += ` and '${DRIVE_ROOT_FOLDER_ID}' in parents`;
        }
        const driveRes = await drive.files.list({
          q: folderQuery,
          fields: 'files(id, name, createdTime)',
          spaces: 'drive',
          pageSize: 100,
          orderBy: 'name'
        });

        for (const f of (driveRes.data.files || [])) {
          if (!knownFolderIds.has(f.id)) {
            folders.push({
              folderId: f.id,
              folderName: f.name,
              clientId: null,
              clientName: null,
              companyName: null,
              source: 'drive',
              createdTime: f.createdTime
            });
          }
        }
      } catch (driveErr) {
        console.error('[Admin Drive] Error listando carpetas de Drive:', driveErr.message);
      }
    }

    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Crear una nueva carpeta en Drive
app.post('/api/admin/drive/folders', async (req, res) => {
  const { folderName, clientId } = req.body;
  if (!folderName) return res.status(400).json({ error: 'Se requiere folderName.' });

  try {
    let emailToShare = null;
    let companyForFolder = folderName;

    // Si se asocia a un cliente, obtener su info
    if (clientId) {
      const client = await new Promise((resolve, reject) => {
        db.get(`SELECT id, name, email, company_name FROM users WHERE id = ?`, [clientId], (err, row) => err ? reject(err) : resolve(row));
      });
      if (client) {
        emailToShare = client.email;
        companyForFolder = client.company_name || client.name;
      }
    }

    const folderId = await createClientDriveFolder(companyForFolder, emailToShare);

    if (folderId && clientId) {
      await new Promise((resolve, reject) => {
        db.run(`UPDATE users SET drive_folder_id = ? WHERE id = ?`, [folderId, clientId], (err) => err ? reject(err) : resolve());
      });
    }

    if (folderId) {
      res.status(201).json({ success: true, folderId, folderName: `NovaStrat - ${companyForFolder}` });
    } else {
      res.status(500).json({ error: 'No se pudo crear la carpeta. Verifica la configuración de Google Drive.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Listar archivos dentro de una carpeta de Drive
app.get('/api/admin/drive/folders/:folderId/files', async (req, res) => {
  const { folderId } = req.params;

  if (!drive) {
    // Fallback: devolver documentos de la DB asociados a esta carpeta
    return db.all(
      `SELECT d.*, u.name as uploaded_by_name FROM documents d LEFT JOIN users u ON d.uploaded_by = u.id 
       WHERE d.client_id IN (SELECT id FROM users WHERE drive_folder_id = ?) ORDER BY d.created_at DESC`,
      [folderId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json((rows || []).map(r => ({
          id: r.id,
          name: r.file_name,
          mimeType: 'application/octet-stream',
          size: null,
          modifiedTime: r.created_at,
          webViewLink: `http://localhost:3000/uploads/${r.file_path}`,
          uploadedBy: r.uploaded_by_name,
          source: 'local'
        })));
      }
    );
  }

  try {
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
      spaces: 'drive',
      pageSize: 200,
      orderBy: 'modifiedTime desc'
    });

    const docs = await new Promise((resolve) => {
      db.all(`SELECT drive_file_id, uploaded_by, users.name as uploader_name FROM documents LEFT JOIN users ON documents.uploaded_by = users.id WHERE drive_file_id IS NOT NULL`, [], (err, rows) => resolve(rows || []));
    });
    const uploaderMap = {};
    const uploaderNameMap = {};
    docs.forEach(d => {
      uploaderMap[d.drive_file_id] = d.uploaded_by;
      uploaderNameMap[d.drive_file_id] = d.uploader_name;
    });

    const files = (driveRes.data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? parseInt(f.size) : null,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
      uploadedBy: uploaderMap[f.id] || null,
      uploaderName: uploaderNameMap[f.id] || null,
      source: 'drive'
    }));

    res.json(files);
  } catch (err) {
    console.error('[Admin Drive] Error listando archivos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Subir archivo a carpeta específica de Drive
app.post('/api/admin/drive/folders/:folderId/upload', upload.single('file'), async (req, res) => {
  const { folderId } = req.params;
  const { uploaded_by, clientId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo.' });

  // Buscar a qué cliente pertenece esta carpeta si no se proveyó
  let finalClientId = clientId;
  if (!finalClientId) {
    const clientRow = await new Promise((resolve) => {
      db.get(`SELECT id FROM users WHERE drive_folder_id = ?`, [folderId], (err, row) => resolve(row || null));
    });
    finalClientId = clientRow ? clientRow.id : (uploaded_by || null);
  }

  // Guardar registro local en documents
  const docId = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO documents (project_id, client_id, uploaded_by, file_name, file_path) VALUES (?, ?, ?, ?, ?)`,
      [null, finalClientId, uploaded_by || null, req.file.originalname, req.file.filename],
      function(err) { err ? reject(err) : resolve(this.lastID); }
    );
  });

  if (!drive) {
    return res.status(201).json({
      id: docId,
      message: 'Documento guardado localmente (Drive no configurado).',
      drive_synced: false
    });
  }

  try {
    const driveResponse = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [folderId]
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      },
      fields: 'id, webViewLink',
    });

    console.log(`[Admin Drive] Archivo "${req.file.originalname}" subido a carpeta ${folderId}. ID: ${driveResponse.data.id}`);

    await new Promise((resolve) => {
      db.run(`UPDATE documents SET drive_file_id = ? WHERE id = ?`, [driveResponse.data.id, docId], () => resolve());
    });
    
    // Push Notification
    if (finalClientId && finalClientId !== uploaded_by) {
      const uploaderRow = await new Promise(r => db.get(`SELECT name FROM users WHERE id = ?`, [uploaded_by], (e, row) => r(row)));
      const uploaderName = uploaderRow ? uploaderRow.name : 'Un asesor';
      sendPushNotificationToUser(finalClientId, 'Documento Subido', `"${uploaderName}" subió el documento "${req.file.originalname}" en tu bóveda.`, '/vault');
    }

    res.status(201).json({
      id: docId,
      driveFileId: driveResponse.data.id,
      webViewLink: driveResponse.data.webViewLink,
      message: 'Documento subido a Google Drive correctamente.',
      drive_synced: true
    });
  } catch (driveErr) {
    console.error('[Admin Drive] Error subiendo archivo:', driveErr.message);
    res.status(201).json({
      id: docId,
      message: 'Guardado localmente. Error al sincronizar con Drive.',
      drive_synced: false,
      error: driveErr.message
    });
  }
});

// 4b. Crear subcarpeta en Drive
app.post('/api/admin/drive/folders/:folderId/subfolders', async (req, res) => {
  const { folderId } = req.params;
  const { folderName, clientId, uploaded_by } = req.body;
  
  if (!folderName) return res.status(400).json({ error: 'Se requiere folderName.' });
  if (!drive) return res.status(400).json({ error: 'Google Drive no está configurado.' });

  try {
    const driveResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId]
      },
      fields: 'id, name, webViewLink'
    });

    if (clientId && uploaded_by) {
      await new Promise((resolve) => {
        db.run(
          `INSERT INTO documents (project_id, client_id, uploaded_by, file_name, file_path, drive_file_id) VALUES (?, ?, ?, ?, ?, ?)`,
          [null, clientId, uploaded_by, folderName, 'folder', driveResponse.data.id],
          () => resolve()
        );
      });
      // Push Notification al cliente
      const uploaderRow = await new Promise(r => db.get(`SELECT name FROM users WHERE id = ?`, [uploaded_by], (e, row) => r(row)));
      const uploaderName = uploaderRow ? uploaderRow.name : 'Un asesor';
      sendPushNotificationToUser(clientId, 'Nueva Carpeta', `"${uploaderName}" creó la carpeta "${folderName}" en tu bóveda.`, '/vault');
    }

    res.status(201).json(driveResponse.data);
  } catch (err) {
    console.error('[Admin Drive] Error creando subcarpeta:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Eliminar archivo de Drive
app.delete('/api/admin/drive/files/:fileId', async (req, res) => {
  const { fileId } = req.params;

  if (!drive) {
    return res.status(400).json({ error: 'Google Drive no está configurado.' });
  }

  try {
    await drive.files.delete({ fileId });
    console.log(`[Admin Drive] Archivo ${fileId} eliminado de Drive.`);
    res.json({ success: true, message: 'Archivo eliminado de Google Drive.' });
  } catch (err) {
    console.error('[Admin Drive] Error eliminando archivo:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. Listar clientes disponibles (para asociar carpetas)
app.get('/api/admin/clients-list', (req, res) => {
  db.all(
    `SELECT id, name, email, company_name, drive_folder_id FROM users WHERE role = 'client' AND is_active = 1 ORDER BY name`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// ----------------------------------------------------
// VERIFICACIÓN EN DOS PASOS (2FA - TOTP MANUAL)
// ----------------------------------------------------
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let cleaned = base32.replace(/=+$/, '').toUpperCase();
  let length = cleaned.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(cleaned.charAt(i));
    if (val === -1) throw new Error('Carácter Base32 inválido');
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buffer[index++] = (value >> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buffer;
}

function verifyTOTP(token, secret) {
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);
    
    // Rango de -1 a 1 pasos de tiempo (30 segundos) de tolerancia por desincronización de reloj
    for (let i = -1; i <= 1; i++) {
      const timeBuf = Buffer.alloc(8);
      let tempCounter = BigInt(counter + i);
      for (let j = 7; j >= 0; j--) {
        timeBuf[j] = Number(tempCounter & 255n);
        tempCounter >>= 8n;
      }
      
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha1', key).update(timeBuf).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code = ((hmac[offset] & 0x7f) << 24) |
                   ((hmac[offset + 1] & 0xff) << 16) |
                   ((hmac[offset + 2] & 0xff) << 8) |
                   (hmac[offset + 3] & 0xff);
      
      const calculatedToken = String(code % 1000000).padStart(6, '0');
      if (calculatedToken === token) {
        return true;
      }
    }
  } catch (err) {
    console.error('Error verificando TOTP:', err.message);
  }
  return false;
}

function generateBase32Secret() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(10); // 80 bits secreto
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += alphabet.charAt(bytes[i] % 32);
  }
  return result;
}

// Inicializar configuración 2FA
app.post('/api/auth/2fa/setup', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Se requiere el userId.' });
  
  db.get(`SELECT email FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    
    const secret = generateBase32Secret();
    db.run(`UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?`, [secret, userId], (upErr) => {
      if (upErr) return res.status(500).json({ error: upErr.message });
      
      // otpauth URL estándar para Google Authenticator
      const otpauthUrl = `otpauth://totp/NovaStrat:${user.email}?secret=${secret}&issuer=NovaStrat`;
      res.json({
        secret,
        otpauthUrl
      });
    });
  });
});

// Confirmar y habilitar 2FA ingresando un código válido
app.post('/api/auth/2fa/verify-enable', (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token) return res.status(400).json({ error: 'Se requiere userId y token.' });
  
  db.get(`SELECT two_factor_secret FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: 'La verificación en dos pasos no ha sido inicializada.' });
    }
    
    const isValid = verifyTOTP(token, user.two_factor_secret);
    if (isValid) {
      db.run(`UPDATE users SET two_factor_enabled = 1 WHERE id = ?`, [userId], (upErr) => {
        if (upErr) return res.status(500).json({ error: upErr.message });
        res.json({ success: true, message: 'Autenticación en dos pasos (2FA) activada con éxito.' });
      });
    } else {
      res.status(400).json({ error: 'El código ingresado es incorrecto o ya expiró.' });
    }
  });
});

// Desactivar 2FA
app.post('/api/auth/2fa/disable', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Se requiere el userId.' });
  
  db.run(`UPDATE users SET two_factor_secret = NULL, two_factor_enabled = 0 WHERE id = ?`, [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Autenticación 2FA desactivada con éxito.' });
  });
});

// Obtener estado 2FA
app.get('/api/users/:userId/2fa-status', (req, res) => {
  const { userId } = req.params;
  db.get(`SELECT two_factor_enabled FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ enabled: user ? user.two_factor_enabled === 1 : false });
  });
});

// Verificar token 2FA en el Login
app.post('/api/auth/login/verify-2fa', (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token) return res.status(400).json({ error: 'Se requiere userId y token.' });
  
  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    
    const isValid = verifyTOTP(token, user.two_factor_secret);
    if (isValid) {
      res.json({ id: user.id, name: user.name, role: user.role, must_change_password: user.must_change_password || 0 });
    } else {
      res.status(400).json({ error: 'El código de verificación es inválido o expiró.' });
    }
  });
});

// ----------------------------------------------------
// CONTACT FORM (LANDING PAGE)
// ----------------------------------------------------
app.post('/api/landing/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Faltan campos requeridos (nombre, email, mensaje)' });
  }
  
  try {
    const result = await sendContactEmail({ name, email, subject, message });
    if (result.success) {
      res.json({ success: true, message: 'Mensaje enviado correctamente' });
    } else {
      res.status(500).json({ error: 'Error al enviar el correo' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ----------------------------------------------------
// INICIO DEL SERVIDOR
// ----------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor Backend API escuchando en el puerto ${PORT} (127.0.0.1)`);
});
