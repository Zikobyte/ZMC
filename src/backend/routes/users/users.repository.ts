import { query, generateUUID, getDB } from '../../database/db.repo';

export class UsersRepository {
  public async findAll(): Promise<any[]> {
    try {
      const res = await query(`
        SELECT id, username, name, role, department, email, status, last_login, created_at, created_by 
        FROM zmc_users 
        ORDER BY 
          created_at DESC NULLS LAST,
          name ASC
      `);
      if (res && Array.isArray(res.rows) && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      // Fall back to memory DB
    }

    const db = getDB();
    const users = db.users || [];
    return [...users].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    }).map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      department: u.department || '',
      email: u.email || '',
      status: u.status || 'Active',
      last_login: u.last_login || null,
      created_at: u.created_at || null,
      created_by: u.created_by || 'admin'
    }));
  }

  public async findById(id: string): Promise<any | null> {
    try {
      const res = await query(`
        SELECT id, username, name, role, department, email, status, last_login, created_at, created_by 
        FROM zmc_users 
        WHERE id = $1
      `, [id]);
      if (res && res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch (err) {}

    const db = getDB();
    const found = (db.users || []).find(u => u.id === id);
    if (!found) return null;
    return {
      id: found.id,
      username: found.username,
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

  public async findByUsername(username: string): Promise<any | null> {
    try {
      const res = await query('SELECT * FROM zmc_users WHERE LOWER(username) = LOWER($1)', [username]);
      if (res && res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch (err) {}

    const db = getDB();
    const cleanUser = (username || '').toLowerCase().trim();
    const found = (db.users || []).find(u => u.username?.toLowerCase().trim() === cleanUser);
    return found || null;
  }

  public async findByEmail(email: string): Promise<any | null> {
    try {
      const res = await query('SELECT * FROM zmc_users WHERE LOWER(email) = LOWER($1)', [email]);
      if (res && res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch (err) {}

    const db = getDB();
    const cleanEmail = (email || '').toLowerCase().trim();
    const found = (db.users || []).find(u => u.email?.toLowerCase().trim() === cleanEmail);
    return found || null;
  }

  public async create(user: any): Promise<any> {
    const id = generateUUID();
    const status = user.status || 'Active';
    const createdBy = user.created_by || 'admin';
    const nowIso = new Date().toISOString();

    let createdRecord: any = null;
    try {
      const res = await query(
        `INSERT INTO zmc_users (id, username, password, name, role, department, email, status, created_at, created_by, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, NULL)
         RETURNING id, username, name, role, department, email, status, last_login, created_at, created_by`,
        [
          id,
          user.username,
          user.password,
          user.name,
          user.role,
          user.department || null,
          user.email || null,
          status,
          createdBy
        ]
      );
      if (res && res.rows && res.rows[0]) {
        createdRecord = res.rows[0];
      }
    } catch (err) {
      console.warn('Postgres insert error in UsersRepository, storing in memory cache:', err);
    }

    // Always update in-memory cache as well, prepending to top
    const db = getDB();
    if (!db.users) db.users = [];
    const memoryUser = {
      id,
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
      department: user.department || '',
      email: user.email || '',
      status,
      last_login: null,
      created_at: nowIso,
      created_by: createdBy
    };
    db.users.unshift(memoryUser);

    return createdRecord || {
      id: memoryUser.id,
      username: memoryUser.username,
      name: memoryUser.name,
      role: memoryUser.role,
      department: memoryUser.department,
      email: memoryUser.email,
      status: memoryUser.status,
      last_login: memoryUser.last_login,
      created_at: memoryUser.created_at,
      created_by: memoryUser.created_by
    };
  }

  public async update(id: string, updates: any): Promise<any | null> {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) {
      return this.findById(id);
    }

    let updatedRecord: any = null;
    try {
      const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      const values = fields.map(f => updates[f]);
      const res = await query(
        `UPDATE zmc_users SET ${setClause} WHERE id = $1 RETURNING id, username, name, role, department, email, status, last_login, created_at, created_by`,
        [id, ...values]
      );
      if (res && res.rows && res.rows[0]) {
        updatedRecord = res.rows[0];
      }
    } catch (err) {}

    const db = getDB();
    if (db.users) {
      const idx = db.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updates };
        if (!updatedRecord) {
          updatedRecord = {
            id: db.users[idx].id,
            username: db.users[idx].username,
            name: db.users[idx].name,
            role: db.users[idx].role,
            department: db.users[idx].department || '',
            email: db.users[idx].email || '',
            status: db.users[idx].status || 'Active',
            last_login: db.users[idx].last_login || null,
            created_at: db.users[idx].created_at || null,
            created_by: db.users[idx].created_by || 'admin'
          };
        }
      }
    }

    return updatedRecord || this.findById(id);
  }

  public async delete(id: string): Promise<boolean> {
    let deleted = false;
    try {
      const res = await query('DELETE FROM zmc_users WHERE id = $1', [id]);
      deleted = (res.rowCount ?? 0) > 0;
    } catch (err) {}

    const db = getDB();
    if (db.users) {
      const initialLen = db.users.length;
      db.users = db.users.filter(u => u.id !== id);
      if (db.users.length < initialLen) {
        deleted = true;
      }
    }
    return deleted;
  }
}

