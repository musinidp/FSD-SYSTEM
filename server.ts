import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "fsd_database.json");

app.use(express.json());

// Ensure Database exists on launch
function readDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
  }
  return {
    lobbies: [],
    controllers: [],
    fsd_inventory: [],
    lp_master: [],
    alp_master: [],
    operations_ledger: []
  };
}

function writeDatabase(data: any) {
  try {
    const parentDir = path.dirname(DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving database file:", err);
    return false;
  }
}

// -------------------------------------------------------------------------
// OPERATIONAL API ENDPOINTS
// -------------------------------------------------------------------------

// 1. Lobbies CRUD
app.get("/api/fsd/lobbies", (req, res) => {
  const db = readDatabase();
  res.json(db.lobbies || []);
});

app.post("/api/fsd/lobbies", (req, res) => {
  const { lobby_code, lobby_name } = req.body;
  if (!lobby_code || !lobby_name) {
    return res.status(400).json({ error: "Missing required lobby parameters." });
  }
  const db = readDatabase();
  const codeUpper = lobby_code.trim().toUpperCase();
  const existingIndex = db.lobbies.findIndex((l: any) => l.lobby_code === codeUpper);
  
  const lobbyObj = { lobby_code: codeUpper, lobby_name: lobby_name.trim() };
  if (existingIndex >= 0) {
    db.lobbies[existingIndex] = lobbyObj;
  } else {
    db.lobbies.push(lobbyObj);
  }
  writeDatabase(db);
  res.json({ message: "Lobby node registered successfully.", lobby: lobbyObj });
});

// 2. Controllers CRUD ( suffix and limit constraints satisfied! )
app.get("/api/fsd/controllers", (req, res) => {
  const db = readDatabase();
  res.json(db.controllers || []);
});

app.post("/api/fsd/controllers", (req, res) => {
  const { lobby_code, name, mobile } = req.body;
  if (!lobby_code || !name || !mobile) {
    return res.status(400).json({ error: "Missing controller parameters (Lobby, Name, Mobile)." });
  }
  const db = readDatabase();
  const lobbyUpper = lobby_code.trim().toUpperCase();
  const cleanMobile = mobile.trim();

  // Validate mobile suffix
  if (cleanMobile.length < 4) {
    return res.status(400).json({ error: "Mobile number must contain at least 4 digits." });
  }

  // Count existing controllers for limit check
  const existingCount = db.controllers.filter((c: any) => c.lobby_code === lobbyUpper).length;
  if (existingCount >= 20) {
    return res.status(400).json({ error: "Limit of 20 controllers for this lobby reached." });
  }

  const suffix = cleanMobile.slice(-4);
  const cc_id = `${lobbyUpper}CC${suffix}`;

  const newController = {
    cc_id,
    lobby_code: lobbyUpper,
    name: name.trim(),
    mobile: cleanMobile
  };

  // Prevent direct duplicates with same ID
  const duplicateIdx = db.controllers.findIndex((c: any) => c.cc_id === cc_id);
  if (duplicateIdx >= 0) {
    db.controllers[duplicateIdx] = newController;
  } else {
    db.controllers.push(newController);
  }

  writeDatabase(db);
  res.json({ message: "Crew Controller profile generated successfully.", controller: newController });
});

app.delete("/api/fsd/controllers/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.controllers.findIndex((c: any) => c.cc_id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Controller ID not found in database registry." });
  }
  db.controllers.splice(index, 1);
  writeDatabase(db);
  res.json({ message: "Controller registry key revoked." });
});

app.delete("/api/fsd/lobbies/:code", (req, res) => {
  const { code } = req.params;
  const db = readDatabase();
  const index = db.lobbies.findIndex((l: any) => l.lobby_code === code.toUpperCase());
  if (index === -1) {
    return res.status(404).json({ error: "Lobby code not found in registry." });
  }
  db.lobbies.splice(index, 1);
  writeDatabase(db);
  res.json({ message: "Lobby deleted successfully." });
});

// 3. FSD Inventory CRUD
app.get("/api/fsd/inventory", (req, res) => {
  const db = readDatabase();
  res.json(db.fsd_inventory || []);
});

