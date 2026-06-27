const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add LogOut to lucide-react import if not present
  if (!content.includes('LogOut') && content.includes('lucide-react')) {
    content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
      return `import {${p1}, LogOut} from 'lucide-react';`;
    });
  }

  // Add handleLogout function if not present
  if (!content.includes('handleLogout')) {
    content = content.replace(/(const navigate = useNavigate\(\);)/, `$1\n  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };`);
  }

  // Inject Logout button before the avatar inside header-actions
  // Let's find <div className="avatar"
  if (content.includes('<div className="avatar"') && !content.includes('title="Cerrar sesión"')) {
    content = content.replace(
      /(<div className="avatar"[\s\S]*?<\/div>)/,
      `<button className="icon-btn" onClick={handleLogout} title="Cerrar sesión" style={{ color: '#ef4444' }}><LogOut size={20} /></button>\n            $1`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
