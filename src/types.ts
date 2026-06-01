export interface Lobby {
  lobby_code: string;
  lobby_name: string;
}

export interface CrewController {
  cc_id: string;
  lobby_code: string;
  name: string;
  mobile: string;
}

export interface FSDDevice {
  serial_no: string;
  unit_no: string;
  lobby_code: string;
  status: "Available" | "Deployed" | "Locked";
  current_lp: string;
  current_alp: string;
  rectification_date: string;
  repair_notes: string;
}

export interface LocoPilot {
  lp_id: string;
  lp_name: string;
  lobby_code: string;
}

export interface AssistantLocoPilot {
  alp_id: string;
  alp_name: string;
  lobby_code: string;
}

export interface OpsRecord {
  id: number;
  lobby_code: string;
  fsd_serial: string;
  fsd_unit: string;
  lp_id: string;
  lp_name: string;
  alp_id: string;
  alp_name: string;
  train_no: string;
  toc_time: string;
  toc_status: "Active_Track" | "Completed";
  hoc_time: string | null;
  hoc_remarks: string | null;
  detonator_no: string | null;
  hoc_notes: string | null;
}