app.post("/api/fsd/inventory", (req, res) => {
  const { serial_no, unit_no, lobby_code } = req.body;
  if (!serial_no || !unit_no || !lobby_code) {
    return res.status(400).json({ error: "Missing FSD registration attributes." });
  }
  const db = readDatabase();
  const serUpper = serial_no.trim().toUpperCase();
  const unitUpper = unit_no.trim().toUpperCase();
  const lobUpper = lobby_code.trim().toUpperCase();

  const existingIdx = db.fsd_inventory.findIndex((f: any) => f.serial_no === serUpper);

  const fsdObj = {
    serial_no: serUpper,
    unit_no: unitUpper,
    lobby_code: lobUpper,
    status: existingIdx >= 0 ? db.fsd_inventory[existingIdx].status : "Available",
    current_lp: existingIdx >= 0 ? db.fsd_inventory[existingIdx].current_lp : "",
    current_alp: existingIdx >= 0 ? db.fsd_inventory[existingIdx].current_alp : "",
    rectification_date: existingIdx >= 0 ? db.fsd_inventory[existingIdx].rectification_date : "",
    repair_notes: existingIdx >= 0 ? db.fsd_inventory[existingIdx].repair_notes : ""
  };

  if (existingIdx >= 0) {
    db.fsd_inventory[existingIdx] = fsdObj;
  } else {
    db.fsd_inventory.push(fsdObj);
  }

  writeDatabase(db);
  res.json({ message: "FSD hardware parameters linked cleanly.", device: fsdObj });
});

app.delete("/api/fsd/inventory/:serial_no", (req, res) => {
  const { serial_no } = req.params;
  const db = readDatabase();
  const index = db.fsd_inventory.findIndex((f: any) => f.serial_no === serial_no.toUpperCase());
  if (index === -1) {
    return res.status(404).json({ error: "FSD Serial profile not found." });
  }
  db.fsd_inventory.splice(index, 1);
  writeDatabase(db);
  res.json({ message: "FSD hardware asset successfully removed." });
});

// 4. LP and ALP Master Directories with bulk upload support
app.get("/api/fsd/crew/lp", (req, res) => {
  const db = readDatabase();
  res.json(db.lp_master || []);
});

app.post("/api/fsd/crew/lp", (req, res) => {
  const { lp_id, lp_name, lobby_code } = req.body;
  if (!lp_id || !lp_name || !lobby_code) {
    return res.status(400).json({ error: "Missing Loco Pilot profile inputs." });
  }
  const db = readDatabase();
  const lpUpper = lp_id.trim().toUpperCase();
  const lobUpper = lobby_code.trim().toUpperCase();

  const existingIdx = db.lp_master.findIndex((l: any) => l.lp_id === lpUpper);
  const lpObj = { lp_id: lpUpper, lp_name: lp_name.trim().toUpperCase(), lobby_code: lobUpper };

  if (existingIdx >= 0) {
    db.lp_master[existingIdx] = lpObj;
  } else {
    db.lp_master.push(lpObj);
  }

  writeDatabase(db);
  res.json({ message: "Loco Pilot registered.", lp: lpObj });
});

app.post("/api/fsd/crew/lp/bulk", (req, res) => {
  const { items } = req.body; // Array of { id, name, lobby }
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid data list for bulk upload." });
  }
  const db = readDatabase();
  let count = 0;
  items.forEach((item: any) => {
    const id = (item.id || item.lp_id || "").toString().trim().toUpperCase();
    const name = (item.name || item.lp_name || "").toString().trim().toUpperCase();
    const lobby = (item.lobby || item.lobby_code || "").toString().trim().toUpperCase();

    if (id && name && lobby) {
      const lpObj = { lp_id: id, lp_name: name, lobby_code: lobby };
      const idx = db.lp_master.findIndex((l: any) => l.lp_id === id);
      if (idx >= 0) {
        db.lp_master[idx] = lpObj;
      } else {
        db.lp_master.push(lpObj);
      }
      count++;
    }
  });
  writeDatabase(db);
  res.json({ message: `Bulk upload completed. Registered/Updated ${count} Loco Pilots.` });
});

app.get("/api/fsd/crew/alp", (req, res) => {
  const db = readDatabase();
  res.json(db.alp_master || []);
});

app.post("/api/fsd/crew/alp", (req, res) => {
  const { alp_id, alp_name, lobby_code } = req.body;
  if (!alp_id || !alp_name || !lobby_code) {
    return res.status(400).json({ error: "Missing Assistant Loco Pilot profile inputs." });
  }
  const db = readDatabase();
  const alpUpper = alp_id.trim().toUpperCase();
  const lobUpper = lobby_code.trim().toUpperCase();

  const existingIdx = db.alp_master.findIndex((l: any) => l.alp_id === alpUpper);
  const alpObj = { alp_id: alpUpper, alp_name: alp_name.trim().toUpperCase(), lobby_code: lobUpper };

  if (existingIdx >= 0) {
    db.alp_master[existingIdx] = alpObj;
  } else {
    db.alp_master.push(alpObj);
  }

  writeDatabase(db);
  res.json({ message: "Assistant Loco Pilot registered.", alp: alpObj });
});

