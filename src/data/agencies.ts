import { AgencyConfigMap } from "@/types/agency";

export const AGENCIES: AgencyConfigMap = {
  PDRM: {
    name: "PDRM",
    fullName: "Polis DiRaja Malaysia",
    color: "#1E40AF",
    icon: "/icons/pdrm.svg",
    description: "Royal Malaysian Police",
    emergencyTypes: ["crime", "accident", "public-safety"],
  },
  JBPM: {
    name: "JBPM",
    fullName: "Jabatan Bomba dan Penyelamat Malaysia",
    color: "#DC2626",
    icon: "/icons/jbpm.svg",
    description: "Malaysian Fire and Rescue Department",
    emergencyTypes: ["fire", "rescue", "hazmat", "natural-disaster"],
  },
  KKM: {
    name: "KKM",
    fullName: "Kementerian Kesihatan Malaysia",
    color: "#059669",
    icon: "/icons/kkm.svg",
    description: "Ministry of Health Malaysia",
    emergencyTypes: ["medical", "health-emergency", "pandemic"],
  },
  APM: {
    name: "APM",
    fullName: "Angkatan Pertahanan Awam Malaysia",
    color: "#EA580C",
    icon: "/icons/apm.svg",
    description: "Malaysian Civil Defence Force",
    emergencyTypes: ["natural-disaster", "rescue", "civil-emergency"],
  },
  MMEA: {
    name: "MMEA",
    fullName: "Maritim Malaysia",
    color: "#0891B2",
    icon: "/icons/mmea.svg",
    description: "Malaysian Maritime Enforcement Agency",
    emergencyTypes: ["maritime", "coastal-emergency", "sea-rescue"],
  },
};

export const AGENCY_COLORS = {
  PDRM: "#1E40AF",
  JBPM: "#DC2626",
  KKM: "#059669",
  APM: "#EA580C",
  MMEA: "#0891B2",
} as const;
