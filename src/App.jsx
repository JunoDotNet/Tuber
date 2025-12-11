import { useEffect, useState } from 'react';

function App() {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    window.electronAPI.getTemplates().then((data) => {
      setTemplates(data || {});
      const firstTemplate = Object.keys(data || {})[0];
      if (firstTemplate) setSelectedTemplate(firstTemplate);
    });
  }, []);

  return (
    <div>
      <h1>Templates</h1>
      {Object.keys(templates).length > 0 ? (
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          {Object.keys(templates).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      ) : (
        <p>Loading templates...</p>
      )}

      <h2>Selected Template:</h2>
      <pre>{JSON.stringify(templates[selectedTemplate], null, 2)}</pre>
      <button
        onClick={() => {
          window.electronAPI.createProject({
            projectName: "TestProject",
            template: templates[selectedTemplate],
            targetPath: "C:/TEMP"
          }).then(response => {
            console.log("Response:", response);
            alert(JSON.stringify(response, null, 2));
          });
        }}
      >
        Test Create Project
      </button>
    </div>
  );
}

export default App;
