const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

const files = getAllFiles(directoryPath);

files.forEach(file => {
    if (file.endsWith('.jsx') || file.endsWith('.js')) {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        if (content.includes('http://localhost:3000')) {
            // Reemplazos de strings
            content = content.replace(/'http:\/\/localhost:3000(.*?)'/g, '`${API_BASE}$1`');
            content = content.replace(/"http:\/\/localhost:3000(.*?)"/g, '`${API_BASE}$1`');
            content = content.replace(/`http:\/\/localhost:3000(.*?)`/g, '`${API_BASE}$1`');
            
            // Caso especial para la constante en Vault.jsx
            content = content.replace(/const API = 'http:\/\/localhost:3000';/g, '');
            content = content.replace(/API\}/g, 'API_BASE}'); // En Vault usa `${API}/api/...` -> `${API_BASE}/api/...`
            
            // Inyectar el import si no existe y si usamos API_BASE
            if (content.includes('API_BASE') && !content.includes('import { API_BASE }')) {
                // Calcular ruta relativa a src/config.js
                const relPath = path.relative(path.dirname(file), path.join(__dirname, 'src', 'config.js')).replace(/\\/g, '/');
                const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;
                
                content = `import { API_BASE } from '${importPath}';\n` + content;
            }

            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});
