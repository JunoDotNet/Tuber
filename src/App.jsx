// src/App.jsx
import { useEffect, useState } from 'react';

function App() {
  const [templates, setTemplates] = useState(null);

  useEffect(() => {
    window.electronAPI.getTemplates().then(setTemplates);
  }, []);

  return (
    <div>
      <h1>Templates</h1>
      <pre>{JSON.stringify(templates, null, 2)}</pre>
    </div>
  );
}

export default App;