app.post("/api/fsd/crew/alp/bulk", (req, res) => {
  const { items } = req.body; // Array of { id, name, lobby }
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid data list for bulk upload." });
  }
  const db = readDatabase();
  let count = 0;
  items.forEach((item: any) => {
    const id = (item.id || item.alp_id || "").toString().trim().toUpperCase();
    const name = (item.name || item.alp_name || "").toString().trim().toUpperCase();
    const lobby = (item.lobby || item.lobby_code || "").toString().trim().toUpperCase();

    if (id && name && lobby) {
      const alpObj = { alp_id: id, alp_name: name, lobby_code: lobby };
      const idx = db.alp_master.findIndex((l: any) => l.alp_id === id);
      if (idx >= 0) {
        db.alp_master[idx] = alpObj;
      } else {
        db.alp_master.push(alpObj);
      }
      count++;
    }
  });
  writeDatabase(db);
  res.json({ message: `Bulk upload completed. Registered/Updated ${count} Assistant LPs.` });
});

app.delete("/api/fsd/crew/lp/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.lp_master.findIndex((l: any) => l.lp_id === id.toUpperCase());
  if (index === -1) {
    return res.status(404).json({ error: "Loco Pilot profile ID not found." });
  }
  db.lp_master.splice(index, 1);
  writeDatabase(db);
  res.json({ message: "Loco Pilot roster line deleted." });
});

app.delete("/api/fsd/crew/alp/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const index = db.alp_master.findIndex((a: any) => a.alp_id === id.toUpperCase());
  if (index === -1) {
    return res.status(404).json({ error: "Assistant Loco Pilot profile ID not found." });
  }
  db.alp_master.splice(index, 1);
  writeDatabase(db);
  res.json({ message: "Assistant Loco Pilot roster line deleted." });
});

// 5. Operations: Identity Verification check
app.post("/api/fsd/operations/verify", (req, res) => {
  const { lp_id, alp_id, train_no, lobby_code } = req.body;
  if (!train_no || !lobby_code) {
    return res.status(400).json({ error: "Train number and Lobby location are mandatory inputs." });
  }
  if (!lp_id && !alp_id) {
    return res.status(400).json({ error: "Loco Pilot ID or Assistant LP ID is required to process login." });
  }

  const db = readDatabase();
  const lobUpper = lobby_code.trim().toUpperCase();
  
  let lp_resolved_name = "OUT_OF_DIVISION";
  let alp_resolved_name = "OUT_OF_DIVISION";

  if (lp_id) {
    const cleanLp = lp_id.trim().toUpperCase();
    const matchedLp = db.lp_master.find((l: any) => l.lp_id === cleanLp && l.lobby_code === lobUpper);
    if (matchedLp) {
      lp_resolved_name = matchedLp.lp_name;
    }
  }

  if (alp_id) {
    const cleanAlp = alp_id.trim().toUpperCase();
    const matchedAlp = db.alp_master.find((a: any) => a.alp_id === cleanAlp && a.lobby_code === lobUpper);
    if (matchedAlp) {
      alp_resolved_name = matchedAlp.alp_name;
    }
  }

  res.json({
    lp_id: lp_id ? lp_id.trim().toUpperCase() : "N/A",
    lp_name: lp_resolved_name,
    alp_id: alp_id ? alp_id.trim().toUpperCase() : "N/A",
    alp_name: alp_resolved_name,
    train_no: train_no.trim().toUpperCase(),
    lobby_code: lobUpper
  });
});

// 6. Active Live Track lists
app.get("/api/fsd/operations/active/:lobbyCode", (req, res) => {
  const { lobbyCode } = req.params;
  const db = readDatabase();
  const activeLogs = db.operations_ledger.filter(
    (op: any) => op.lobby_code === lobbyCode.toUpperCase() && !op.hoc_time
  );
  res.json(activeLogs);
});

