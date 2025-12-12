// electron/fs/createProjectFolders.js
import fs from "fs";
import path from "path";

/**
 * Creates all folders for a project.
 * @param {string} targetPath - Where to create the project.
 * @param {string} projectName - Folder name for the project.
 * @param {object} template - Template structure from templates.json
 * @param {string[]} shots - Array of shots (example: ["sh010", "sh020"])
 * @returns {object} success/error message
 */
export function createProjectFolders({ targetPath, projectName, template, shots }) {
  console.log("🚀 createProjectFolders() called with:", {
    targetPath, projectName, template, shots
  });

  // Validate required parameters
  if (!targetPath || !projectName) {
    return { success: false, error: "Missing required parameters: targetPath and projectName" };
  }
  if (!template || typeof template !== 'object') {
    return { success: false, error: "Missing or invalid template object" };
  }

  //
  // 🔥 Step 1: Ensure targetPath is writable
  //
  let finalBasePath = targetPath;

  try {
    if (!fs.existsSync(finalBasePath)) {
      // MUST be recursive or Windows throws EPERM
      fs.mkdirSync(finalBasePath, { recursive: true });
    }
    // Test write permissions
    const testFile = path.join(finalBasePath, `.test_${Date.now()}`);
    fs.writeFileSync(testFile, '');
    fs.unlinkSync(testFile);
  } catch (err) {
    console.warn("⚠️ Can't write to target path, falling back:", err.message);

    // fallback into USERPROFILE\Projects
    const home = process.env.USERPROFILE || process.env.HOME;
    finalBasePath = path.join(home, "Projects");

    try {
      if (!fs.existsSync(finalBasePath)) {
        fs.mkdirSync(finalBasePath, { recursive: true });
      }
    } catch (fallbackErr) {
      console.error("❌ Even fallback path failed:", fallbackErr.message);
      return { success: false, error: `Cannot write to ${targetPath} or fallback ${finalBasePath}. ${fallbackErr.message}` };
    }
  }

  //
  // 🔥 Step 2: Create project root folder
  //
  const projectRoot = path.join(finalBasePath, projectName);

  try {
    if (!fs.existsSync(projectRoot)) {
      fs.mkdirSync(projectRoot, { recursive: true });
      console.log("Created root:", projectRoot);
    } else {
      console.log("Root exists (ok):", projectRoot);
    }

    //
    // 🔥 Step 3: Create top-level folders
    //
    if (template && template.root && Array.isArray(template.root)) {
      template.root.forEach(folderName => {
        const subPath = path.join(projectRoot, folderName);

        if (!fs.existsSync(subPath)) {
          fs.mkdirSync(subPath, { recursive: true });
          console.log("Created folder:", subPath);
        } else {
          console.log("Folder exists (ok):", subPath);
        }
      });
    }

    //
    // 🔥 Step 4: Create Shots Folder
    //
    const shotsRoot = path.join(projectRoot, "shots");
    if (!fs.existsSync(shotsRoot)) {
      fs.mkdirSync(shotsRoot, { recursive: true });
      console.log("Created shots folder:", shotsRoot);
    }

    //
    // 🔥 Step 5: Loop through each shot and create subfolders
    //
    if (Array.isArray(shots)) {
      shots.forEach(shot => {
        const shotPath = path.join(shotsRoot, shot);

        if (!fs.existsSync(shotPath)) {
          fs.mkdirSync(shotPath, { recursive: true });
          console.log("Created shot:", shotPath);
        }

        // Create shot structure folders
        if (template && template.shotStructure && Array.isArray(template.shotStructure)) {
          template.shotStructure.forEach(sub => {
            const subPath = path.join(shotPath, sub);
            if (!fs.existsSync(subPath)) {
              fs.mkdirSync(subPath, { recursive: true });
              console.log("Created shot subfolder:", subPath);
            }
          });
        }
      });
    }

    return {
      success: true,
      message: "Project structure created successfully.",
      finalPath: projectRoot
    };

  } catch (err) {
    console.error("❌ Error creating project folders:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Adds a single shot to an existing project.
 * @param {string} projectPath - Path to the existing project root
 * @param {string} shotName - Name of the shot folder (e.g., "sh010")
 * @param {object} template - Template structure from templates.json
 * @returns {object} success/error message
 */
export function addShot({ projectPath, shotName, template }) {
  console.log("🚀 addShot() called with:", {
    projectPath, shotName, template
  });

  // Validate required parameters
  if (!projectPath || !shotName) {
    return { success: false, error: "Missing required parameters: projectPath and shotName" };
  }
  if (!template || typeof template !== 'object') {
    return { success: false, error: "Missing or invalid template object" };
  }

  try {
    // Verify project path exists
    if (!fs.existsSync(projectPath)) {
      return { success: false, error: `Project path does not exist: ${projectPath}` };
    }

    // Create shots folder if it doesn't exist
    const shotsRoot = path.join(projectPath, "shots");
    if (!fs.existsSync(shotsRoot)) {
      fs.mkdirSync(shotsRoot, { recursive: true });
      console.log("Created shots folder:", shotsRoot);
    }

    // Create the shot folder
    const shotPath = path.join(shotsRoot, shotName);
    if (fs.existsSync(shotPath)) {
      return { success: false, error: `Shot folder already exists: ${shotPath}` };
    }

    fs.mkdirSync(shotPath, { recursive: true });
    console.log("Created shot:", shotPath);

    // Create shot structure folders from template
    if (template && template.shotStructure && Array.isArray(template.shotStructure)) {
      template.shotStructure.forEach(sub => {
        const subPath = path.join(shotPath, sub);
        if (!fs.existsSync(subPath)) {
          fs.mkdirSync(subPath, { recursive: true });
          console.log("Created shot subfolder:", subPath);
        }
      });
    }

    return {
      success: true,
      message: `Shot "${shotName}" added successfully.`,
      shotPath: shotPath
    };

  } catch (err) {
    console.error("❌ Error adding shot:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Reads the folder structure of an existing project and builds a tree.
 * @param {string} projectPath - Path to the existing project root
 * @returns {object} success/error with tree structure
 */
export function readProjectStructure(projectPath) {
  console.log("🚀 readProjectStructure() called with:", projectPath);

  try {
    if (!fs.existsSync(projectPath)) {
      return { success: false, error: `Project path does not exist: ${projectPath}` };
    }

    const projectName = path.basename(projectPath);
    const tree = {
      name: projectName,
      children: []
    };

    // Read all top-level folders
    const entries = fs.readdirSync(projectPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      if (entry.isDirectory()) {
        const folderNode = {
          name: entry.name,
          children: []
        };

        // If it's the shots folder, read the shots inside
        if (entry.name === 'shots') {
          const shotsPath = path.join(projectPath, 'shots');
          const shotEntries = fs.readdirSync(shotsPath, { withFileTypes: true });
          
          shotEntries.forEach(shotEntry => {
            if (shotEntry.isDirectory()) {
              const shotNode = {
                name: shotEntry.name,
                children: []
              };

              // Read subfolders within each shot
              const shotSubPath = path.join(shotsPath, shotEntry.name);
              const subEntries = fs.readdirSync(shotSubPath, { withFileTypes: true });
              
              subEntries.forEach(subEntry => {
                if (subEntry.isDirectory()) {
                  shotNode.children.push({
                    name: subEntry.name,
                    children: []
                  });
                }
              });

              folderNode.children.push(shotNode);
            }
          });
        }

        tree.children.push(folderNode);
      }
    });

    return {
      success: true,
      tree: tree,
      projectPath: projectPath
    };

  } catch (err) {
    console.error("❌ Error reading project structure:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Adds an arbitrary folder (can be nested) relative to project root.
 * @param {string} projectPath - Project root path
 * @param {string} relativePath - Relative folder path to create (e.g., "assets/newFolder")
 */
export function addFolder({ projectPath, relativePath }) {
  try {
    if (!projectPath || !relativePath) {
      return { success: false, error: 'Missing projectPath or relativePath' };
    }
    const target = path.join(projectPath, relativePath);
    fs.mkdirSync(target, { recursive: true });
    return { success: true, path: target };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
