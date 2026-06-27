const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json()); // Permitir JSON
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// ----------------------------------------------------
// RUTAS DE LEADS (LANDING PAGE)
// ----------------------------------------------------
// Guardar un nuevo lead (Landing Page o Manual)
app.post('/api/leads', (req, res) => {
  const { company_name, contact_email, contact_phone, diagnosis_score } = req.body;
  const sql = `INSERT INTO leads (company_name, contact_email, contact_phone, diagnosis_score) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [company_name, contact_email, contact_phone || null, diagnosis_score || null], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Lead registrado con éxito' });
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
  const { company_name, contact_email, contact_phone, diagnosis_score } = req.body;
  
  const sql = `UPDATE leads SET company_name = ?, contact_email = ?, contact_phone = ?, diagnosis_score = ? WHERE id = ?`;
  db.run(sql, [company_name, contact_email, contact_phone, diagnosis_score, id], function(err) {
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
  const { email, password } = req.body;
  
  // Hardcoded master admin just for testing if DB is empty
  if (email === 'admin@novastrat.com' && password === 'admin123') {
    return res.json({ id: 999, name: 'Súper Admin', role: 'admin' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    
    // Comparar password 
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    res.json({ id: user.id, name: user.name, role: user.role });
  });
});

// Alta de Clientes (Convirtiendo un Lead)
app.post('/api/users/clients', async (req, res) => {
  const { name, email, rawPassword, leadId } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'client')`;
    
    db.run(sql, [name, email, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Este correo ya pertenece a un cliente activo.' });
        }
        return res.status(500).json({ error: err.message });
      }
      const clientId = this.lastID;
      
      // Si viene de un Lead, actualizar el estado
      if (leadId) {
        db.run(`UPDATE leads SET status = 'converted' WHERE id = ?`, [leadId]);
      }
      
      // Crear un proyecto (Pipeline) inicial para este nuevo cliente
      db.run(`INSERT INTO projects (client_id, title) VALUES (?, ?)`, [clientId, `Consultoría - ${name}`]);
      
      res.status(201).json({ id: clientId, message: 'Cliente registrado y Pipeline inicializado' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los consultores (Solo para Admin)
app.get('/api/users/consultants', (req, res) => {
  db.all(`SELECT id, name, email, role, is_active, created_at FROM users WHERE role = 'consultant' ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Alta de un nuevo Consultor (Solo para Admin)
app.post('/api/users/consultants', async (req, res) => {
  const { name, email, rawPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'consultant')`;
    
    db.run(sql, [name, email, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'El correo ya está registrado.' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Consultor registrado correctamente' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar Consultor (Nombre, Email, Estado)
app.put('/api/users/consultants/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, is_active } = req.body;
  
  const sql = `UPDATE users SET name = ?, email = ?, is_active = ? WHERE id = ?`;
  db.run(sql, [name, email, is_active, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'El correo ya está registrado.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Consultor actualizado correctamente' });
  });
});

// Resetear Password de Consultor
app.put('/api/users/consultants/:id/password', async (req, res) => {
  const { id } = req.params;
  const { rawPassword } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const sql = `UPDATE users SET password = ? WHERE id = ?`;
    
    db.run(sql, [hashedPassword, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Contraseña actualizada correctamente' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    res.json({ message: 'Etapa actualizada correctamente', changes: this.changes });
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
  const { uploaded_by, project_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  // En una arquitectura real validaríamos mejor, para MVP asumimos que el cliente tiene un solo proyecto
  const sql = `INSERT INTO documents (project_id, uploaded_by, file_name, file_path) VALUES (?, ?, ?, ?)`;
  // project_id puede ser nulo si es un documento general (admin)
  const pId = project_id === 'null' || !project_id ? null : project_id;

  db.run(sql, [pId, uploaded_by, req.file.originalname, req.file.filename], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: 'Documento subido correctamente' });
  });
});

// ----------------------------------------------------
// INICIO DEL SERVIDOR
// ----------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Backend API escuchando en el puerto ${PORT}`);
});