// 7. Take Over (TOC)
app.post("/api/fsd/operations/toc", (req, res) => {
  const { lobby_code, fsd_serial, lp_id, lp_name, alp_id, alp_name, train_no } = req.body;
  if (!lobby_code || !fsd_serial || !train_no) {
    return res.status(400).json({ error: "Missing required TOC parameter inputs." });
  }

  const db = readDatabase();
  const serUpper = fsd_serial.trim().toUpperCase();
  const lobUpper = lobby_code.trim().toUpperCase();

  // Guard Block: Check if this lp_id or alp_id already holds an unreturned FSD
  const hasActiveRecord = db.operations_ledger.some(
    (op: any) =>
      ((op.lp_id === lp_id && lp_id !== "N/A") || (op.alp_id === alp_id && alp_id !== "N/A")) &&
      !op.hoc_time
  );

  if (hasActiveRecord) {
    return res.status(400).json({ error: "ALLOCATION GUARD BLOCK: Crew member must return their current active FSD before checked-out of a new key." });
  }

  // Find FSD in inventory verify availability
  const fsdIndex = db.fsd_inventory.findIndex((f: any) => f.serial_no === serUpper && f.lobby_code === lobUpper);
  if (fsdIndex === -1) {
    return res.status(404).json({ error: `FSD serial is not registered or matching home lobby: ${lobUpper}` });
  }
  const fsdDevice = db.fsd_inventory[fsdIndex];
  if (fsdDevice.status !== "Available") {
    return res.status(400).json({ error: "This device is currently Deployed or Locked for Maintenance work." });
  }

  // Update FSD Device properties
  fsdDevice.status = "Deployed";
  fsdDevice.current_lp = lp_id || "";
  fsdDevice.current_alp = alp_id || "";

  // Insert ledger record
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const nextId = db.operations_ledger.reduce((max: number, op: any) => (op.id > max ? op.id : max), 0) + 1;

  const newLog = {
    id: nextId,
    lobby_code: lobUpper,
    fsd_serial: serUpper,
    fsd_unit: fsdDevice.unit_no,
    lp_id: lp_id || "N/A",
    lp_name: lp_name || "OUT_OF_DIVISION",
    alp_id: alp_id || "N/A",
    alp_name: alp_name || "OUT_OF_DIVISION",
    train_no: train_no.toUpperCase(),
    toc_time: timestamp,
    toc_status: "Active_Track",
    hoc_time: null,
    hoc_remarks: null,
    detonator_no: null,
    hoc_notes: null
  };

  db.operations_ledger.push(newLog);
  writeDatabase(db);

  res.json({ message: "Take Over (TOC) loop completed successfully.", operation: newLog });
});

// 8. Hand Over (HOC)
app.post("/api/fsd/operations/hoc", (req, res) => {
  const { fsd_serial, lp_id, alp_id, remark_str, detonator_no, notes_str } = req.body;
  if (!fsd_serial) {
    return res.status(400).json({ error: "Match failure, tracking FSD Serial is required." });
  }

  const db = readDatabase();
  const serUpper = fsd_serial.trim().toUpperCase();

  // Find active checkout record
  const logIndex = db.operations_ledger.findIndex(
    (op: any) =>
      op.fsd_serial === serUpper &&
      ((op.lp_id === lp_id && lp_id !== "N/A") || (op.alp_id === alp_id && alp_id !== "N/A")) &&
      !op.hoc_time
  );

  if (logIndex === -1) {
    return res.status(404).json({ error: "Error Context: No active on-duty tracking record verified for this crew/device combo." });
  }

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const ledgerRecord = db.operations_ledger[logIndex];

  // Update operation log matching Python SQLite behavior of merging notes inside actual remarks
  const finalNotes = notes_str ? notes_str.trim() : "";
  const finalRemarks = finalNotes ? `${remark_str} (Notes: ${finalNotes})` : remark_str;
  const finalDetonator = detonator_no ? detonator_no.trim().toUpperCase() : "N/A";

  ledgerRecord.hoc_time = timestamp;
  ledgerRecord.hoc_remarks = finalRemarks;
  ledgerRecord.detonator_no = finalDetonator;
  ledgerRecord.toc_status = "Completed";

  // Update FSD inventory status based on remarks
  const fsdIdx = db.fsd_inventory.findIndex((f: any) => f.serial_no === serUpper);
  if (fsdIdx >= 0) {
    const dev = db.fsd_inventory[fsdIdx];
    dev.current_lp = "";
    dev.current_alp = "";
    if (remark_str === "Working Fine") {
      dev.status = "Available";
    } else {
      dev.status = "Locked";
    }
  }

  writeDatabase(db);
  res.json({ message: "Handover (HOC) return transaction logged successfully.", operation: ledgerRecord });
});

// 9. Trip History ledger queries
app.get("/api/fsd/operations/ledger", (req, res) => {
  const { lobby_code, fsd_serial, search_date } = req.query;
  const db = readDatabase();
  let reports = db.operations_ledger || [];

  if (lobby_code) {
    reports = reports.filter((r: any) => r.lobby_code === (lobby_code as string).toUpperCase());
  }

  if (fsd_serial) {
    const fsdToken = (fsd_serial as string).toUpperCase();
    reports = reports.filter((r: any) => r.fsd_serial.includes(fsdToken));
  }

  if (search_date) {
    const dVal = search_date as string;
    reports = reports.filter(
      (r: any) => r.toc_time?.includes(dVal) || r.hoc_time?.includes(dVal)
    );
  }

  reports.sort((a: any, b: any) => b.id - a.id); // Descending ID order
  res.json(reports);
});

