import { AppState, MeetingSession, MeetingSettings, TranslationConfig } from '../types';

interface SessionData {
  appState: AppState;
  sessionInfo: MeetingSession | null;
  config: TranslationConfig;
  meetingSettings: MeetingSettings;
  isMicActive: boolean;
  isVideoActive: boolean;
  showCaptions: boolean;
  pinnedParticipantId: string | null;
  pinnedScreenShare: string | null;
  timestamp: number;
}

const SESSION_KEY = 'orbits_active_session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export class SessionManager {
  /**
   * Save current session state
   */
  static saveSession(data: Partial<SessionData>): void {
    try {
      const existing = this.getSession();
      const sessionData: SessionData = {
        ...existing,
        ...data,
        timestamp: Date.now()
      } as SessionData;

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session:', error);
      // Handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearSession();
      }
    }
  }

  /**
   * Get saved session state
   */
  static getSession(): Partial<SessionData> | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const data: SessionData = JSON.parse(stored);

      // Check if session is expired
      if (Date.now() - data.timestamp > SESSION_TIMEOUT) {
        this.clearSession();
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Check if a valid session exists
   */
  static hasValidSession(): boolean {
    const session = this.getSession();
    return session !== null && session.appState === AppState.ACTIVE;
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Update specific session field
   */
  static updateField<K extends keyof SessionData>(
    field: K,
    value: SessionData[K]
  ): void {
    const session = this.getSession();
    if (session) {
      this.saveSession({ ...session, [field]: value });
    }
  }

  /**
   * Check if session should be restored
   */
  static shouldRestoreSession(): boolean {
    const session = this.getSession();
    if (!session) return false;

    // Only restore if user was in an active meeting
    return session.appState === AppState.ACTIVE && 
           session.sessionInfo !== null &&
           Date.now() - session.timestamp < SESSION_TIMEOUT;
  }
}
