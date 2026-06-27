const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') && f !== 'Login.jsx');

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import for Header
  if (!content.includes("import Header from '../components/Header'")) {
    content = content.replace(
      /import Sidebar from '\.\.\/components\/Sidebar';/,
      "import Sidebar from '../components/Sidebar';\nimport Header from '../components/Header';"
    );
  }

  // Replace <header className="top-header glass-panel"> ... </header>
  // using a regex that matches across multiple lines.
  content = content.replace(/<header className="top-header glass-panel">[\s\S]*?<\/header>/, 
    '<Header toggleSidebar={toggleSidebar} user={user} />'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated header in ${file}`);
}