// 10. Fault Rectification releases (Supervisor actions)
app.post("/api/fsd/operations/maint", (req, res) => {
  const { fsd_serial, lobby_code, cc_id, repair_notes } = req.body;
  if (!fsd_serial || !lobby_code || !repair_notes) {
    return res.status(400).json({ error: "Missing repair technical logs information." });
  }

  const db = readDatabase();
  const serUpper = fsd_serial.trim().toUpperCase();
  const lobUpper = lobby_code.trim().toUpperCase();

  const fsdIdx = db.fsd_inventory.findIndex((f: any) => f.serial_no === serUpper && f.lobby_code === lobUpper);
  if (fsdIdx === -1) {
    return res.status(444).json({ error: "FSD not matched on this lobby station registry." });
  }

  const dev = db.fsd_inventory[fsdIdx];
  if (dev.status !== "Locked") {
    return res.status(400).json({ error: "The FSD status is not locked format, no technical rectification required." });
  }

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  
  // Unlock device properties
  dev.status = "Available";
  dev.rectification_date = timestamp;
  dev.repair_notes = repair_notes.trim();

  // Find last operational logging that needs notes updating
  const opIdx = db.operations_ledger.findIndex((op: any) => op.fsd_serial === serUpper && !op.hoc_notes);
  if (opIdx >= 0) {
    db.operations_ledger[opIdx].hoc_notes = `RECTIFIED on ${timestamp} by ${cc_id || "CC"}: ${repair_notes.trim()}`;
  }

  writeDatabase(db);
  res.json({ message: "Technical release completed. Device calibrated back to Available stack.", device: dev });
});


// -------------------------------------------------------------------------
// GEMINI AI INTEGRATION: PYTHON RECONCILER & DEV UTILITY SERVER ROUTE
// -------------------------------------------------------------------------
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "The assistant prompt is missing from the query payload." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is not defined inside the Secrets panel. Please check your credentials config." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Elegant engineering prompt instructing the model to generate actual workable python code snippets, triggers, testing sequences 
    // and documentation matching this FSD database schema. No larping, clean professional output.
    const systemInstruction = 
      "You are an expert Indian Railways software engineer and master Python developer specializing in " +
      "crew dispatch systems and safety hardware asset registries (specifically Fog Signal Devices - FSD). " +
      "The client is developing a full-stack system matching this SQLite DB registry schematic:\n" +
      "1. lobbies (lobby_code TEXT PRIMARY KEY, lobby_name TEXT)\n" +
      "2. controllers (cc_id TEXT PRIMARY KEY, lobby_code TEXT, name TEXT, mobile TEXT)\n" +
      "3. fsd_inventory (serial_no PRIMARY KEY, unit_no, lobby_code, status 'Available'|'Deployed'|'Locked', current_lp, current_alp, rectification_date, repair_notes)\n" +
      "4. lp_master (lp_id PRIMARY KEY, lp_name, lobby_code) AND alp_master (alp_id PRIMARY KEY, alp_name, lobby_code)\n" +
      "5. operations_ledger (id INTEGER PRIMARY KEY, lobby_code, fsd_serial, fsd_unit, lp_id, lp_name, alp_id, alp_name, train_no, toc_time, toc_status, hoc_time, hoc_remarks, detonator_no, hoc_notes)\n\n" +
      "Provide clean, production-ready, beautifully formatted Python (using robust sqlite3 or pandas library commands) and " +
      "detailed, highly explanatory API documentation endpoints. Write clean comments. No marketing slogans or unnecessary text.";

    const formattedContext = context ? `[Request context type: ${context}]\n\n` : "";
    const fullQuery = `${formattedContext}${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullQuery,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2
      }
    });

    const generatedText = response.text || "No output generated by the AI model. Please modify your query parameters.";
    res.json({ output: generatedText });

  } catch (err: any) {
    console.error("Gemini API error call context failed:", err);
    res.status(500).json({ error: err.message || "An error occurred calling the Gemini AI models on the server-side proxy." });
  }
});


// -------------------------------------------------------------------------
// COMPATIBILITY/VITE DEV ENVIRONMENT INTERCEPT
// -------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started at http://localhost:${PORT}`);
  });
}

startServer();
