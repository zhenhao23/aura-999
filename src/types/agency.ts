import { AgencyType } from "./resource";

export interface AgencyConfig {
  name: string;
  fullName: string;
  color: string;
  icon: string;
  description: string;
  emergencyTypes: string[];
}

export type AgencyConfigMap = Record<AgencyType, AgencyConfig>;

export interface Message {
  id: string;
  sender: "dispatcher" | "caller" | "system";
  content: string;
  originalLanguage?: string;
  translatedContent?: string;
  timestamp: Date;
}

export interface CommunicationSession {
  incidentId: string;
  messages: Message[];
  activeLanguage: string;
  callerLanguage: string;
}
