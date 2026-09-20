import { query, getDB } from '../../database/db.repo';
import crypto from 'crypto';

export class AuthRepository {
  public async findByUsername(username: string): Promise<any | null> {
    const cleanUsername = (username || '').toLowerCase().trim();
    if (!cleanUsername) return null;

    // 1. Attempt PostgreSQL relational query if available
    try {
      const res = await query('SELECT * FROM zmc_users WHERE LOWER(username) = LOWER($1)', [cleanUsername]);
      if (res && res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          username: row.username,
          password: row.password,
          name: row.name,
          role: row.role,
          department: row.department || '',
          email: row.email || '',
          status: row.status || 'Active',
          last_login: row.last_login || null,
          created_at: row.created_at || null,
          created_by: row.created_by || 'admin'
        };
      }
    } catch (err) {
      // PostgreSQL query skipped or pool not active, proceed to cache/preset fallback
    }

    // 2. Check in-memory dbCache
    try {
      const db = getDB();
      if (db && Array.isArray(db.users)) {
        const found = db.users.find(u => u.username?.toLowerCase().trim() === cleanUsername);
        if (found) {
          return {
            id: found.id,
            username: found.username,
            password: found.password,
            name: found.name,
            role: found.role,
            department: found.department || '',
            email: found.email || '',
            status: found.status || 'Active',
            last_login: found.last_login || null,
            created_at: found.created_at || null,
            created_by: found.created_by || 'admin'
          };
        }
      }
    } catch (err) {}

    // 3. Guaranteed fallback preset definitions for all standard clinical staff accounts
    const standardUsersPreset: Record<string, any> = {
      'admin': { id: 'user-it-admin-1', username: 'admin', password: 'admin123', name: 'IT Administrator', role: 'IT Administrator', department: 'IT', email: 'admin@zmc.com', status: 'Active' },
      'opd.clerk': { id: 'user-opd-clerk-2', username: 'opd.clerk', password: 'opd123', name: 'OPD Clerk', role: 'OPD Clerk', department: 'OPD', email: 'opd.clerk@zmc.com', status: 'Active' },
      'cashier1': { id: 'user-cashier-3', username: 'cashier1', password: 'cash123', name: 'Cashier Officer', role: 'Cashier', department: 'Finance', email: 'cashier1@zmc.com', status: 'Active' },
      'dr.smith': { id: 'user-doctor-smith-4', username: 'dr.smith', password: 'doc123', name: 'Dr. John Smith', role: 'Doctor', department: 'Medical', email: 'dr.smith@zmc.com', status: 'Active' },
      'lab.tech': { id: 'user-lab-tech-5', username: 'lab.tech', password: 'lab123', name: 'Lab Technician', role: 'Lab Technician', department: 'Laboratory', email: 'lab.tech@zmc.com', status: 'Active' },
      'pharmacist1': { id: 'user-pharmacist-6', username: 'pharmacist1', password: 'pharm123', name: 'Pharmacist', role: 'Pharmacist', department: 'Pharmacy', email: 'pharmacist1@zmc.com', status: 'Active' },
      'nurse1': { id: 'user-head-nurse-7', username: 'nurse1', password: 'nurse123', name: 'Head Nurse', role: 'Nurse', department: 'Nursing', email: 'nurse1@zmc.com', status: 'Active' },
      'accounts': { id: 'user-accounts-8', username: 'accounts', password: 'acc123', name: 'Account Officer', role: 'Account Officer', department: 'Finance', email: 'accounts@zmc.com', status: 'Active' },
      'hr.manager': { id: 'user-hr-manager-9', username: 'hr.manager', password: 'hr123', name: 'HR Manager', role: 'HR Manager', department: 'Human Resources', email: 'hr.manager@zmc.com', status: 'Active' },
      'eye.clinic': { id: 'user-eye-clinic-10', username: 'eye.clinic', password: 'eye123', name: 'Eye Clinic Specialist', role: 'Eye Clinic', department: 'Eye Clinic', email: 'eye.clinic@zmc.com', status: 'Active' },
      'accountant': { id: 'compat-user-accountant', username: 'accountant', password: 'accountant123', name: 'Account Officer', role: 'Account Officer', department: 'Finance', email: 'accountant@zmc.com', status: 'Active' },
      'dr_smith': { id: 'compat-user-dr-smith-legacy', username: 'dr_smith', password: 'password', name: 'Dr. Alan Smith', role: 'Doctor', department: 'Medical', email: 'dr_smith@zmc.com', status: 'Active' },
      'nurse_jane': { id: 'compat-user-nurse-jane', username: 'nurse_jane', password: 'password', name: 'Nurse Jane Doe', role: 'Nurse', department: 'Nursing', email: 'jane@zmc.com', status: 'Active' },
      'lab_tech': { id: 'compat-user-lab-tech', username: 'lab_tech', password: 'password', name: 'John Doe (Lab Tech)', role: 'Lab Technician', department: 'Laboratory', email: 'lab@zmc.com', status: 'Active' },
      'pharmacist': { id: 'compat-user-pharmacist', username: 'pharmacist', password: 'password', name: 'Mary Green (Pharmacist)', role: 'Pharmacist', department: 'Pharmacy', email: 'pharm@zmc.com', status: 'Active' },
      'opd_registrar': { id: 'compat-user-opd-reg', username: 'opd_registrar', password: 'password', name: 'Grace Okafor (OPD Registrar)', role: 'OPD Clerk', department: 'OPD', email: 'opd@zmc.com', status: 'Active' },
      'iclinic': { id: 'compat-user-iclinic', username: 'iclinic', password: 'password', name: 'Dr. Clara Vance (Eye Clinic)', role: 'Eye Clinic', department: 'Eye Clinic', email: 'iclinic@zmc.com', status: 'Active' }
    };

    const preset = standardUsersPreset[cleanUsername];
    if (preset) {
      return {
        ...preset,
        last_login: null,
        created_at: new Date().toISOString(),
        created_by: 'system'
      };
    }

    return null;
  }

  public async updateLastLogin(userId: string): Promise<void> {
    try {
      await query('UPDATE zmc_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
    } catch (err) {
      console.warn('Failed to update last_login timestamp:', err);
    }
  }

  public async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    try {
      await query('UPDATE zmc_users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    } catch (err) {
      console.warn('Failed to update password hash:', err);
    }
  }

  public async recordAuditLog(log: { userId: string; userName: string; userRole: string; action: string; details: string; ipAddress?: string }): Promise<void> {
    try {
      const id = `audit-${crypto.randomUUID()}`;
      await query(
        `INSERT INTO zmc_audit_logs (id, user_id, user_name, user_role, action, details, timestamp, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
        [id, log.userId, log.userName, log.userRole, log.action, log.details, log.ipAddress || '127.0.0.1']
      );
    } catch (err) {
      console.warn('Failed to record login audit log:', err);
    }
  }
}

