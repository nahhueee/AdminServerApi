const fs = require("fs-extra");
const path = require("path");
require('dotenv').config();

async function setup() {
  try {
    console.log("📂 Copiando archivos...");

    // Definir archivos individuales
    const filesToCopy = [
      "package.json",
      ".env",
      "config.json"
    ];

    // Copiar archivos individuales
    for (const file of filesToCopy) {
      await fs.copy(file, path.join("out", file));
    }

    console.log("✅ Archivos copiados correctamente.");
  } catch (error) {
    console.error("❌ Error en la configuración:", error);
  }
}


setup();
