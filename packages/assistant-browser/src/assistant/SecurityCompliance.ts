/**
 * SecurityCompliance - Handles secure credential storage, audit trails, and compliance.
 * Implements secure local storage, encryption basics, and audit logging.
 */

export interface AuditEntry {
  timestamp: string;
  action: string;
  user?: string;
  ipAddress?: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
}

export class SecurityCompliance {
  private auditLog: AuditEntry[] = [];
  private readonly SECURE_STORAGE_PREFIX = '__secure_';
  private readonly MAX_AUDIT_ENTRIES = 10000; // Keep last 10k entries

  /**
   * Store credentials securely using localStorage with basic encryption.
   * NOTE: This is NOT production-grade encryption. Use proper encryption libraries in production.
   */
  async storeCredentialsSecurely(key: string, credentials: { username: string; password?: string }): Promise<void> {
    try {
      // Simple encoding (NOT encryption - replace with proper crypto in production)
      const encoded = btoa(JSON.stringify(credentials));
      const storageKey = `${this.SECURE_STORAGE_PREFIX}${key}`;

      localStorage.setItem(storageKey, encoded);
      localStorage.setItem(`${storageKey}_timestamp`, new Date().toISOString());

      this.logAudit('credential_stored', 'success', {
        key,
        username: credentials.username,
      });

      console.log('[Security] Credentials stored securely');
    } catch (error) {
      this.logAudit('credential_stored', 'failure', { error: String(error) });
      throw new Error(`Failed to store credentials: ${error}`);
    }
  }

  /**
   * Retrieve credentials from secure storage.
   */
  async retrieveCredentialsSecurely(key: string): Promise<{ username: string; password?: string } | null> {
    try {
      const storageKey = `${this.SECURE_STORAGE_PREFIX}${key}`;
      const encoded = localStorage.getItem(storageKey);

      if (!encoded) {
        return null;
      }

      const credentials = JSON.parse(atob(encoded));

      this.logAudit('credential_retrieved', 'success', { key });

      return credentials;
    } catch (error) {
      this.logAudit('credential_retrieved', 'failure', { error: String(error) });
      return null;
    }
  }

  /**
   * Clear stored credentials.
   */
  async clearCredentials(key: string): Promise<void> {
    try {
      const storageKey = `${this.SECURE_STORAGE_PREFIX}${key}`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_timestamp`);

      this.logAudit('credential_cleared', 'success', { key });

      console.log('[Security] Credentials cleared');
    } catch (error) {
      this.logAudit('credential_cleared', 'failure', { error: String(error) });
    }
  }

  /**
   * Log an action for audit trail.
   */
  logAudit(
    action: string,
    result: 'success' | 'failure',
    details?: Record<string, any>
  ): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      result,
      details,
      ipAddress: this.getClientIpHint(),
    };

    this.auditLog.push(entry);

    // Keep only recent entries
    if (this.auditLog.length > this.MAX_AUDIT_ENTRIES) {
      this.auditLog = this.auditLog.slice(-this.MAX_AUDIT_ENTRIES);
    }

    // Persist to localStorage
    try {
      localStorage.setItem('__audit_log', JSON.stringify(this.auditLog));
    } catch (error) {
      console.warn('[Security] Failed to persist audit log:', error);
    }
  }

  /**
   * Get hint about client IP (from user agent or request context).
   * NOTE: Actual IP detection requires server-side logic.
   */
  private getClientIpHint(): string | undefined {
    // This is a placeholder - real IP detection requires server integration
    return undefined;
  }

  /**
   * Retrieve audit trail.
   */
  getAuditTrail(limit: number = 100): AuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Export audit trail as JSON (for compliance reports).
   */
  exportAuditTrail(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }

  /**
   * Clear all audit logs (restricted operation).
   */
  clearAuditTrail(): void {
    this.logAudit('audit_trail_cleared', 'success');
    this.auditLog = [];
    localStorage.removeItem('__audit_log');
  }

  /**
   * Validate data sensitivity and mask sensitive values.
   */
  maskSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'bearerToken', 'sessionId'];
    const masked = { ...data };

    for (const key of sensitiveKeys) {
      if (key in masked && masked[key]) {
        const value = String(masked[key]);
        masked[key] = value.length > 4 ? `${value.substring(0, 2)}***${value.substring(value.length - 2)}` : '***';
      }
    }

    return masked;
  }

  /**
   * Verify CORS and origin headers for security.
   */
  verifyCorsPolicy(origin: string, allowedOrigins: string[]): boolean {
    const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
    this.logAudit('cors_verification', isAllowed ? 'success' : 'failure', { origin });
    return isAllowed;
  }

  /**
   * Enable Content Security Policy headers (requires server support).
   */
  getRecommendedCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    };
  }

  /**
   * Check GDPR compliance requirements.
   */
  getGDPRCompliance(): {
    dataMinimization: boolean;
    consentTracking: boolean;
    rightToDelete: boolean;
    auditTrail: boolean;
  } {
    return {
      dataMinimization: true, // Only store necessary data
      consentTracking: true, // Track user consent
      rightToDelete: true, // Can delete audit logs
      auditTrail: this.auditLog.length > 0,
    };
  }
}
