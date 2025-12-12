import { useEffect, useState, useRef } from 'react';

function App() {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [projectName, setProjectName] = useState('MyProject');
  const [projectCreated, setProjectCreated] = useState(false);
  const [projectPath, setProjectPath] = useState('');
  const [folderTree, setFolderTree] = useState(null);
  const [targetPath, setTargetPath] = useState('C:/Users');
  const [newShotName, setNewShotName] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [quickShotName, setQuickShotName] = useState('');
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const nodeRefs = useRef({});

  useEffect(() => {
    if (folderTree?.name) {
      setExpandedPaths(new Set([`/${folderTree.name}`]));
      setPan({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [folderTree]);

  // Zoom towards container center on wheel
  const zoomTowardsCenter = (deltaY) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(2.5, Math.max(0.5, zoom + zoomDelta));
    const factor = newZoom / zoom;

    // Adjust pan so the visual center stays under the cursor (center-based)
    const newPanX = centerX - (centerX - pan.x) * factor;
    const newPanY = centerY - (centerY - pan.y) * factor;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  useEffect(() => {
    window.electronAPI.getTemplates().then((data) => {
      setTemplates(data || {});
      const firstTemplate = Object.keys(data || {})[0];
      if (firstTemplate) setSelectedTemplate(firstTemplate);
    });
  }, []);

  const handleBrowseTargetPath = async () => {
    const selectedPath = await window.electronAPI.openFolder();
    if (selectedPath) {
      setTargetPath(selectedPath);
    }
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }
    window.electronAPI.createProject({
      projectName: projectName,
      template: templates[selectedTemplate],
      targetPath: targetPath,
      shots: []
    }).then(response => {
      if (response.success) {
        setProjectCreated(true);
        setProjectPath(response.finalPath);
        window.electronAPI.readProjectStructure(response.finalPath).then((res) => {
          if (res.success) {
            setFolderTree(res.tree);
          }
          setCurrentSlide(1);
        });
        alert("Project created successfully at: " + response.finalPath);
      } else {
        alert("Error: " + response.error);
      }
    });

  };

  const handleOpenProject = async () => {
    const selectedPath = await window.electronAPI.openFolder();
    if (selectedPath) {
      const result = await window.electronAPI.readProjectStructure(selectedPath);
      if (result.success) {
        setProjectCreated(true);
        setProjectPath(result.projectPath);
        setFolderTree(result.tree);
        setCurrentSlide(1);
        alert("Project opened successfully!");
      } else {
        alert("Error: " + result.error);
      }
    }
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
    }).then(async (response) => {
      if (response.success) {
        setNewShotName('');
        const refresh = await window.electronAPI.readProjectStructure(projectPath);
        if (refresh.success) setFolderTree(refresh.tree);
      } else {
        alert("Error: " + response.error);
      }
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
      {currentSlide === 0 && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ marginTop: 0, marginBottom: '30px', textAlign: 'center' }}>Project Setup</h1>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Select Template:
              </label>
              {Object.keys(templates).length > 0 ? (
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
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
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Project Name:
              </label>
              <input
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Save Location:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Choose target path"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button onClick={handleBrowseTargetPath} style={{ padding: '10px 16px' }}>Browse</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handleCreateProject} disabled={projectCreated} style={{ padding: '10px 16px' }}>
                Create Project
              </button>
              <button onClick={handleOpenProject} style={{ padding: '10px 16px' }}>
                Open Existing Project
              </button>
            </div>
          </div>
        </div>
      )}

      {currentSlide === 1 && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <button onClick={() => setQuickMenuOpen((prev) => !prev)} style={{ padding: '10px 12px' }}>+
              </button>
              {quickMenuOpen && (
                <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Shot name (e.g., sh010)"
                      value={quickShotName}
                      onChange={(e) => setQuickShotName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          if (!quickShotName.trim()) { alert('Enter shot name'); return; }
                          const res = await window.electronAPI.addShot({ projectPath, shotName: quickShotName, template: templates[selectedTemplate] });
                          if (res?.success) {
                            setQuickShotName('');
                            setQuickMenuOpen(false);
                            const refresh = await window.electronAPI.readProjectStructure(projectPath);
                            if (refresh.success) setFolderTree(refresh.tree);
                          } else {
                            alert('Error: ' + (res?.error || 'Unknown'));
                          }
                        }
                      }}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
                    />
                    <button
                      onClick={async () => {
                        if (!quickShotName.trim()) { alert('Enter shot name'); return; }
                        const res = await window.electronAPI.addShot({ projectPath, shotName: quickShotName, template: templates[selectedTemplate] });
                        if (res?.success) {
                          setQuickShotName('');
                          setQuickMenuOpen(false);
                          const refresh = await window.electronAPI.readProjectStructure(projectPath);
                          if (refresh.success) setFolderTree(refresh.tree);
                        } else {
                          alert('Error: ' + (res?.error || 'Unknown'));
                        }
                      }}
                      style={{ padding: '8px 10px' }}
                    >Add Shot</button>
                    <button
                      onClick={async () => {
                        const rel = window.prompt('Relative folder path to add (e.g., assets/renders)');
                        if (!rel) return;
                        const res = await window.electronAPI.addFolder({ projectPath, relativePath: rel });
                        if (res?.success) {
                          const refresh = await window.electronAPI.readProjectStructure(projectPath);
                          if (refresh.success) setFolderTree(refresh.tree);
                        } else {
                          alert('Error: ' + (res?.error || 'Unknown'));
                        }
                      }}
                      style={{ padding: '8px 10px' }}
                    >Add Folder</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <h2 style={{ marginTop: 0 }}>Project: {projectPath || 'Unknown'}</h2>
            <div
              ref={containerRef}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                background: '#fff',
                minHeight: '70vh',
                padding: '16px',
                position: 'relative',
                overflow: 'hidden',
                cursor: isPanning ? 'grabbing' : 'grab'
              }}
              onWheel={(e) => {
                e.preventDefault();
                zoomTowardsCenter(e.deltaY);
              }}
              onMouseDown={(e) => {
                setIsPanning(true);
                setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
              }}
              onMouseMove={(e) => {
                if (!isPanning) return;
                setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
              }}
              onMouseUp={() => setIsPanning(false)}
              onMouseLeave={() => setIsPanning(false)}
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  transition: isPanning ? 'none' : 'transform 0.05s linear',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              >
                {folderTree ? (
                  <TreeNode
                    node={folderTree}
                    level={0}
                    path="/"
                    expandedPaths={expandedPaths}
                    onToggle={(path) => {
                      setExpandedPaths((prev) => {
                        const next = new Set(prev);
                        if (next.has(path)) next.delete(path); else next.add(path);
                        return next;
                      });
                    }}
                    nodeRefs={nodeRefs}
                  />
                ) : (
                  <p>No structure loaded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

// Minimal tree component
function TreeNode({ node, level = 0, path = '', expandedPaths, onToggle, nodeRefs }) {
  const hasChildren = node.children && node.children.length > 0;
  const gap = 24;
  const nodePath = (path.endsWith('/') ? path : path + '/') + (node.name || '');
  const isExpanded = expandedPaths?.has(nodePath);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        ref={(el) => { if (el) nodeRefs.current[nodePath] = el; }}
        onClick={() => { if (hasChildren) onToggle(nodePath); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          border: '1px solid #ddd',
          borderRadius: 4,
          padding: '4px 8px',
          background: '#fafafa',
          cursor: hasChildren ? 'pointer' : 'default'
        }}
        title={hasChildren ? (isExpanded ? 'Collapse' : 'Expand') : 'Leaf'}
      >
        <span>{hasChildren ? (isExpanded ? '📂' : '📁') : '📄'}</span>
        <span>{node.name}</span>
      </button>

      {hasChildren && isExpanded && (
        <div style={{ width: 1, height: 12, background: '#ccc' }} />
      )}

      {hasChildren && isExpanded && (
        <div style={{ position: 'relative', display: 'flex', gap: gap }}>
          <div style={{
            position: 'absolute',
            top: -6,
            left: 0,
            right: 0,
            height: 1,
            background: '#ccc'
          }} />
          {node.children.map((child, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 1, height: 6, background: '#ccc' }} />
              <TreeNode
                node={child}
                level={level + 1}
                path={nodePath}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                nodeRefs={nodeRefs}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
