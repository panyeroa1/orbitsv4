/**
 * PeerIdManager - Generates and manages persistent peer IDs for WebRTC connections
 * 
 * Problem solved:
 * - Multiple unauthenticated users sharing 'guest' ID causes peer connection conflicts
 * - Supabase presence overwrites when multiple guests join
 * 
 * Solution:
 * - Generate unique UUID per browser (stored in localStorage)
 * - Authenticated users use their user ID
 * - Guest users get persistent peer ID across page refreshes
 */

export class PeerIdManager {
  private static readonly STORAGE_KEY = 'orbits_peer_id';
  
  /**
   * Get peer ID for current user
   * @param userId - Authenticated user ID (from Supabase session)
   * @returns Persistent peer ID for this browser/user
   */
  static getPeerId(userId?: string): string {
    // Authenticated users: use their actual user ID
    if (userId) {
      return userId;
    }
    
    // Guest users: check for existing peer ID in localStorage
    let peerId = localStorage.getItem(this.STORAGE_KEY);
    
    if (!peerId) {
      // Generate new UUID for this browser
      peerId = crypto.randomUUID();
      
      try {
        localStorage.setItem(this.STORAGE_KEY, peerId);
        console.log('[PeerIdManager] Generated new peer ID:', peerId);
      } catch (error) {
        console.error('[PeerIdManager] Failed to save peer ID:', error);
        // Continue with generated ID even if localStorage fails
      }
    } else {
      console.log('[PeerIdManager] Using existing peer ID:', peerId);
    }
    
    return peerId;
  }
  
  /**
   * Clear stored peer ID (typically on logout)
   */
  static clearPeerId(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[PeerIdManager] Cleared peer ID');
    } catch (error) {
      console.error('[PeerIdManager] Failed to clear peer ID:', error);
    }
  }
  
  /**
   * Check if current peer is a guest (no auth)
   */
  static isGuest(userId?: string): boolean {
    return !userId;
  }
}
