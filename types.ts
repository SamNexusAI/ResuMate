export interface OptimizationRequest {
  resumeText: string;
  jobDescription: string;
  plan: PlanLevel;
}

export interface OptimizationResult {
  optimizedContent: string;
  coverLetter?: string;
  atsScore?: number;
  timestamp?: number;
  planUsed: PlanLevel;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  STREAMING = 'STREAMING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type PlanLevel = 'free' | 'premium' | 'executive' | 'ultimate';

// Auth & User Types
export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanLevel;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  upgradeToPlan: (plan: PlanLevel) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}