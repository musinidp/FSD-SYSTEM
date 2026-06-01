import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Train,
  Shield,
  HardDrive,
  Search,
  Users,
  Terminal,
  Settings,
  Cpu,
  Plus,
  CheckCircle,
  AlertTriangle,
  LogOut,
  ArrowRight,
  Lock,
  Unlock,
  Download,
  RefreshCw,
  PlusCircle,
  Trash2,
  Database,
  Calendar,
  Clock,
  Check,
  FileSpreadsheet,
  Layers
} from "lucide-react";
import { Lobby, CrewController, FSDDevice, LocoPilot, AssistantLocoPilot, OpsRecord } from "./types";

export default function App() {
  // Global States
  const [utcTime, setUtcTime] = useState<string>("");

  // DB Sync state
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [controllers, setControllers] = useState<CrewController[]>([]);
  const [inventory, setInventory] = useState<FSDDevice[]>([]);
  const [lpMaster, setLpMaster] = useState<LocoPilot[]>([]);
  const [alpMaster, setAlpMaster] = useState<AssistantLocoPilot[]>([]);
  const [ledger, setLedger] = useState<OpsRecord[]>([]);

  // Navigation / Auth States
  const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
  const [cabinetMode, setCabinetMode] = useState<"lobby" | "crew" | "cc" | "admin">("lobby");
  
  // Admin Screen states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>("admin");
  const [adminTab, setAdminTab] = useState<"lobby" | "cc" | "fsd" | "crew">("lobby");
  const [enteredAdminPassword, setEnteredAdminPassword] = useState<string>("");

  // CC Screen states
  const [isCCLoggedIn, setIsCCLoggedIn] = useState<boolean>(false);
  const [activeCC, setActiveCC] = useState<CrewController | null>(null);
  const [ccTab, setCCTab] = useState<"live" | "maint" | "history">("live");
  const [enteredCCId, setEnteredCCId] = useState<string>("");

  // Crew Flow States
  const [enteredLpId, setEnteredLpId] = useState<string>("");
  const [enteredAlpId, setEnteredAlpId] = useState<string>("");
  const [enteredTrainNo, setEnteredTrainNo] = useState<string>("");
  const [activeCrewSession, setActiveCrewSession] = useState<{
    lp_id: string;
    lp_name: string;
    alp_id: string;
    alp_name: string;
    train_no: string;
  } | null>(null);

  // Operating parameters (sign-on, sign-off)
  const [selectedFSDoTOC, setSelectedFSDoTOC] = useState<string>("");
  const [maintDetonator, setMaintDetonator] = useState<string>("");
  const [hocRemark, setHocRemark] = useState<string>("Working Fine");
  const [hocNotes, setHocNotes] = useState<string>("");

  // CC Maint Inputs
  const [maintSelectedSerial, setMaintSelectedSerial] = useState<string>("");
  const [maintRepairNotes, setMaintRepairNotes] = useState<string>("");

  // CC Filter Inputs
  const [filterFsdSerial, setFilterFsdSerial] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");

  // Admin Forms
  const [newLobbyCode, setNewLobbyCode] = useState<string>("");
  const [newLobbyName, setNewLobbyName] = useState<string>("");
  const [ccFormLobby, setCCFormLobby] = useState<string>("");
  const [ccFormName, setCCFormName] = useState<string>("");
  const [ccFormMobile, setCCFormMobile] = useState<string>("");
  const [fsdFormSerial, setFsdFormSerial] = useState<string>("");
  const [fsdFormUnit, setFsdFormUnit] = useState<string>("");
  const [fsdFormLobby, setFsdFormLobby] = useState<string>("");

  // Bulk Master States
  const [bulkType, setBulkType] = useState<"lp" | "alp">("lp");
  const [bulkInputText, setBulkInputText] = useState<string>("");
  const [bulkLobbyCode, setBulkLobbyCode] = useState<string>("");

  // Single Crew insertion
  const [crewFormType, setCrewFormType] = useState<"lp" | "alp">("lp");
  const [crewFormId, setCrewFormId] = useState<string>("");
  const [crewFormName, setCrewFormName] = useState<string>("");
  const [crewFormLobby, setCrewFormLobby] = useState<string>("");

  const [globalError, setGlobalError] = useState<string>("");
  const [globalSuccess, setGlobalSuccess] = useState<string>("");

  // Dynamic UTC real-time signaling clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const stringTime = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) + " " + now.toLocaleTimeString("en-GB", { hour12: false }) + " UTC";
      setUtcTime(stringTime.toUpperCase());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all databases initial records
  const syncAllData = async () => {
    try {
      const [rLobbies, rCC, rFSD, rLp, rAlp, rLedger] = await Promise.all([
        fetch("/api/fsd/lobbies").then((res) => res.json()),
        fetch("/api/fsd/controllers").then((res) => res.json()),
        fetch("/api/fsd/inventory").then((res) => res.json()),
        fetch("/api/fsd/crew/lp").then((res) => res.json()),
        fetch("/api/fsd/crew/alp").then((res) => res.json()),
        fetch("/api/fsd/operations/ledger").then((res) => res.json())
      ]);

      setLobbies(rLobbies || []);
      setControllers(rCC || []);
      setInventory(rFSD || []);
      setLpMaster(rLp || []);
      setAlpMaster(rAlp || []);
      setLedger(rLedger || []);
    } catch (err) {
      console.error("Database synchronisation query failed:", err);
      setGlobalError("Database synchronisation failure. Ensure dev backend is running.");
    }
  };

  useEffect(() => {
    syncAllData();
  }, []);

  const triggerToast = (type: "success" | "error", msg: string) => {
    if (type === "success") {
      setGlobalSuccess(msg);
      setTimeout(() => setGlobalSuccess(""), 4000);
    } else {
      setGlobalError(msg);
      setTimeout(() => setGlobalError(""), 4000);
    }
  };

  // Operational Functions
  const handleSaveLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLobbyCode.trim() || !newLobbyName.trim()) {
      triggerToast("error", "Lobby Code and Name are mandatory.");
      return;
    }
    try {
      const response = await fetch("/api/fsd/lobbies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobby_code: newLobbyCode, lobby_name: newLobbyName })
      });
      const data = await response.json();
      if (response.ok) {
        triggerToast("success", `Lobby [${data.lobby.lobby_code}] successfully deployed to SCR nodes.`);
        setNewLobbyCode("");
        setNewLobbyName("");
        syncAllData();
      } else {
        triggerToast("error", data.error || "Failed to save lobby.");
      }
    } catch (err) {
      triggerToast("error", "Server communication failed.");
    }
  };

  const handleCreateCC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccFormLobby || !ccFormName.trim() || !ccFormMobile.trim()) {
      triggerToast("error", "Verify parameters. Complete lobby, name, and phone.");
      return;
    }
    try {
      const response = await fetch("/api/fsd/controllers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobby_code: ccFormLobby,
          name: ccFormName,
          mobile: ccFormMobile
        })
      });
      const data = await response.json();
      if (response.ok) {
        triggerToast("success", `CC ID [${data.controller.cc_id}] generated and registered.`);
        setCCFormName("");
        setCCFormMobile("");
        setCCFormLobby("");
        syncAllData();
      } else {
        triggerToast("error", data.error || "Failed registration.");
      }
    } catch (err) {
      triggerToast("error", "Server communication failed.");
    }
  };

  const handleRevokeCC = async (ccId: string) => {
    if (!window.confirm(`Revoke identity sequence CC keys for ID [${ccId}]?`)) return;
    try {
      const res = await fetch(`/api/fsd/controllers/${ccId}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("success", `CC ${ccId} credentials successfully revoked.`);
        syncAllData();
      } else {
        triggerToast("error", "Failed credential revocation.");
      }
    } catch (err) {
      triggerToast("error", "Server error.");
    }
  };

  const handleLinkFsd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fsdFormSerial.trim() || !fsdFormUnit.trim() || !fsdFormLobby) {
      triggerToast("error", "Serial, Unit No, and Lobby Target are all required parameters.");
      return;
    }
    try {
      const res = await fetch("/api/fsd/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial_no: fsdFormSerial,
          unit_no: fsdFormUnit,
          lobby_code: fsdFormLobby
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", `FSD Asset ${data.device.serial_no} successfully deployed & tracked.`);
        setFsdFormSerial("");
        setFsdFormUnit("");
        setFsdFormLobby("");
        syncAllData();
      } else {
        triggerToast("error", data.error);
      }
    } catch (err) {
      triggerToast("error", "Server error.");
    }
  };

  const handleSaveCrewSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewFormId.trim() || !crewFormName.trim() || !crewFormLobby) {
      triggerToast("error", "Missing employee metadata parameters.");
      return;
    }
    const endpoint = crewFormType === "lp" ? "/api/fsd/crew/lp" : "/api/fsd/crew/alp";
    const payload = crewFormType === "lp" ? {
      lp_id: crewFormId,
      lp_name: crewFormName,
      lobby_code: crewFormLobby
    } : {
      alp_id: crewFormId,
      alp_name: crewFormName,
      lobby_code: crewFormLobby
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast("success", `${crewFormType === "lp" ? "Loco Pilot" : "Assistant LP"} successfully added to roster.`);
        setCrewFormId("");
        setCrewFormName("");
        setCrewFormLobby("");
        syncAllData();
      } else {
        triggerToast("error", "Roster registration error.");
      }
    } catch (err) {
      triggerToast("error", "Server communication issue.");
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInputText.trim() || !bulkLobbyCode) {
      triggerToast("error", "Requires CSV text and associated Lobby binding.");
      return;
    }

    // Parse CSV: lp_id, name / alp_id, name
    const lines = bulkInputText.trim().split("\n");
    const parsedItems = lines.map((line) => {
      const parts = line.split(",");
      return {
        id: parts[0]?.trim(),
        name: parts[1]?.trim() || "MOCK_CREW_NAME",
        lobby: bulkLobbyCode
      };
    }).filter(i => i.id);

    const endpoint = bulkType === "lp" ? "/api/fsd/crew/lp/bulk" : "/api/fsd/crew/alp/bulk";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedItems })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", data.message);
        setBulkInputText("");
        syncAllData();
      } else {
        triggerToast("error", data.error);
      }
    } catch (err) {
      triggerToast("error", "Bulk upload connection server failed.");
    }
  };

  // Operating Portal logins
  const handleVerifyCrewSignOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredLpId.trim() && !enteredAlpId.trim()) {
      triggerToast("error", "LP ID or ALP ID is required for operational login.");
      return;
    }
    if (!enteredTrainNo.trim()) {
      triggerToast("error", "Train number is required for booking logs.");
      return;
    }
    if (enteredLpId.trim().toUpperCase() === enteredAlpId.trim().toUpperCase() && enteredLpId) {
      triggerToast("error", "LP ID and ALP ID cannot be identical.");
      return;
    }

    try {
      const res = await fetch("/api/fsd/operations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lp_id: enteredLpId,
          alp_id: enteredAlpId,
          train_no: enteredTrainNo,
          lobby_code: selectedLobby?.lobby_code
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveCrewSession(data);
        triggerToast("success", "Roster tokens verified. Session created.");
      } else {
        triggerToast("error", data.error);
      }
    } catch (err) {
      triggerToast("error", "Authentication error.");
    }
  };

  const executeTOC = async () => {
    if (!selectedFSDoTOC) {
      triggerToast("error", "Please select an available FSD serialization key.");
      return;
    }
    try {
      const res = await fetch("/api/fsd/operations/toc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobby_code: selectedLobby?.lobby_code,
          fsd_serial: selectedFSDoTOC,
          lp_id: activeCrewSession?.lp_id,
          lp_name: activeCrewSession?.lp_name,
          alp_id: activeCrewSession?.alp_id,
          alp_name: activeCrewSession?.alp_name,
          train_no: activeCrewSession?.train_no
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", `TOC Process complete! FSD key ${selectedFSDoTOC} checked out.`);
        setSelectedFSDoTOC("");
        syncAllData();
      } else {
        triggerToast("error", data.error);
      }
    } catch (err) {
      triggerToast("error", "TOC process communication network error.");
    }
  };

  const executeHOC = async () => {
    try {
      // Find what active device session is locked
      const fsdRecord = ledger.find(
        (op) =>
          op.lobby_code === selectedLobby?.lobby_code &&
          ((op.lp_id === activeCrewSession?.lp_id && activeCrewSession?.lp_id !== "N/A") ||
            (op.alp_id === activeCrewSession?.alp_id && activeCrewSession?.alp_id !== "N/A")) &&
          !op.hoc_time
      );

      if (!fsdRecord) {
        triggerToast("error", "No active checked-out FSD verified on this crew profile card.");
        return;
      }

      const res = await fetch("/api/fsd/operations/hoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fsd_serial: fsdRecord.fsd_serial,
          lp_id: activeCrewSession?.lp_id,
          alp_id: activeCrewSession?.alp_id,
          remark_str: hocRemark,
          detonator_no: maintDetonator,
          notes_str: hocNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "HOC transaction completed. Log saved into history.");
        setMaintDetonator("");
        setHocNotes("");
        setHocRemark("Working Fine");
        syncAllData();
      } else {
        triggerToast("error", data.error);
      }
    } catch (err) {
      triggerToast("error", "Handover network interface failed.");
    }
  };

  // CC maintenance Calibration releases
  const handleMaintRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintSelectedSerial || !maintRepairNotes.trim()) {
      triggerToast("error", "Completing selection and detail technician notes is mandatory.");
      return;
    }
    try {
      const res = await fetch("/api/fsd/operations/maint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fsd_serial: maintSelectedSerial,
          lobby_code: activeCC?.lobby_code,
          cc_id: activeCC?.cc_id,
          repair_notes: maintRepairNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", `FSD ${maintSelectedSerial} rectified and released back to available registry stack.`);
        setMaintSelectedSerial("");
        setMaintRepairNotes("");
        syncAllData();
      } else {
        triggerToast("error", data.error);
      }
    } catch (err) {
      triggerToast("error", "Technician API gateway connection failure.");
    }
  };

  // CC Auth login process
  const handleCCLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const needle = enteredCCId.trim().toUpperCase();
    const matched = controllers.find((c) => c.cc_id === needle);
    if (matched) {
      setActiveCC(matched);
      setIsCCLoggedIn(true);
      triggerToast("success", `Authorized Operator Session: ${matched.name}`);
    } else {
      triggerToast("error", "CREW CONTROLLER ID IS NOT RECOGNISED.");
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredAdminPassword === adminPassword) {
      setIsAdminLoggedIn(true);
      triggerToast("success", "Master terminal authority unlocked.");
    } else {
      triggerToast("error", "Invalid credential sequence key.");
    }
  };

  // Filter computations
  const filteredLedger = ledger.filter((item) => {
    const fsdMatch = filterFsdSerial ? item.fsd_serial.toUpperCase().includes(filterFsdSerial.toUpperCase()) : true;
    const dateMatch = filterDate ? (item.toc_time?.includes(filterDate) || item.hoc_time?.includes(filterDate)) : true;
    const lobbyMatch = activeCC ? item.lobby_code === activeCC.lobby_code : true;
    return fsdMatch && dateMatch && lobbyMatch;
  });

  // Simulated Excel summary download helper
  const handleSimulatedDownload = () => {
    if (filteredLedger.length === 0) {
      triggerToast("error", "Zero ledger records match your active screen filters to download.");
      return;
    }
    const headers = "Tx ID,Lobby,FSD Serial,FSD Unit,LP ID,LP Name,ALP ID,ALP Name,Train No,Takeover Time,Handover Time,Detonator,Remarks,Resolution Logs\n";
    const csvContent = "data:text/csv;charset=utf-8," + headers + filteredLedger.map((r) => 
      `"${r.id}","${r.lobby_code}","${r.fsd_serial}","${r.fsd_unit}","${r.lp_id}","${r.lp_name}","${r.alp_id}","${r.alp_name}","${r.train_no}","${r.toc_time}","${r.hoc_time || "Duty-On"}","${r.detonator_no || "N/A"}","${r.hoc_remarks || "N/A"}","${r.hoc_notes || "N/A"}"`
    ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FSD_Ledger_SCR_Report_${activeCC?.lobby_code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("success", "Dynamic report sheet exported successfully to downloads folder.");
  };

  // Reset lobby/state back home
  const resetLobbyContext = () => {
    setSelectedLobby(null);
    setCabinetMode("lobby");
    setActiveCrewSession(null);
    setEnteredAlpId("");
    setEnteredLpId("");
    setEnteredTrainNo("");
  };

  return (
    <div className="min-h-screen bg-rail-dark text-slate-100 font-sans flex flex-col selection:bg-rail-accent/30 selection:text-white" id="main-terminal-root">
      
      {/* Global Header */}
      <header className="bg-rail-panel/75 backdrop-blur-md border-b border-rail-border shrink-0 py-4 px-6 md:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Logo & Railway metadata with Sophisticated Dark signatures */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <div className="flex items-center space-x-2 mr-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/90 led-pulse-red" title="Railway Red Signal - Defect Lockout Pending"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 led-pulse-yellow" title="Railway Caution Warning - Operating Runs Active"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 led-pulse-green" title="Railway Proceed Green - Healthy Inventory Pool Ready"></div>
              <span className="ml-2 font-serif italic text-neutral-100 text-lg tracking-tight leading-none">FOG SAFETY DEVICE</span>
            </div>
            
            <div className="h-6 w-[1px] bg-neutral-800 hidden md:block mx-2"></div>

            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl relative group">
              <Train className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition duration-300" />
              <div className="absolute -inset-1 bg-emerald-500/10 rounded-xl filter blur-sm opacity-50 group-hover:opacity-85 transition duration-300 pointer-events-none"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 bg-neutral-950 px-2.5 py-0.5 rounded border border-neutral-800">
                  SOUTH CENTRAL RAILWAY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h1 className="font-serif italic text-base md:text-lg text-white tracking-tight leading-tight mt-0.5">
                FOG SAFETY DEVICE
              </h1>
            </div>
          </div>

          {/* Clock & Action Tabs */}
          <div className="flex items-center flex-wrap gap-3.5 ml-auto lg:ml-0">
            {/* UTC Realtime Clock Display with high-contrast Sophisticated Dark background */}
            <div className="bg-neutral-950 px-3.5 py-2 rounded-lg border border-rail-border font-mono text-[11px] text-emerald-400 flex items-center gap-2 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-emerald-600/80" />
              <span className="tracking-widest">{utcTime || "LOADING SYSTEM TIME..."}</span>
            </div>


          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col justify-start">
        
        {/* Global Banner Messages */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs font-mono flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rail-signal-red" />
                <span>{globalError}</span>
              </div>
              <button onClick={() => setGlobalError("")} className="hover:text-white text-slate-500 font-bold px-1.5">×</button>
            </motion.div>
          )}

          {globalSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs font-mono flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-rail-signal-green" />
                <span>{globalSuccess}</span>
              </div>
              <button onClick={() => setGlobalSuccess("")} className="hover:text-white text-slate-500 font-bold px-1.5">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Route Switching View */}
        <div className="w-full">
            
            {/* CABINET VIEW 1: LOBBY SELECT */}
            {cabinetMode === "lobby" && (
              <div className="max-w-md mx-auto my-12 bg-rail-panel rounded-2xl border border-rail-border border-glow-emerald p-6 md:p-8 shadow-2xl relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="text-center mb-8">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-neutral-950 border border-rail-border px-3.5 py-1.5 rounded-full inline-block">
                    OPERATOR SECTOR GATEWAY
                  </span>
                  <h2 className="font-serif italic font-semibold text-2xl text-white mt-4 tracking-tight">
                    MANDATORY LOBBY SECTOR
                  </h2>
                  <p className="text-xs text-neutral-400 mt-2">Initialize your railway operational desktop terminal</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-widest mb-2.5 font-mono">
                      Associated SCR Lobby Hub
                    </label>
                    <select
                      onChange={(e) => {
                        const code = e.target.value;
                        const match = lobbies.find((l) => l.lobby_code === code);
                        if (match) setSelectedLobby(match);
                      }}
                      className="w-full bg-neutral-950 border border-rail-border rounded-xl px-4 py-3 text-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/50"
                    >
                      <option value="">-- Choose Lobby Node --</option>
                      {lobbies.map((l) => (
                        <option key={l.lobby_code} value={l.lobby_code}>
                          {l.lobby_code} - {l.lobby_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedLobby}
                    onClick={() => setCabinetMode("crew")}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 disabled:bg-neutral-900/40 disabled:text-neutral-600 disabled:border-neutral-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all duration-300 shadow-md"
                  >
                    <span>1. Crew Sign-On Command</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCabinetMode("cc")}
                      className="px-4 py-3 bg-neutral-950 hover:bg-neutral-900 border border-rail-border text-slate-200 text-xs font-bold tracking-wider rounded-xl uppercase transition duration-200 flex flex-col items-center gap-1.5"
                    >
                      <Cpu className="w-4 h-4 text-amber-500" />
                      <span>2. Crew Controller</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCabinetMode("admin")}
                      className="px-4 py-3 bg-neutral-950 hover:bg-neutral-900 border border-rail-border text-slate-200 text-xs font-bold tracking-wider rounded-xl uppercase transition duration-200 flex flex-col items-center gap-1.5"
                    >
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>🔒 Admin Portal</span>
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* CABINET VIEW 2: CREW SIGN-ON DISPATCH PORTAL */}
            {cabinetMode === "crew" && (
              <div className="max-w-2xl mx-auto my-4 bg-rail-panel rounded-2xl border border-rail-border overflow-hidden shadow-2xl">
                
                {/* Header info bar */}
                <div className="px-6 py-4 bg-neutral-950/40 border-b border-rail-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="font-mono text-xs text-slate-300 font-semibold uppercase tracking-wider">
                      Lobby Sector: {selectedLobby?.lobby_name} ({selectedLobby?.lobby_code})
                    </span>
                  </div>
                  <button onClick={resetLobbyContext} className="text-xs text-[#ef4444] hover:text-red-400 font-mono font-semibold flex items-center gap-1">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>LOBBY HOME</span>
                  </button>
                </div>

                {!activeCrewSession ? (
                  <div className="p-6 md:p-8">
                    <div className="text-center mb-6">
                      <h3 className="font-serif italic font-semibold text-2xl text-white tracking-tight">
                        👨‍✈️ CREW SIGN-ON DISPATCH BOOKING
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">Verify team identity tokens before starting the trip</p>
                    </div>

                    <form onSubmit={handleVerifyCrewSignOn} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1.5 font-mono">
                            Employee ID (Loco Pilot)
                          </label>
                          <input
                            type="text"
                            value={enteredLpId}
                            onChange={(e) => setEnteredLpId(e.target.value)}
                            placeholder="e.g. LP001"
                            className="w-full bg-neutral-950 border border-rail-border rounded-lg px-4 py-3 placeholder:text-neutral-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1.5 font-mono">
                            Employee ID (Assistant LP)
                          </label>
                          <input
                            type="text"
                            value={enteredAlpId}
                            onChange={(e) => setEnteredAlpId(e.target.value)}
                            placeholder="e.g. ALP001"
                            className="w-full bg-neutral-950 border border-rail-border rounded-lg px-4 py-3 placeholder:text-neutral-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1.5 font-mono">
                          Train Number (T.No.)
                        </label>
                        <input
                          type="text"
                          value={enteredTrainNo}
                          onChange={(e) => setEnteredTrainNo(e.target.value)}
                          placeholder="e.g. 12704"
                          className="w-full bg-neutral-950 border border-rail-border rounded-lg px-4 py-3 placeholder:text-neutral-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-semibold rounded-lg text-sm transition shadow-md"
                      >
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span>Verify Profile Identity Tokens</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Verified operational desk TOC/HOC */
                  <div className="p-6 md:p-8">
                    <div className="bg-neutral-900 border border-rail-border rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between mb-3 border-b border-rail-border pb-2.5">
                        <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold">⚡ CREW SECTORS ACTIVE</span>
                        <span className="text-[11px] font-mono font-bold text-[#f59e0b] bg-[#f59e0b]/5 px-2 py-0.5 rounded border border-[#f59e0b]/25">
                          T.No: {activeCrewSession.train_no}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-405">Loco Pilot Driver</p>
                          <p className="text-white font-semibold text-sm mt-0.5">{activeCrewSession.lp_name}</p>
                          <p className="text-[10.5px] font-mono text-neutral-400">ID: {activeCrewSession.lp_id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-405">Assistant LP</p>
                          <p className="text-white font-semibold text-sm mt-0.5">{activeCrewSession.alp_name}</p>
                          <p className="text-[10.5px] font-mono text-neutral-400">ID: {activeCrewSession.alp_id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      
                      {/* Left Block: TOC */}
                      <div className="bg-neutral-950/20 border border-rail-border p-5 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <PlusCircle className="w-5 h-5 text-emerald-500" />
                          <h4 className="font-serif italic font-semibold text-sm text-white">TOC (Take Over FSD)</h4>
                        </div>
                        <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
                          Checkout a healthy device asset assigned to {selectedLobby?.lobby_code} Lobby.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                              Select Available FSD Serial
                            </label>
                            <select
                              value={selectedFSDoTOC}
                              onChange={(e) => setSelectedFSDoTOC(e.target.value)}
                              className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none"
                            >
                              <option value="">-- Choose Device Serial --</option>
                              {inventory
                                .filter((f) => f.lobby_code === selectedLobby?.lobby_code && f.status === "Available")
                                .map((f) => (
                                  <option key={f.serial_no} value={f.serial_no}>
                                    {f.serial_no} ({f.unit_no})
                                  </option>
                                ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={executeTOC}
                            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold tracking-wider text-xs rounded-lg uppercase transition"
                          >
                            Confirm Take Over
                          </button>
                        </div>
                      </div>

                      {/* Right Block: HOC */}
                      <div className="bg-neutral-950/20 border border-rail-border p-5 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <h4 className="font-serif italic font-semibold text-sm text-white">HOC (Hand Over FSD)</h4>
                        </div>
                        <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
                          Log device return details. Faulty devices will be locked automatically.
                        </p>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 font-mono">
                              Detonator Box No
                            </label>
                            <input
                              type="text"
                              value={maintDetonator}
                              onChange={(e) => setMaintDetonator(e.target.value)}
                              placeholder="e.g. DET-405"
                              className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-1.5 text-slate-200 text-xs placeholder:text-neutral-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 font-mono">
                              Device Performance Remarks
                            </label>
                            <select
                              value={hocRemark}
                              onChange={(e) => setHocRemark(e.target.value)}
                              className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                            >
                              <option value="Working Fine">Working Fine</option>
                              <option value="GPS not working">GPS not working</option>
                              <option value="Battery Drainage">Battery Drainage</option>
                              <option value="Charging Issue">Charging Issue</option>
                              <option value="Physical Damage">Physical Damage</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 font-mono">
                              Optional Notes
                            </label>
                            <input
                              type="text"
                              value={hocNotes}
                              onChange={(e) => setHocNotes(e.target.value)}
                              placeholder="Technical details..."
                              className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-1.5 text-slate-200 text-xs placeholder:text-neutral-700"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={executeHOC}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider text-xs rounded-lg uppercase transition mt-1"
                          >
                            Execute Handover
                          </button>
                        </div>
                      </div>

                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setActiveCrewSession(null)}
                        className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-xs font-mono text-slate-400 hover:text-white rounded-lg transition"
                      >
                        CLOSE ACTIVE PROFILE SESSION
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}


            {/* CABINET VIEW 3: CREW CONTROLLER OPERATING HUD */}
            {cabinetMode === "cc" && (
              <div className="w-full my-4">
                
                {!isCCLoggedIn ? (
                  <div className="max-w-md mx-auto my-12 bg-rail-panel rounded-2xl border border-rail-border border-glow-amber p-6 shadow-2xl">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                        <Cpu className="w-6 h-6 text-amber-500" />
                      </div>
                      <h3 className="font-serif italic font-semibold text-xl text-white">🎛️ Crew Controller Hub</h3>
                      <p className="text-xs text-neutral-450 mt-1">Verification Gateway for authorised personnel</p>
                    </div>

                    <form onSubmit={handleCCLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1.5 font-mono">
                          Enter Controller CC ID Key
                        </label>
                        <input
                          type="text"
                          value={enteredCCId}
                          onChange={(e) => setEnteredCCId(e.target.value)}
                          placeholder="e.g. GNTCC4311"
                          className="w-full bg-neutral-950 border border-rail-border rounded-lg px-4 py-3 placeholder:text-neutral-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 text-white font-semibold rounded-lg text-sm transition shadow-md"
                      >
                        Verify Operations Token
                      </button>

                      <button
                        onClick={resetLobbyContext}
                        className="w-full py-2.5 bg-transparent text-[#a3a3a3] hover:text-white text-xs font-mono"
                      >
                        ↩ Back to Main Terminal Layout
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Logged-in CC console panel */
                  <div className="bg-rail-panel rounded-2xl border border-rail-border overflow-hidden shadow-2xl">
                    
                    {/* CC top bar */}
                    <div className="px-6 py-4.5 bg-neutral-950/40 border-b border-rail-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                          CREW CONTROLLER HUB CONSOLE ACTIVE
                        </p>
                        <h3 className="text-white font-serif italic text-base mt-1">
                          Operator: {activeCC?.name} • Depot Lobby: {activeCC?.lobby_code}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsCCLoggedIn(false);
                            setActiveCC(null);
                          }}
                          className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 text-red-400 text-[11px] font-mono rounded-lg transition"
                        >
                          CLOSE CONSOLE
                        </button>
                        <button
                          onClick={resetLobbyContext}
                          className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-slate-300 text-[11px] font-mono rounded-lg transition"
                        >
                          TERMINAL HOME
                        </button>
                      </div>
                    </div>

                    {/* CC Tabs */}
                    <div className="flex border-b border-rail-border bg-neutral-950/20 px-6">
                      {[
                        { id: "live", label: "Active Live Monitor" },
                        { id: "maint", label: "🛠️ Technical Calibration" },
                        { id: "history", label: "📝 Trip History Ledger" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setCCTab(t.id as any)}
                          className={`py-3.5 px-4 font-mono text-xs font-bold tracking-wider uppercase border-b-2 transition duration-200 ${
                            ccTab === t.id
                              ? "border-amber-500 text-white bg-neutral-950/40"
                              : "border-transparent text-neutral-400 hover:text-neutral-200"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-6 md:p-8">
                      
                      {/* Tab 1: Live Active monitor list */}
                      {ccTab === "live" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif italic font-semibold text-base text-white">Live On-Duty FSD Devices</h4>
                            <button
                              onClick={syncAllData}
                              className="p-1 px-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 text-[10px] font-mono hover:text-white rounded flex items-center gap-1.5 transition"
                            >
                              <RefreshCw className="w-3 h-3 text-neutral-400" />
                              RE-QUERY STATE
                            </button>
                          </div>

                          <div className="overflow-x-auto border border-rail-border rounded-xl">
                            <table className="w-full text-left font-sans text-xs">
                              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono tracking-wider border-b border-rail-border text-[10px]">
                                <tr>
                                  <th className="p-3.5 pl-5">Tx ID</th>
                                  <th className="p-3.5">FSD Serial</th>
                                  <th className="p-3.5">FSD Unit</th>
                                  <th className="p-3.5">Train No</th>
                                  <th className="p-3.5">Crew LP (Driver)</th>
                                  <th className="p-3.5">Crew ALP (Asst)</th>
                                  <th className="p-3.5">Checkout Timestamp</th>
                                  <th className="p-3.5 text-right pr-5">TOC Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rail-border/60 bg-slate-950/10">
                                {ledger.filter(op => op.lobby_code === activeCC?.lobby_code && !op.hoc_time).length === 0 ? (
                                  <tr>
                                    <td colSpan={8} className="p-10 text-center font-mono text-slate-500">
                                      Zero live checked out FSD controllers matching active telemetry.
                                    </td>
                                  </tr>
                                ) : (
                                  ledger
                                    .filter(op => op.lobby_code === activeCC?.lobby_code && !op.hoc_time)
                                    .map((op) => (
                                      <tr key={op.id} className="hover:bg-slate-900/50 transition">
                                        <td className="p-3.5 pl-5 font-mono text-slate-400">TX-{op.id}</td>
                                        <td className="p-3.5 font-bold font-mono text-white">{op.fsd_serial}</td>
                                        <td className="p-3.5 font-mono text-slate-300">{op.fsd_unit}</td>
                                        <td className="p-3.5 font-bold font-mono text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/30 inline-block mt-2">
                                          {op.train_no}
                                        </td>
                                        <td className="p-3.5 font-semibold text-slate-200">
                                          {op.lp_name} <span className="font-mono text-[10.5px] text-slate-500">({op.lp_id})</span>
                                        </td>
                                        <td className="p-3.5 font-semibold text-slate-200">
                                          {op.alp_name} <span className="font-mono text-[10.5px] text-slate-500">({op.alp_id})</span>
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-400">{op.toc_time}</td>
                                        <td className="p-3.5 text-right pr-5">
                                          <span className="inline-block px-2 py-0.5 rounded bg-blue-950 border border-blue-900 text-blue-300 tracking-wider font-mono uppercase text-[10px] font-bold">
                                            ACTIVE TRIP
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                                              {/* Tab 2: Defect Rectification releases */}
                      {ccTab === "maint" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Technician Calibration Log form (6 cols) */}
                          <div className="lg:col-span-4 bg-neutral-950/20 border border-rail-border p-5 rounded-xl flex flex-col justify-start">
                            <h4 className="font-serif italic font-semibold text-sm text-white mb-2 uppercase tracking-wide">
                              Maintenance Rectification Registry
                            </h4>
                            <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed font-sans">
                              Calibrate status from LOCKED back to AVAILABLE upon physical or battery technical release.
                            </p>

                            <form onSubmit={handleMaintRelease} className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                                  Select Locked FSD Device
                                </label>
                                <select
                                  value={maintSelectedSerial}
                                  onChange={(e) => setMaintSelectedSerial(e.target.value)}
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none"
                                >
                                  <option value="">-- Choose Device Serial --</option>
                                  {inventory
                                    .filter((f) => f.lobby_code === activeCC?.lobby_code && f.status === "Locked")
                                    .map((f) => (
                                      <option key={f.serial_no} value={f.serial_no}>
                                        {f.serial_no} ({f.unit_no})
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                                  Technical Repair Summary
                                </label>
                                <textarea
                                  value={maintRepairNotes}
                                  onChange={(e) => setMaintRepairNotes(e.target.value)}
                                  placeholder="Describe the calibrated repair actions implemented..."
                                  className="w-full h-24 bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 placeholder:text-neutral-700 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold tracking-wider text-xs rounded-lg uppercase transition-all duration-350 shadow-md"
                              >
                                Verify & Release to Stack
                              </button>
                            </form>
                          </div>

                          {/* Fault tracker list (8 cols) */}
                          <div className="lg:col-span-8 space-y-3">
                            <h4 className="font-serif italic font-medium text-sm text-slate-200">
                              Locked Hardware Awaiting Supervisor Decisive action
                            </h4>
                            
                            <div className="overflow-x-auto border border-rail-border rounded-xl">
                              <table className="w-full text-left font-sans text-xs">
                                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono tracking-wider border-b border-rail-border text-[9.5px]">
                                  <tr>
                                    <th className="p-3 pl-5">Serial No</th>
                                    <th className="p-3">Unit No</th>
                                    <th className="p-3">Lobby binding</th>
                                    <th className="p-3">Last Operator logged defect remarks</th>
                                    <th className="p-3 text-right pr-5">Calibration Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-rail-border/60 bg-neutral-950/10">
                                  {inventory.filter((f) => f.lobby_code === activeCC?.lobby_code && f.status === "Locked").length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="p-8 text-center font-mono text-slate-500">
                                        Zero faulty active modules registered inside {activeCC?.lobby_code} segment.
                                      </td>
                                    </tr>
                                  ) : (
                                    inventory
                                      .filter((f) => f.lobby_code === activeCC?.lobby_code && f.status === "Locked")
                                      .map((f) => {
                                        // Retrieve last logged handover notes
                                        const lastL = ledger
                                          .filter((l) => l.fsd_serial === f.serial_no && l.hoc_remarks)
                                          .sort((a, b) => b.id - a.id)[0];
                                        return (
                                          <tr key={f.serial_no} className="hover:bg-neutral-950/40 transition">
                                            <td className="p-3 pl-5 font-mono font-bold text-white">{f.serial_no}</td>
                                            <td className="p-3 font-mono text-slate-300">{f.unit_no}</td>
                                            <td className="p-3 font-mono text-slate-400">{f.lobby_code}</td>
                                            <td className="p-3 text-slate-300 text-xs font-sans min-w-[200px]">
                                              {lastL ? lastL.hoc_remarks : "Reported technical fault checkout."}
                                            </td>
                                            <td className="p-3 text-right pr-5">
                                              <span className="inline-block px-2.5 py-1 rounded bg-red-950/50 border border-red-900 text-red-300 tracking-wider font-mono text-[9px] font-bold">
                                                LOCKED OUT
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* Tab 3: Trip ledger historical analytics and downloads */}
                      {ccTab === "history" && (
                        <div className="space-y-6">
                          
                          {/* Search criteria card */}
                          <div className="bg-neutral-900 border border-rail-border p-4 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                                Filter FSD Serial
                              </label>
                              <input
                                type="text"
                                value={filterFsdSerial}
                                onChange={(e) => setFilterFsdSerial(e.target.value)}
                                placeholder="e.g. FSD-A101"
                                className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none"
                              />
                            </div>

                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                                Filter Operational Date (YYYY-MM-DD)
                              </label>
                              <input
                                type="text"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                placeholder="YYYY-MM-DD"
                                className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none"
                              />
                            </div>

                            <div className="md:col-span-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterDate("");
                                  setFilterFsdSerial("");
                                }}
                                className="px-4 py-2 bg-neutral-850 hover:bg-neutral-805 border border-neutral-700 text-slate-300 text-xs font-mono font-bold rounded-lg uppercase flex-1"
                              >
                                Reset Filters
                              </button>
                              <button
                                type="button"
                                onClick={handleSimulatedDownload}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white text-xs font-mono font-bold rounded-lg uppercase flex items-center gap-1.5"
                              >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                <span>Export Report</span>
                              </button>
                            </div>
                          </div>

                          {/* Historical logs table */}
                          <div className="overflow-x-auto border border-rail-border rounded-xl">
                            <table className="w-full text-left font-sans text-xs">
                              <thead className="bg-[#030611] text-slate-400 uppercase font-mono tracking-wider border-b border-rail-border text-[9.5px]">
                                <tr>
                                  <th className="p-3 pl-5">Tx ID</th>
                                  <th className="p-3">FSD Serial</th>
                                  <th className="p-3">FSD Unit</th>
                                  <th className="p-3">Train No</th>
                                  <th className="p-3">Crew LP / Employee ID</th>
                                  <th className="p-3">Takeover Timestamp</th>
                                  <th className="p-3">Handover Timestamp</th>
                                  <th className="p-3">Detonator Box</th>
                                  <th className="p-3">Handover remarks</th>
                                  <th className="p-3 text-right pr-5">Resolution History</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rail-border/60 bg-slate-950/10">
                                {filteredLedger.length === 0 ? (
                                  <tr>
                                    <td colSpan={10} className="p-10 text-center font-mono text-slate-500">
                                      Zero historical records checked-in matching selection filters.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredLedger.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-900/50 transition whitespace-nowrap">
                                      <td className="p-3 pl-5 font-mono text-slate-400">TX-{r.id}</td>
                                      <td className="p-3 font-mono font-bold text-white">{r.fsd_serial}</td>
                                      <td className="p-3 font-mono text-slate-300">{r.fsd_unit}</td>
                                      <td className="p-3 font-bold font-mono text-slate-200">{r.train_no}</td>
                                      <td className="p-3 font-sans text-slate-300">
                                        <p className="font-semibold text-slate-200">{r.lp_name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">ID: {r.lp_id} • ALP: {r.alp_id}</p>
                                      </td>
                                      <td className="p-3 font-mono text-slate-405">{r.toc_time}</td>
                                      <td className="p-3 font-mono text-slate-405">
                                        {r.hoc_time ? <span className="text-slate-200">{r.hoc_time}</span> : <span className="text-blue-400 underline decoration-dotted">Duty Ongoing</span>}
                                      </td>
                                      <td className="p-3 font-mono text-slate-200">{r.detonator_no || "N/A"}</td>
                                      <td className="p-3 text-slate-300 max-w-[200px] truncate" title={r.hoc_remarks || ""}>
                                        {r.hoc_remarks || "N/A"}
                                      </td>
                                      <td className="p-3 text-right pr-5 font-sans italic text-slate-400 text-[10.5px] max-w-[220px] truncate" title={r.hoc_notes || ""}>
                                        {r.hoc_notes || "Device Active / Clear History"}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                        </div>
                      )}

                    </div>

                  </div>
                )}
              </div>
            )}


            {/* CABINET VIEW 4: ADMIN MASTER CONTROL PANEL */}
            {cabinetMode === "admin" && (
              <div className="w-full my-4">
                
                {!isAdminLoggedIn ? (
                  <div className="max-w-md mx-auto my-12 bg-rail-panel rounded-2xl border border-rail-border border-glow-rose p-6 shadow-2xl">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6 text-rose-500" />
                      </div>
                      <h3 className="font-serif italic font-semibold text-xl text-white">System Master Security Auth</h3>
                      <p className="text-xs text-neutral-455 mt-1">Unlock administrator hardware node parameters</p>
                    </div>

                    <form onSubmit={handleAdminAuth} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-widest mb-1.5 font-mono">
                          Enter Master Password Configuration
                        </label>
                        <input
                          type="password"
                          value={enteredAdminPassword}
                          onChange={(e) => setEnteredAdminPassword(e.target.value)}
                          placeholder="Default password is admin"
                          className="w-full bg-neutral-950 border border-rail-border rounded-lg px-4 py-3 placeholder:text-neutral-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500/30"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 text-white font-semibold rounded-lg text-sm transition shadow-md"
                      >
                        Authorize Secure Access
                      </button>

                      <button
                        onClick={resetLobbyContext}
                        className="w-full py-2.5 bg-transparent text-[#a3a3a3] hover:text-white text-xs font-mono"
                      >
                        ↩ Abort to Main Terminal Layout
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Admin Dashboard operational tabs */
                  <div className="bg-rail-panel rounded-2xl border border-rail-border overflow-hidden shadow-2xl">
                    
                    <div className="px-6 py-4 bg-neutral-950/40 border-b border-rail-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-rose-450 uppercase font-bold bg-rose-505/5 px-2.5 py-1 rounded border border-rose-500/30">
                          🔒 ADMIN PORTAL AUTHORITY SECTOR ACTIVE
                        </span>
                        <h3 className="text-white font-serif italic text-base mt-2">
                          Lobby hardware nodes, crew controllers directories, and roster logs
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsAdminLoggedIn(false);
                            setEnteredAdminPassword("");
                          }}
                          className="px-3.5 py-1.5 bg-red-950/25 hover:bg-red-900/40 border border-red-900/30 text-rose-400 text-[11px] font-mono rounded-lg transition"
                        >
                          LOCK MASTER SYSTEM
                        </button>
                        <button
                          onClick={resetLobbyContext}
                          className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-75 border border-neutral-700 text-slate-300 text-[11px] font-mono rounded-lg transition"
                        >
                          LOBBY HOME
                        </button>
                      </div>
                    </div>

                    {/* Admin internal navigation subtabs */}
                    <div className="flex border-b border-rail-border bg-neutral-950/15 px-6">
                      {[
                        { id: "lobby", label: "Lobby Registry" },
                        { id: "cc", label: "CC Registry" },
                        { id: "fsd", label: "FSD Inventories" },
                        { id: "crew", label: "Crew Directory Directory" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAdminTab(t.id as any)}
                          className={`py-3.5 px-4 font-mono text-xs font-bold tracking-wider uppercase border-b-2 transition duration-200 ${
                            adminTab === t.id
                              ? "border-rose-500/50 text-white bg-neutral-950/40"
                              : "border-transparent text-slate-450 hover:text-slate-200"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-6 md:p-8">
                      
                      {/* Sub-tab 1: Lobby Node Registry */}
                      {adminTab === "lobby" && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          
                          {/* Left Panel */}
                          <div className="md:col-span-4 bg-neutral-950/20 border border-rail-border rounded-xl p-5">
                            <h4 className="font-serif italic font-medium text-sm text-slate-200 mb-3 uppercase tracking-wider font-mono">
                              Deploy New Lobby Station
                            </h4>
                            <form onSubmit={handleSaveLobby} className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 font-mono uppercase tracking-widest">
                                  Lobby Sector Code
                                </label>
                                <input
                                  type="text"
                                  value={newLobbyCode}
                                  onChange={(e) => setNewLobbyCode(e.target.value.toUpperCase())}
                                  placeholder="e.g. GNT"
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 font-mono uppercase tracking-widest">
                                  Lobby Full Name
                                </label>
                                <input
                                  type="text"
                                  value={newLobbyName}
                                  onChange={(e) => setNewLobbyName(e.target.value)}
                                  placeholder="e.g. Guntur Station Lobby"
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
                              >
                                Deploy Node Registry
                              </button>
                            </form>
                          </div>

                          {/* Right Panel */}
                          <div className="md:col-span-8">
                            <h4 className="font-serif italic font-semibold text-sm text-slate-300 mb-3">
                              Currently deployed active Lobby nodes
                            </h4>
                            <div className="border border-rail-border rounded-xl overflow-hidden">
                              <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-neutral-950 text-neutral-400 uppercase border-b border-rail-border font-mono text-[9px] tracking-wider">
                                  <tr>
                                    <th className="p-3 pl-5">Lobby Code</th>
                                    <th className="p-3">Lobby Name Details</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-rail-border/60 bg-neutral-950/10">
                                  {lobbies.map((l) => (
                                    <tr key={l.lobby_code} className="hover:bg-neutral-950/40 transition">
                                      <td className="p-3 pl-5 font-bold text-emerald-400">{l.lobby_code}</td>
                                      <td className="p-3 text-slate-300">{l.lobby_name}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* Sub-tab 2: Controller Registry Profiles */}
                      {adminTab === "cc" && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          
                          {/* Left form */}
                          <div className="md:col-span-4 bg-neutral-950/20 border border-rail-border rounded-xl p-5">
                            <h4 className="font-serif italic font-medium text-sm text-slate-200 mb-3 uppercase tracking-wider font-mono">
                              Generate System CC ID Keys
                            </h4>
                            <form onSubmit={handleCreateCC} className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-400 mb-2 font-mono uppercase tracking-widest">
                                  Select sector Lobby binding
                                </label>
                                <select
                                  value={ccFormLobby}
                                  onChange={(e) => setCCFormLobby(e.target.value)}
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                                >
                                  <option value="">-- Choose Lobby Target --</option>
                                  {lobbies.map((l) => (
                                    <option key={l.lobby_code} value={l.lobby_code}>
                                      {l.lobby_code}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-neutral-400 mb-2 font-mono uppercase tracking-widest">
                                  Controller operator Full Name
                                </label>
                                <input
                                  type="text"
                                  value={ccFormName}
                                  onChange={(e) => setCCFormName(e.target.value)}
                                  placeholder="Enter CC Operative Name"
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-neutral-400 mb-2 font-mono uppercase tracking-widest">
                                  Mobile phone No (10-digits suffix checkout rule)
                                </label>
                                <input
                                  type="text"
                                  value={ccFormMobile}
                                  onChange={(e) => setCCFormMobile(e.target.value)}
                                  placeholder="e.g. 9848024311"
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition animate-pulse"
                              >
                                Generate Controller Credential
                              </button>
                            </form>
                          </div>

                          {/* Right Table */}
                          <div className="md:col-span-8">
                            <h4 className="font-serif italic font-semibold text-sm text-slate-300 mb-3">
                              Currently Registered Controllers Profiles
                            </h4>
                            <div className="border border-rail-border rounded-xl overflow-hidden">
                              <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-neutral-950 text-neutral-400 uppercase border-b border-rail-border font-mono text-[9px] tracking-wider">
                                  <tr>
                                    <th className="p-3 pl-5">Controller ID (Suffix Keys)</th>
                                    <th className="p-3">Full Operative Name</th>
                                    <th className="p-3">Sector Depot Code</th>
                                    <th className="p-3">Mobile Contact</th>
                                    <th className="p-3 text-right pr-5">Disposal Controls</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-rail-border/60 bg-neutral-950/10">
                                  {controllers.map((c) => (
                                    <tr key={c.cc_id} className="hover:bg-neutral-950/40 transition">
                                      <td className="p-3 pl-5 font-bold text-emerald-400">{c.cc_id}</td>
                                      <td className="p-3 text-slate-200">{c.name}</td>
                                      <td className="p-3 text-slate-400 font-bold">{c.lobby_code}</td>
                                      <td className="p-3 text-slate-300">{c.mobile}</td>
                                      <td className="p-3 text-right pr-5">
                                        <button
                                          type="button"
                                          onClick={() => handleRevokeCC(c.cc_id)}
                                          className="p-1 text-red-400 hover:text-red-500 hover:bg-red-950/20 rounded transition"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* Sub-tab 3: FSD Device Asset Deployments */}
                      {adminTab === "fsd" && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          
                          {/* Left form */}
                          <div className="md:col-span-4 bg-neutral-950/20 border border-rail-border rounded-xl p-5">
                            <h4 className="font-serif italic font-medium text-sm text-slate-200 mb-3 uppercase tracking-wider font-mono">
                              Deploy physical asset registries
                            </h4>
                            <form onSubmit={handleLinkFsd} className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-450 mb-2 font-mono uppercase tracking-widest">
                                  FSD Hardware Serial No (HINT: FSD-102)
                                </label>
                                <input
                                  type="text"
                                  value={fsdFormSerial}
                                  onChange={(e) => setFsdFormSerial(e.target.value.toUpperCase())}
                                  placeholder="e.g. FSD-A103"
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-neutral-455 mb-2 font-mono uppercase tracking-widest">
                                  FSD Module Unit No (HINT: UNIT-Z5)
                                </label>
                                <input
                                  type="text"
                                  value={fsdFormUnit}
                                  onChange={(e) => setFsdFormUnit(e.target.value.toUpperCase())}
                                  placeholder="e.g. UNIT-Y5"
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-neutral-455 mb-2 font-mono uppercase tracking-widest">
                                  Home Lobby target binding code
                                </label>
                                <select
                                  value={fsdFormLobby}
                                  onChange={(e) => setFsdFormLobby(e.target.value)}
                                  className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                                >
                                  <option value="">-- Choose Lobby Target --</option>
                                  {lobbies.map((l) => (
                                    <option key={l.lobby_code} value={l.lobby_code}>
                                      {l.lobby_code}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
                              >
                                Link Device Parameters
                              </button>
                            </form>
                          </div>

                          {/* Right table */}
                          <div className="md:col-span-8">
                            <h4 className="font-serif italic font-semibold text-sm text-slate-300 mb-3">
                              Currently tracked physical FSD inventories at SCR sectors
                            </h4>
                            <div className="border border-rail-border rounded-xl overflow-hidden">
                              <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-neutral-950 text-neutral-400 uppercase border-b border-rail-border font-mono text-[9px] tracking-wider">
                                  <tr>
                                    <th className="p-3 pl-5">Serial No</th>
                                    <th className="p-3">Unit No</th>
                                    <th className="p-3">Assigned sector</th>
                                    <th className="p-3 text-right pr-5">Active Status code</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-rail-border/60 bg-neutral-950/10">
                                  {inventory.map((f) => (
                                    <tr key={f.serial_no} className="hover:bg-neutral-950/40 transition">
                                      <td className="p-3 pl-5 font-bold text-slate-100">{f.serial_no}</td>
                                      <td className="p-3 text-slate-350">{f.unit_no}</td>
                                      <td className="p-3 text-slate-450 font-bold">{f.lobby_code}</td>
                                      <td className="p-3 text-right pr-5">
                                        <span className={`inline-block px-2.5 py-1 text-[9.5px] font-bold rounded uppercase font-mono border ${
                                          f.status === "Available"
                                            ? "border-emerald-900 bg-emerald-950/30 text-emerald-300"
                                            : f.status === "Deployed"
                                            ? "border-blue-900 bg-blue-950/30 text-blue-300"
                                            : "border-red-900 bg-red-950/30 text-red-300 animate-pulse"
                                        }`}>
                                          {f.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* Sub-tab 4: Crew Master Directories bulk upload */}
                      {adminTab === "crew" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Left Panel: Register Crew single */}
                          <div className="lg:col-span-4 space-y-6">
                            <div className="bg-neutral-950/20 border border-rail-border rounded-xl p-5">
                              <h4 className="font-serif italic font-medium text-sm text-slate-200 mb-3 uppercase tracking-wider font-mono">
                                Insert Single Crew member record line
                              </h4>
                              <form onSubmit={handleSaveCrewSingle} className="space-y-4">
                                <div className="flex bg-neutral-950 p-1 border border-neutral-850 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => setCrewFormType("lp")}
                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition ${
                                      crewFormType === "lp" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
                                    }`}
                                  >
                                    Loco Pilot
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCrewFormType("alp")}
                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition ${
                                      crewFormType === "alp" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
                                    }`}
                                  >
                                    Assistant LP
                                  </button>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-2 font-mono uppercase">
                                    Lobby Binding Code
                                  </label>
                                  <select
                                    value={crewFormLobby}
                                    onChange={(e) => setCrewFormLobby(e.target.value)}
                                    className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                                  >
                                    <option value="">-- Choose Lobby Target --</option>
                                    {lobbies.map((l) => (
                                      <option key={l.lobby_code} value={l.lobby_code}>
                                        {l.lobby_code}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-2 font-mono uppercase">
                                    Employee ID (LP / ALP)
                                  </label>
                                  <input
                                    type="text"
                                    value={crewFormId}
                                    onChange={(e) => setCrewFormId(e.target.value.toUpperCase())}
                                    placeholder="e.g. LP007"
                                    className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-2 font-mono uppercase">
                                    Full Name
                                  </label>
                                  <input
                                    type="text"
                                    value={crewFormName}
                                    onChange={(e) => setCrewFormName(e.target.value)}
                                    placeholder="Enter Employee Full Name"
                                    className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
                                >
                                  Insert Roster record line
                                </button>
                              </form>
                            </div>

                            {/* Simulated Spreadsheets Importer */}
                            <div className="bg-neutral-950/20 border border-rail-border rounded-xl p-5">
                              <h4 className="font-serif italic font-medium text-sm text-slate-200 mb-1.5 uppercase tracking-wider font-mono">
                                Simulated spreadsheet bulk loader
                              </h4>
                              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed font-sans">
                                Bulk register multiple LP/ALP lines. Paste your indices separated by commas:
                              </p>

                              <form onSubmit={handleBulkUpload} className="space-y-4">
                                <div className="flex bg-neutral-950 p-1 border border-neutral-850 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => setBulkType("lp")}
                                    className={`flex-1 py-1 px-3 text-[10px] font-bold uppercase rounded-md transition ${
                                      bulkType === "lp" ? "bg-neutral-850 text-white" : "text-neutral-500 hover:text-neutral-300"
                                    }`}
                                  >
                                    Bulk LP list
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBulkType("alp")}
                                    className={`flex-1 py-1 px-3 text-[10px] font-bold uppercase rounded-md transition ${
                                      bulkType === "alp" ? "bg-neutral-850 text-white" : "text-neutral-500 hover:text-neutral-300"
                                    }`}
                                  >
                                    Bulk ALP list
                                  </button>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 font-mono uppercase bg-transparent">
                                    Associate target Lobby Depot
                                  </label>
                                  <select
                                    value={bulkLobbyCode}
                                    onChange={(e) => setBulkLobbyCode(e.target.value)}
                                    className="w-full bg-neutral-950 border border-rail-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                                  >
                                    <option value="">-- Choose Lobby Target --</option>
                                    {lobbies.map((l) => (
                                      <option key={l.lobby_code} value={l.lobby_code}>
                                        {l.lobby_code}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-2 font-mono">
                                    Paste Crew Matrix (Format: ID, Name)
                                  </label>
                                  <textarea
                                    value={bulkInputText}
                                    onChange={(e) => setBulkInputText(e.target.value)}
                                    placeholder="LP099,M. SHANKAR&#10;LP100,SAI TEJA"
                                    className="w-full h-24 bg-neutral-950 border border-rail-border rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-neutral-700 focus:outline-none"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
                                >
                                  Bulk Import crew list
                                </button>
                              </form>
                            </div>
                          </div>

                          {/* Right panels: Roster directory indices list */}
                          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-serif italic font-medium text-xs text-slate-350 uppercase tracking-wider font-mono mb-2">
                                Loco Pilot (LP) Registry Database
                              </h4>
                              <div className="border border-rail-border/65 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                                <table className="w-full text-left text-[11px] font-mono">
                                  <thead className="bg-neutral-950 text-neutral-400 border-b border-rail-border/60 uppercase text-[9px]">
                                    <tr>
                                      <th className="p-3 pl-4">LP ID</th>
                                      <th className="p-3">Full Name</th>
                                      <th className="p-3 pr-4">Lobby</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-rail-border/60 bg-neutral-950/10">
                                    {lpMaster.map((l) => (
                                      <tr key={l.lp_id} className="hover:bg-neutral-950/40 transition">
                                        <td className="p-3 pl-4 font-bold text-slate-200">{l.lp_id}</td>
                                        <td className="p-3 text-slate-300">{l.lp_name}</td>
                                        <td className="p-3 pr-4 text-emerald-400 font-bold">{l.lobby_code}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-serif italic font-medium text-xs text-slate-350 uppercase tracking-wider font-mono mb-2">
                                Assistant Loco Pilot (ALP) Registry
                              </h4>
                              <div className="border border-rail-border/65 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                                <table className="w-full text-left text-[11px] font-mono">
                                  <thead className="bg-neutral-950 text-neutral-400 border-b border-rail-border/60 uppercase text-[9px]">
                                    <tr>
                                      <th className="p-3 pl-4">ALP ID</th>
                                      <th className="p-3">Full Name</th>
                                      <th className="p-3 pr-4">Lobby</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-rail-border/60 bg-neutral-950/10">
                                    {alpMaster.map((l) => (
                                      <tr key={l.alp_id} className="hover:bg-neutral-950/40 transition">
                                        <td className="p-3 pl-4 font-bold text-slate-200">{l.alp_id}</td>
                                        <td className="p-3 text-slate-305">{l.alp_name}</td>
                                        <td className="p-3 pr-4 text-emerald-400 font-bold">{l.lobby_code}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Premium Live Master HUD Dashboard Block (Bottom Stats) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-6 border-t border-rail-border/40">
              {/* Card 1: Registered Lobbies */}
              <div className="bg-rail-panel border border-rail-border hover:border-glow-emerald rounded-2xl p-5 shadow-lg relative overflow-hidden group transition duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/[0.02] rounded-full blur-xl group-hover:bg-emerald-500/[0.05] transition duration-300"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-neutral-450 uppercase font-semibold">
                      DEPO STATIONS
                    </span>
                    <h3 className="text-2xl font-mono font-extrabold text-white mt-1.5">
                      {lobbies.length.toString().padStart(2, "0")}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-neutral-400 group-hover:scale-110 transition duration-300" />
                  </div>
                </div>
                <p className="text-[10.5px] text-neutral-500 mt-2 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Active division hubs mapped</span>
                </p>
              </div>

              {/* Card 2: Active Trains Trips */}
              <div className="bg-rail-panel border border-rail-border hover:border-glow-amber rounded-2xl p-5 shadow-lg relative overflow-hidden group transition duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/[0.02] rounded-full blur-xl group-hover:bg-amber-500/[0.05] transition duration-300"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
                      ACTIVE RUNS
                    </span>
                    <h3 className="text-2xl font-mono font-extrabold text-emerald-400 mt-1.5">
                      {ledger.filter((op) => !op.hoc_time).length.toString().padStart(2, "0")}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center relative">
                    <Train className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition duration-300" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 led-pulse-green"></span>
                  </div>
                </div>
                <p className="text-[10.5px] text-neutral-500 mt-2 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>Crews on-duty with FSD</span>
                </p>
              </div>

              {/* Card 3: Deployable FSD Units */}
              <div className="bg-rail-panel border border-rail-border hover:border-glow-emerald rounded-2xl p-5 shadow-lg relative overflow-hidden group transition duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/[0.02] rounded-full blur-xl group-hover:bg-emerald-500/[0.05] transition duration-300"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-neutral-450 uppercase font-semibold">
                      HEALTHY ASSETS
                    </span>
                    <h3 className="text-2xl font-mono font-extrabold text-white mt-1.5">
                      {inventory.filter((f) => f.status === "Available").length.toString().padStart(2, "0")}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-neutral-400 group-hover:scale-110 transition duration-300" />
                  </div>
                </div>
                <p className="text-[10.5px] text-neutral-500 mt-2 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>FSD devices in available pool</span>
                </p>
              </div>

              {/* Card 4: Locked/Maintenance Units */}
              <div className="bg-rail-panel border border-rail-border hover:border-glow-rose rounded-2xl p-5 shadow-lg relative overflow-hidden group transition duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/[0.02] rounded-full blur-xl group-hover:bg-rose-500/[0.05] transition duration-300"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#f87171] uppercase font-semibold">
                      LOCKED MODULES
                    </span>
                    <h3 className="text-2xl font-mono font-extrabold text-[#f1f5f9] mt-1.5">
                      {inventory.filter((f) => f.status === "Locked").length.toString().padStart(2, "0")}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center relative">
                    <AlertTriangle className="w-5 h-5 text-red-400 group-hover:scale-110 transition duration-300" />
                    {inventory.filter((f) => f.status === "Locked").length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 led-pulse-red"></span>
                    )}
                  </div>
                </div>
                <p className="text-[10.5px] text-neutral-500 mt-2 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <span>Awaiting CC technicians release</span>
                </p>
              </div>
            </div>

          </div>

      </main>

      {/* Terminal Grid Footer */}
      <footer className="bg-neutral-950 border-t border-rail-border py-4 px-6 md:px-8 text-center shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10.5px] font-mono text-neutral-500">
          <div>
            <span>SYSTEM CONSOLE v4.2 PRO • CONNECTED NODE AGENT • LIVE</span>
          </div>
          <div>
            <span>SOUTH CENTRAL RAILWAY • FOG SIGNAL DEVICE (FSD) DISPATCH CORE™</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
