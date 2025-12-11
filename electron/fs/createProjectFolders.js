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

    return {
      success: true,
      message: "Root + top-level folders created.",
      finalPath: projectRoot
    };

  } catch (err) {
    console.error("❌ Error creating project folders:", err);
    return { success: false, error: err.message };
  }
}
