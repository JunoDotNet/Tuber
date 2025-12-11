import { useEffect, useState } from 'react';

function App() {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [projectCreated, setProjectCreated] = useState(false);
  const [projectPath, setProjectPath] = useState('');
  const [newShotName, setNewShotName] = useState('');

  useEffect(() => {
    window.electronAPI.getTemplates().then((data) => {
      setTemplates(data || {});
      const firstTemplate = Object.keys(data || {})[0];
      if (firstTemplate) setSelectedTemplate(firstTemplate);
    });
  }, []);

  const handleCreateProject = () => {
    window.electronAPI.createProject({
      projectName: "TestProject",
      template: templates[selectedTemplate],
      targetPath: "C:/TEMP",
      shots: []
    }).then(response => {
      console.log("Response:", response);
      if (response.success) {
        setProjectCreated(true);
        setProjectPath(response.finalPath);
        alert("Project created successfully at: " + response.finalPath);
      } else {
        alert("Error: " + response.error);
      }
    });
  };

  const handleAddShot = () => {
    if (!newShotName.trim()) {
      alert("Please enter a shot name");
      return;
    }
    
    window.electronAPI.addShot({
      projectPath: projectPath,
      shotName: newShotName,
      template: templates[selectedTemplate]
    }).then(response => {
      console.log("Response:", response);
      if (response.success) {
        alert("Shot added successfully!");
        setNewShotName('');
      } else {
        alert("Error: " + response.error);
      }
    });
  };

  return (
    <div>
      <h1>Templates</h1>
      {Object.keys(templates).length > 0 ? (
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          disabled={projectCreated}
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

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleCreateProject}
          disabled={projectCreated}
          style={{ opacity: projectCreated ? 0.5 : 1, cursor: projectCreated ? 'not-allowed' : 'pointer' }}
        >
          ✓ Initial Creation
        </button>

        {projectCreated && (
          <div style={{ marginTop: '20px', marginLeft: '20px', display: 'inline-block' }}>
            <input
              type="text"
              placeholder="Enter shot name (e.g., sh010)"
              value={newShotName}
              onChange={(e) => setNewShotName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddShot()}
            />
            <button onClick={handleAddShot} style={{ marginLeft: '10px' }}>
              + Add Shot
            </button>
          </div>
        )}
      </div>

      {projectCreated && (
        <p style={{ marginTop: '20px', color: '#28a745' }}>
          ✓ Project created at: {projectPath}
        </p>
      )}
    </div>
  );
}

export default App;
