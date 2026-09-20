import bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { USER_MESSAGES } from './users.constants';
import { query } from '../../database/db.repo';
import crypto from 'crypto';

export class UsersService {
  private repo = new UsersRepository();

  private async logAudit(action: string, details: string, actorName = 'IT Administrator', actorRole = 'IT Administrator') {
    try {
      const id = `audit-${crypto.randomUUID()}`;
      await query(
        `INSERT INTO zmc_audit_logs (id, user_id, user_name, user_role, action, details, timestamp, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
        [id, 'it-admin', actorName, actorRole, action, details, '127.0.0.1']
      );
    } catch (err) {
      console.warn('Audit log write error:', err);
    }
  }

  public async getAllUsers(): Promise<any[]> {
    return this.repo.findAll();
  }

  public async getUserById(id: string): Promise<any> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new Error(USER_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  public async createUser(user: any): Promise<any> {
    // Check if username already exists
    const existingUsername = await this.repo.findByUsername(user.username);
    if (existingUsername) {
      throw new Error(USER_MESSAGES.USERNAME_EXISTS);
    }

    // Check if email already exists
    if (user.email) {
      const existingEmail = await this.repo.findByEmail(user.email);
      if (existingEmail) {
        throw new Error(USER_MESSAGES.EMAIL_EXISTS);
      }
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userToSave = {
      ...user,
      password: hashedPassword,
    };

    const created = await this.repo.create(userToSave);
    await this.logAudit('User Created', `Created user "${created.username}" (${created.name}, ${created.role})`);
    return created;
  }

  public async updateUser(id: string, updates: any): Promise<any> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new Error(USER_MESSAGES.NOT_FOUND);
    }

    if (updates.username) {
      const existing = await this.repo.findByUsername(updates.username);
      if (existing && existing.id !== id) {
        throw new Error(USER_MESSAGES.USERNAME_EXISTS);
      }
    }

    if (updates.email) {
      const existing = await this.repo.findByEmail(updates.email);
      if (existing && existing.id !== id) {
        throw new Error(USER_MESSAGES.EMAIL_EXISTS);
      }
    }

    const dataToSave = { ...updates };
    if (updates.password) {
      dataToSave.password = await bcrypt.hash(updates.password, 10);
    }

    const result = await this.repo.update(id, dataToSave);
    
    if (updates.password) {
      await this.logAudit('Password Reset', `Password reset for user "${user.username}"`);
    }
    if (updates.status && updates.status !== user.status) {
      if (updates.status === 'Active') {
        await this.logAudit('User Reactivated', `Reactivated user "${user.username}"`);
      } else {
        await this.logAudit('User Deactivated', `Deactivated user "${user.username}"`);
      }
    }

    return result;
  }

  public async deleteUser(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new Error(USER_MESSAGES.CANNOT_DELETE_SELF);
    }

    const user = await this.repo.findById(id);
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw new Error(USER_MESSAGES.NOT_FOUND);
    }

    await this.logAudit('User Deleted', `Deleted user account "${user?.username || id}"`);
  }
}
