import { Router, Response } from 'express';
import { authenticateJWT, AuthenticatedRequest, authorizeRoles } from '../../middleware/auth.middleware';
import { getPostgresPool, getDB, generateUUID, query, refreshCache } from '../../database/db.repo';

export const hrRoutes = Router();

// Protect all HR routes with JWT authentication
hrRoutes.use(authenticateJWT as any);

// Helper to record audit logs
async function recordAudit(userId: string, userName: string, userRole: string, action: string, details: string) {
  try {
    const pool = getPostgresPool();
    const id = generateUUID();
    const now = new Date().toISOString();
    if (pool) {
      await pool.query(`
        INSERT INTO zmc_audit_logs (id, timestamp, user_id, user_name, user_role, action, details, ip_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [id, now, userId, userName, userRole, action, details, '127.0.0.1']);
    } else {
      const db = getDB();
      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.push({ id, timestamp: now, userId, userName, userRole, action, details, ipAddress: '127.0.0.1' });
    }
  } catch (err: any) {
    console.error('Failed to record audit log:', err.message);
  }
}

// -------------------------------------------------------------
// 1. HR DASHBOARD STATS
// -------------------------------------------------------------
hrRoutes.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = getPostgresPool();
    if (pool) {
      // 1. Total employees
      const empRes = await pool.query('SELECT * FROM zmc_employees');
      const employees = empRes.rows;

      // 2. Open positions
      const jobRes = await pool.query("SELECT COUNT(*) as count FROM zmc_job_openings WHERE status = 'Open'");
      const openPositions = parseInt(jobRes.rows[0]?.count || '0', 10);

      // 3. Total candidates
      const candRes = await pool.query('SELECT COUNT(*) as count FROM zmc_candidates');
      const totalCandidates = parseInt(candRes.rows[0]?.count || '0', 10);

      // 4. Total procurements
      const procCountRes = await pool.query('SELECT COUNT(*) as count FROM zmc_procurements');
      const totalProcurements = parseInt(procCountRes.rows[0]?.count || '0', 10);

      // 5. Employee distribution by role
      // Doctors, Nurses, Pharmacists, Security, Day Workers, Night Workers
      const doctors = employees.filter(e => (e.role || '').toLowerCase().includes('doctor')).length;
      const nurses = employees.filter(e => (e.role || '').toLowerCase().includes('nurse')).length;
      const pharmacists = employees.filter(e => (e.role || '').toLowerCase().includes('pharmacist')).length;
      const security = employees.filter(e => {
        const r = (e.role || '').toLowerCase();
        return r.includes('security') || r.includes('guard');
      }).length;
      const dayWorkers = employees.filter(e => {
        const s = (e.shift || '').toLowerCase();
        const r = (e.role || '').toLowerCase();
        return s === 'day' || r.includes('day');
      }).length;
      const nightWorkers = employees.filter(e => {
        const s = (e.shift || '').toLowerCase();
        const r = (e.role || '').toLowerCase();
        return s === 'night' || r.includes('night');
      }).length;

      // 6. Recent Procurements Table
      // Columns: Date, Items, Amount, Status
      const procRes = await pool.query(`
        SELECT 
          id,
          COALESCE(date::text, to_char(date_ordered, 'YYYY-MM-DD')) as date,
          COALESCE(items, item_name) as items,
          item_name,
          COALESCE(amount, (quantity * unit_price), 0)::numeric as amount,
          status,
          department,
          supplier_name,
          requested_by,
          date_ordered
        FROM zmc_procurements 
        ORDER BY date_ordered DESC, date DESC 
        LIMIT 10
      `);

      return res.json({
        success: true,
        data: {
          totalEmployees: employees.length,
          openPositions,
          totalCandidates,
          totalProcurements,
          roleDistribution: {
            doctors,
            nurses,
            pharmacists,
            security,
            dayWorkers,
            nightWorkers
          },
          recentProcurements: procRes.rows.map(r => ({
            id: r.id,
            date: r.date || new Date(r.date_ordered).toISOString().split('T')[0],
            items: r.items || r.item_name || 'Medical Equipment',
            item_name: r.item_name,
            amount: parseFloat(r.amount) || 0,
            status: r.status || 'Delivered',
            department: r.department || 'General Hospital',
            supplier_name: r.supplier_name || 'Medical Supplier',
            requested_by: r.requested_by || 'HR / Procurement'
          }))
        }
      });
    }

    // In-memory fallback
    const db = getDB();
    const employees = db.employees || [];
    const openPositions = (db.jobOpenings || []).filter(j => j.status === 'Open').length;
    const totalCandidates = (db.candidates || []).length;
    const totalProcurements = (db.procurements || []).length;

    const doctors = employees.filter(e => (e.role || '').toLowerCase().includes('doctor')).length;
    const nurses = employees.filter(e => (e.role || '').toLowerCase().includes('nurse')).length;
    const pharmacists = employees.filter(e => (e.role || '').toLowerCase().includes('pharmacist')).length;
    const security = employees.filter(e => {
      const r = (e.role || '').toLowerCase();
      return r.includes('security') || r.includes('guard');
    }).length;
    const dayWorkers = employees.filter(e => {
      const s = (e.shift || '').toLowerCase();
      const r = (e.role || '').toLowerCase();
      return s === 'day' || r.includes('day');
    }).length;
    const nightWorkers = employees.filter(e => {
      const s = (e.shift || '').toLowerCase();
      const r = (e.role || '').toLowerCase();
      return s === 'night' || r.includes('night');
    }).length;

    const recentProcurements = (db.procurements || []).slice(0, 10).map(r => ({
      id: r.id,
      date: r.date || (r.date_ordered ? r.date_ordered.split(' ')[0] : new Date().toISOString().split('T')[0]),
      items: r.items || r.item_name || 'Medical Consumables',
      item_name: r.item_name,
      amount: parseFloat(r.amount || (r.quantity * r.unit_price) || 0),
      status: r.status || 'Delivered',
      department: r.department || 'General Hospital',
      supplier_name: r.supplier_name || 'Medical Supplier',
      requested_by: r.requested_by || 'HR Department'
    }));

    return res.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        openPositions,
        totalCandidates,
        totalProcurements,
        roleDistribution: {
          doctors,
          nurses,
          pharmacists,
          security,
          dayWorkers,
          nightWorkers
        },
        recentProcurements
      }
    });
  } catch (err: any) {
    console.error('Error in HR dashboard stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2. EMPLOYEES ENDPOINTS
// -------------------------------------------------------------
hrRoutes.get('/employees', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, role, shift, department, status } = req.query;
    const pool = getPostgresPool();

    if (pool) {
      let queryText = 'SELECT * FROM zmc_employees WHERE 1=1';
      const params: any[] = [];

      if (search) {
        params.push(`%${search}%`);
        queryText += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR role ILIKE $${params.length} OR department ILIKE $${params.length})`;
      }
      if (role) {
        params.push(role);
        queryText += ` AND role = $${params.length}`;
      }
      if (shift) {
        params.push(shift);
        queryText += ` AND shift = $${params.length}`;
      }
      if (department) {
        params.push(department);
        queryText += ` AND department = $${params.length}`;
      }
      if (status) {
        params.push(status);
        queryText += ` AND status = $${params.length}`;
      }

      queryText += ' ORDER BY created_at DESC, name ASC';
      const result = await pool.query(queryText, params);
      return res.json({ success: true, data: result.rows });
    }

    const db = getDB();
    let emps = [...(db.employees || [])];
    if (search) {
      const q = (search as string).toLowerCase();
      emps = emps.filter(e => e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q));
    }
    if (role) emps = emps.filter(e => e.role === role);
    if (shift) emps = emps.filter(e => e.shift === shift);
    if (department) emps = emps.filter(e => e.department === department);
    if (status) emps = emps.filter(e => e.status === status);

    return res.json({ success: true, data: emps });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.post('/employees', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, role, department, email, phone, shift, status, salary, hire_date, date_joined, documents_count } = req.body;
    if (!name || !role) {
      return res.status(400).json({ success: false, error: 'Employee name and role are required' });
    }

    const id = generateUUID();
    const dateJoined = date_joined || hire_date || new Date().toISOString().split('T')[0];
    const hireDate = hire_date || dateJoined;
    let shiftVal = shift || 'Day';
    if (role.toLowerCase().includes('night')) shiftVal = 'Night';
    if (role.toLowerCase().includes('day')) shiftVal = 'Day';
    const statusVal = status || 'Active';
    const salaryVal = parseFloat(salary) || 0;
    const docsCount = parseInt(documents_count, 10) || 0;

    let dept = department;
    if (!dept) {
      if (role.toLowerCase().includes('doctor')) dept = 'Medical';
      else if (role.toLowerCase().includes('nurse')) dept = 'Nursing';
      else if (role.toLowerCase().includes('pharmacist')) dept = 'Pharmacy';
      else if (role.toLowerCase().includes('security')) dept = 'Security & Safety';
      else if (role.toLowerCase().includes('day') || role.toLowerCase().includes('night')) dept = 'Operations & Maintenance';
      else dept = 'General';
    }

    const pool = getPostgresPool();
    if (pool) {
      const insertRes = await pool.query(`
        INSERT INTO zmc_employees (id, name, role, department, email, phone, shift, status, salary, hire_date, date_joined, documents_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [id, name, role, dept, email || '', phone || '', shiftVal, statusVal, salaryVal, hireDate, dateJoined, docsCount]);

      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'HR User', req.user?.role || 'HR Manager', 'EMPLOYEE_CREATED', `Added new employee ${name} (${role}, ${dept})`);

      return res.status(201).json({ success: true, data: insertRes.rows[0] });
    }

    const newEmp = {
      id,
      name,
      role,
      department: dept,
      email: email || '',
      phone: phone || '',
      shift: shiftVal,
      status: statusVal,
      salary: salaryVal,
      hire_date: hireDate,
      date_joined: dateJoined,
      documents_count: docsCount,
      created_at: new Date().toISOString()
    };
    const db = getDB();
    if (!db.employees) db.employees = [];
    db.employees.unshift(newEmp);

    await recordAudit(req.user?.id || 'system', req.user?.name || 'HR User', req.user?.role || 'HR Manager', 'EMPLOYEE_CREATED', `Added new employee ${name} (${role}, ${dept})`);
    return res.status(201).json({ success: true, data: newEmp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.patch('/employees/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, department, email, phone, shift, status, salary, hire_date } = req.body;

    const pool = getPostgresPool();
    if (pool) {
      const updateRes = await pool.query(`
        UPDATE zmc_employees
        SET 
          name = COALESCE($1, name),
          role = COALESCE($2, role),
          department = COALESCE($3, department),
          email = COALESCE($4, email),
          phone = COALESCE($5, phone),
          shift = COALESCE($6, shift),
          status = COALESCE($7, status),
          salary = COALESCE($8, salary),
          hire_date = COALESCE($9, hire_date)
        WHERE id = $10
        RETURNING *
      `, [name, role, department, email, phone, shift, status, salary ? parseFloat(salary) : undefined, hire_date, id]);

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'HR User', req.user?.role || 'HR Manager', 'EMPLOYEE_UPDATED', `Updated employee ${updateRes.rows[0].name} (${id})`);

      return res.json({ success: true, data: updateRes.rows[0] });
    }

    const db = getDB();
    const idx = (db.employees || []).findIndex(e => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    db.employees[idx] = {
      ...db.employees[idx],
      ...(name && { name }),
      ...(role && { role }),
      ...(department && { department }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(shift && { shift }),
      ...(status && { status }),
      ...(salary !== undefined && { salary: parseFloat(salary) }),
      ...(hire_date && { hire_date })
    };

    return res.json({ success: true, data: db.employees[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.delete('/employees/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();
    if (pool) {
      const delRes = await pool.query('DELETE FROM zmc_employees WHERE id = $1 RETURNING name', [id]);
      if (delRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }
      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'HR User', req.user?.role || 'HR Manager', 'EMPLOYEE_DELETED', `Deleted employee ${delRes.rows[0].name} (${id})`);
      return res.json({ success: true, message: 'Employee removed successfully' });
    }

    const db = getDB();
    const idx = (db.employees || []).findIndex(e => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    const empName = db.employees[idx].name;
    db.employees.splice(idx, 1);
    await recordAudit(req.user?.id || 'system', req.user?.name || 'HR User', req.user?.role || 'HR Manager', 'EMPLOYEE_DELETED', `Deleted employee ${empName} (${id})`);
    return res.json({ success: true, message: 'Employee removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. ABSENCES & LEAVE REQUESTS
// -------------------------------------------------------------
hrRoutes.get('/absences', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, timeframe } = req.query;
    const pool = getPostgresPool();
    if (pool) {
      let q = `SELECT id, employee_id, employee_name, department, leave_type, 
               COALESCE(date::text, start_date::text, to_char(applied_at, 'YYYY-MM-DD')) as date, 
               start_date, end_date, days_count, reason, status, applied_at, reviewed_by, reviewed_at, comments 
               FROM zmc_absences`;
      const params: any[] = [];
      if (status) {
        params.push(status);
        q += ' WHERE status = $1';
      }
      q += ' ORDER BY COALESCE(date, start_date, applied_at::date) DESC, applied_at DESC';
      const result = await pool.query(q, params);
      return res.json({ success: true, data: result.rows });
    }

    const db = getDB();
    let abs = [...(db.absences || [])];
    if (status) {
      abs = abs.filter(a => a.status === status);
    }
    return res.json({ success: true, data: abs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.post('/absences', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employee_id, employee_name, department, leave_type, date, start_date, end_date, days_count, reason, status } = req.body;
    if (!employee_name) {
      return res.status(400).json({ success: false, error: 'Employee name is required' });
    }

    const effectiveDate = date || start_date || new Date().toISOString().split('T')[0];
    const effectiveStartDate = start_date || effectiveDate;
    const effectiveEndDate = end_date || effectiveDate;
    const effectiveStatus = status || leave_type || 'Sick Leave';
    const effectiveLeaveType = leave_type || status || 'Sick Leave';
    const id = generateUUID();
    const days = parseInt(days_count, 10) || 1;
    const pool = getPostgresPool();

    if (pool) {
      const insertRes = await pool.query(`
        INSERT INTO zmc_absences (id, employee_id, employee_name, department, leave_type, date, start_date, end_date, days_count, reason, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [id, employee_id || generateUUID(), employee_name, department || 'General', effectiveLeaveType, effectiveDate, effectiveStartDate, effectiveEndDate, days, reason || '', effectiveStatus]);

      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'Staff', req.user?.role || 'Staff', 'ABSENCE_RECORDED', `Recorded absence for ${employee_name} (${effectiveStatus}: ${reason || 'N/A'})`);
      return res.status(201).json({ success: true, data: insertRes.rows[0] });
    }

    const newAbs = {
      id,
      employee_id: employee_id || generateUUID(),
      employee_name,
      department: department || 'General',
      leave_type: effectiveLeaveType,
      date: effectiveDate,
      start_date: effectiveStartDate,
      end_date: effectiveEndDate,
      days_count: days,
      reason: reason || '',
      status: effectiveStatus,
      applied_at: new Date().toISOString()
    };
    const db = getDB();
    if (!db.absences) db.absences = [];
    db.absences.unshift(newAbs);

    return res.status(201).json({ success: true, data: newAbs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.delete('/absences/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();

    if (pool) {
      await pool.query('DELETE FROM zmc_absences WHERE id = $1', [id]);
      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'Staff', req.user?.role || 'Staff', 'ABSENCE_DELETED', `Deleted absence record ${id}`);
      return res.json({ success: true, message: 'Absence record deleted successfully' });
    }

    const db = getDB();
    if (db.absences) {
      db.absences = db.absences.filter(a => a.id !== id);
    }
    return res.json({ success: true, message: 'Absence record deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.patch('/absences/:id/status', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status required (Approved / Rejected)' });
    }

    const reviewer = req.user?.name || req.user?.username || 'HR Manager';
    const pool = getPostgresPool();

    if (pool) {
      const updateRes = await pool.query(`
        UPDATE zmc_absences
        SET 
          status = $1,
          reviewed_by = $2,
          reviewed_at = CURRENT_TIMESTAMP,
          comments = COALESCE($3, comments)
        WHERE id = $4
        RETURNING *
      `, [status, reviewer, comments, id]);

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Absence request not found' });
      }

      await refreshCache();
      await recordAudit(req.user?.id || 'system', reviewer, req.user?.role || 'HR Manager', `LEAVE_${status.toUpperCase()}`, `${status} leave for ${updateRes.rows[0].employee_name}`);
      return res.json({ success: true, data: updateRes.rows[0] });
    }

    const db = getDB();
    const idx = (db.absences || []).findIndex(a => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Absence request not found' });
    }
    db.absences[idx].status = status;
    db.absences[idx].reviewed_by = reviewer;
    db.absences[idx].reviewed_at = new Date().toISOString();
    if (comments) db.absences[idx].comments = comments;

    return res.json({ success: true, data: db.absences[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. RECRUITMENT (JOB OPENINGS & CANDIDATES)
// -------------------------------------------------------------
hrRoutes.get('/recruitment/jobs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = getPostgresPool();
    if (pool) {
      const resData = await pool.query('SELECT * FROM zmc_job_openings ORDER BY posted_date DESC');
      return res.json({ success: true, data: resData.rows });
    }
    const db = getDB();
    return res.json({ success: true, data: db.jobOpenings || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.post('/recruitment/jobs', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, department, openings_count, employment_type, status, experience_required, description } = req.body;
    if (!title || !department) {
      return res.status(400).json({ success: false, error: 'Job title and department are required' });
    }

    const id = generateUUID();
    const openings = parseInt(openings_count, 10) || 1;
    const pool = getPostgresPool();

    if (pool) {
      const insertRes = await pool.query(`
        INSERT INTO zmc_job_openings (id, title, department, openings_count, employment_type, status, experience_required, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [id, title, department, openings, employment_type || 'Full-time', status || 'Open', experience_required || '', description || '']);

      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'HR', req.user?.role || 'HR Manager', 'JOB_OPENING_CREATED', `Created opening: ${title} (${openings} slots)`);
      return res.status(201).json({ success: true, data: insertRes.rows[0] });
    }

    const newJob = {
      id,
      title,
      department,
      openings_count: openings,
      employment_type: employment_type || 'Full-time',
      status: status || 'Open',
      experience_required: experience_required || '',
      description: description || '',
      posted_date: new Date().toISOString().split('T')[0]
    };
    const db = getDB();
    if (!db.jobOpenings) db.jobOpenings = [];
    db.jobOpenings.unshift(newJob);
    return res.status(201).json({ success: true, data: newJob });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.patch('/recruitment/jobs/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, department, openings_count, employment_type, status, experience_required, description } = req.body;

    const pool = getPostgresPool();
    if (pool) {
      const updateRes = await pool.query(`
        UPDATE zmc_job_openings
        SET 
          title = COALESCE($1, title),
          department = COALESCE($2, department),
          openings_count = COALESCE($3, openings_count),
          employment_type = COALESCE($4, employment_type),
          status = COALESCE($5, status),
          experience_required = COALESCE($6, experience_required),
          description = COALESCE($7, description)
        WHERE id = $8
        RETURNING *
      `, [title, department, openings_count ? parseInt(openings_count, 10) : undefined, employment_type, status, experience_required, description, id]);

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Job opening not found' });
      }

      await refreshCache();
      return res.json({ success: true, data: updateRes.rows[0] });
    }

    const db = getDB();
    const idx = (db.jobOpenings || []).findIndex(j => j.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Job opening not found' });
    db.jobOpenings[idx] = { ...db.jobOpenings[idx], ...req.body };
    return res.json({ success: true, data: db.jobOpenings[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.delete('/recruitment/jobs/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();
    if (pool) {
      await pool.query('DELETE FROM zmc_job_openings WHERE id = $1', [id]);
      await refreshCache();
      return res.json({ success: true, message: 'Job opening deleted' });
    }
    const db = getDB();
    db.jobOpenings = (db.jobOpenings || []).filter(j => j.id !== id);
    return res.json({ success: true, message: 'Job opening deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Candidates
hrRoutes.get('/recruitment/candidates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { stage, job_id } = req.query;
    const pool = getPostgresPool();
    if (pool) {
      let q = 'SELECT * FROM zmc_candidates WHERE 1=1';
      const params: any[] = [];
      if (stage) {
        params.push(stage);
        q += ` AND stage = $${params.length}`;
      }
      if (job_id) {
        params.push(job_id);
        q += ` AND job_id = $${params.length}`;
      }
      q += ' ORDER BY applied_date DESC';
      const result = await pool.query(q, params);
      return res.json({ success: true, data: result.rows });
    }

    const db = getDB();
    let cands = [...(db.candidates || [])];
    if (stage) cands = cands.filter(c => c.stage === stage);
    if (job_id) cands = cands.filter(c => c.job_id === job_id);
    return res.json({ success: true, data: cands });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.post('/recruitment/candidates', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { job_id, job_title, candidate_name, email, phone, role_applied, stage, experience_years, notes, rating } = req.body;
    if (!candidate_name) {
      return res.status(400).json({ success: false, error: 'Candidate name is required' });
    }

    const id = generateUUID();
    const exp = parseInt(experience_years, 10) || 0;
    const rate = parseInt(rating, 10) || 3;
    const stageVal = stage || 'Applied';

    const pool = getPostgresPool();
    if (pool) {
      const insertRes = await pool.query(`
        INSERT INTO zmc_candidates (id, job_id, job_title, candidate_name, email, phone, role_applied, stage, experience_years, notes, rating)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [id, job_id || null, job_title || '', candidate_name, email || '', phone || '', role_applied || '', stageVal, exp, notes || '', rate]);

      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'HR', req.user?.role || 'HR Manager', 'CANDIDATE_ADDED', `Logged applicant ${candidate_name} for ${job_title || role_applied}`);
      return res.status(201).json({ success: true, data: insertRes.rows[0] });
    }

    const newCand = {
      id,
      job_id,
      job_title,
      candidate_name,
      email: email || '',
      phone: phone || '',
      role_applied: role_applied || '',
      stage: stageVal,
      experience_years: exp,
      applied_date: new Date().toISOString().split('T')[0],
      notes: notes || '',
      rating: rate
    };
    const db = getDB();
    if (!db.candidates) db.candidates = [];
    db.candidates.unshift(newCand);
    return res.status(201).json({ success: true, data: newCand });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.patch('/recruitment/candidates/:id/stage', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, notes, rating } = req.body;
    if (!stage) return res.status(400).json({ success: false, error: 'Stage is required' });

    const pool = getPostgresPool();
    if (pool) {
      const updateRes = await pool.query(`
        UPDATE zmc_candidates
        SET 
          stage = $1,
          notes = COALESCE($2, notes),
          rating = COALESCE($3, rating)
        WHERE id = $4
        RETURNING *
      `, [stage, notes, rating ? parseInt(rating, 10) : undefined, id]);

      if (updateRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Candidate not found' });
      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'HR', req.user?.role || 'HR Manager', 'CANDIDATE_STAGE_UPDATED', `Moved candidate ${updateRes.rows[0].candidate_name} to ${stage}`);
      return res.json({ success: true, data: updateRes.rows[0] });
    }

    const db = getDB();
    const idx = (db.candidates || []).findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Candidate not found' });
    db.candidates[idx].stage = stage;
    if (notes) db.candidates[idx].notes = notes;
    if (rating) db.candidates[idx].rating = parseInt(rating, 10);
    return res.json({ success: true, data: db.candidates[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.delete('/recruitment/candidates/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();
    if (pool) {
      await pool.query('DELETE FROM zmc_candidates WHERE id = $1', [id]);
      await refreshCache();
      return res.json({ success: true, message: 'Candidate deleted' });
    }
    const db = getDB();
    db.candidates = (db.candidates || []).filter(c => c.id !== id);
    return res.json({ success: true, message: 'Candidate deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. PROCUREMENTS ENDPOINTS
// -------------------------------------------------------------
hrRoutes.get('/procurements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const pool = getPostgresPool();
    if (pool) {
      let q = `
        SELECT 
          id,
          COALESCE(date::text, to_char(date_ordered, 'YYYY-MM-DD')) as date,
          COALESCE(items, item_name) as items,
          item_name,
          COALESCE(quantity, 1) as quantity,
          COALESCE(unit_price, 0)::numeric as unit_price,
          COALESCE(amount, (quantity * unit_price), 0)::numeric as amount,
          status,
          department,
          supplier_name,
          requested_by,
          date_ordered,
          category
        FROM zmc_procurements
        WHERE 1=1
      `;
      const params: any[] = [];
      if (status) {
        params.push(status);
        q += ` AND status = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        q += ` AND (item_name ILIKE $${params.length} OR items ILIKE $${params.length} OR supplier_name ILIKE $${params.length} OR department ILIKE $${params.length})`;
      }
      q += ' ORDER BY date_ordered DESC, date DESC';
      const result = await pool.query(q, params);
      return res.json({
        success: true,
        data: result.rows.map(r => ({
          id: r.id,
          date: r.date || new Date(r.date_ordered).toISOString().split('T')[0],
          items: r.items || r.item_name || 'Medical Consumables',
          item_name: r.item_name,
          quantity: r.quantity,
          unit_price: parseFloat(r.unit_price) || 0,
          amount: parseFloat(r.amount) || 0,
          status: r.status || 'Delivered',
          department: r.department || 'Hospital General',
          supplier_name: r.supplier_name || 'Vendor',
          requested_by: r.requested_by || 'HR / Procurement',
          category: r.category || 'Medical Supplies'
        }))
      });
    }

    const db = getDB();
    let procs = [...(db.procurements || [])];
    if (status) procs = procs.filter(p => p.status === status);
    if (search) {
      const s = (search as string).toLowerCase();
      procs = procs.filter(p => p.item_name?.toLowerCase().includes(s) || p.items?.toLowerCase().includes(s) || p.supplier_name?.toLowerCase().includes(s));
    }
    return res.json({ success: true, data: procs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.post('/procurements', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager', 'Account Officer', 'Accountant']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { item_name, items, quantity, unit_price, amount, department, supplier_name, requested_by, status, date, category } = req.body;
    if (!item_name && !items) {
      return res.status(400).json({ success: false, error: 'Item description is required' });
    }

    const id = generateUUID();
    const qty = parseInt(quantity, 10) || 1;
    const unitPrice = parseFloat(unit_price) || 0;
    const totalAmount = parseFloat(amount) || (qty * unitPrice) || 0;
    const reqDate = date || new Date().toISOString().split('T')[0];
    const statusVal = status || 'Ordered';

    const pool = getPostgresPool();
    if (pool) {
      const insertRes = await pool.query(`
        INSERT INTO zmc_procurements (id, item_name, items, quantity, unit_price, amount, department, supplier_name, requested_by, status, date, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [id, item_name || items, items || item_name, qty, unitPrice, totalAmount, department || 'General Hospital', supplier_name || 'Medical Vendor', requested_by || req.user?.name || 'HR', statusVal, reqDate, category || 'Medical Supplies']);

      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'HR User', req.user?.role || 'HR Manager', 'PROCUREMENT_LOGGED', `Procurement recorded: ${item_name || items} (₦${totalAmount.toLocaleString()})`);
      return res.status(201).json({ success: true, data: insertRes.rows[0] });
    }

    const newProc = {
      id,
      item_name: item_name || items,
      items: items || item_name,
      quantity: qty,
      unit_price: unitPrice,
      amount: totalAmount,
      department: department || 'General Hospital',
      supplier_name: supplier_name || 'Medical Vendor',
      requested_by: requested_by || req.user?.name || 'HR',
      status: statusVal,
      date: reqDate,
      category: category || 'Medical Supplies',
      date_ordered: new Date().toISOString()
    };
    const db = getDB();
    if (!db.procurements) db.procurements = [];
    db.procurements.unshift(newProc);

    return res.status(201).json({ success: true, data: newProc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.patch('/procurements/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager', 'Account Officer']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, amount, items, supplier_name } = req.body;

    const pool = getPostgresPool();
    if (pool) {
      const updateRes = await pool.query(`
        UPDATE zmc_procurements
        SET 
          status = COALESCE($1, status),
          amount = COALESCE($2, amount),
          items = COALESCE($3, items),
          supplier_name = COALESCE($4, supplier_name)
        WHERE id = $5
        RETURNING *
      `, [status, amount ? parseFloat(amount) : undefined, items, supplier_name, id]);

      if (updateRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Procurement not found' });
      await refreshCache();
      return res.json({ success: true, data: updateRes.rows[0] });
    }

    const db = getDB();
    const idx = (db.procurements || []).findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Procurement not found' });
    db.procurements[idx] = { ...db.procurements[idx], ...req.body };
    return res.json({ success: true, data: db.procurements[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.delete('/procurements/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();
    if (pool) {
      await pool.query('DELETE FROM zmc_procurements WHERE id = $1', [id]);
      await refreshCache();
      return res.json({ success: true, message: 'Procurement deleted' });
    }
    const db = getDB();
    db.procurements = (db.procurements || []).filter(p => p.id !== id);
    return res.json({ success: true, message: 'Procurement deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. DISCOUNTS & STAFF WELFARE
// -------------------------------------------------------------
hrRoutes.get('/discounts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = getPostgresPool();
    if (pool) {
      const result = await pool.query('SELECT * FROM zmc_discounts ORDER BY created_at DESC');
      return res.json({ success: true, data: result.rows });
    }
    const db = getDB();
    return res.json({ success: true, data: db.discounts || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.post('/discounts', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, discount_code, category, percentage, fixed_amount, applicable_service, authorized_by, status, description } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Discount title is required' });

    const id = generateUUID();
    const pct = parseInt(percentage, 10) || 0;
    const fixed = parseFloat(fixed_amount) || 0;

    const pool = getPostgresPool();
    if (pool) {
      const insertRes = await pool.query(`
        INSERT INTO zmc_discounts (id, title, discount_code, category, percentage, fixed_amount, applicable_service, authorized_by, status, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [id, title, discount_code || '', category || 'Staff Benefit', pct, fixed, applicable_service || 'All Services', authorized_by || 'HR Management', status || 'Active', description || '']);

      await refreshCache();
      await recordAudit(req.user?.id || 'system', req.user?.name || 'HR', req.user?.role || 'HR Manager', 'DISCOUNT_POLICY_CREATED', `Created discount policy ${title} (${pct}%)`);
      return res.status(201).json({ success: true, data: insertRes.rows[0] });
    }

    const newDisc = {
      id,
      title,
      discount_code: discount_code || '',
      category: category || 'Staff Benefit',
      percentage: pct,
      fixed_amount: fixed,
      applicable_service: applicable_service || 'All Services',
      authorized_by: authorized_by || 'HR Management',
      status: status || 'Active',
      description: description || '',
      created_at: new Date().toISOString()
    };
    const db = getDB();
    if (!db.discounts) db.discounts = [];
    db.discounts.unshift(newDisc);
    return res.status(201).json({ success: true, data: newDisc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.patch('/discounts/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, discount_code, category, percentage, fixed_amount, applicable_service, status, description } = req.body;

    const pool = getPostgresPool();
    if (pool) {
      const updateRes = await pool.query(`
        UPDATE zmc_discounts
        SET 
          title = COALESCE($1, title),
          discount_code = COALESCE($2, discount_code),
          category = COALESCE($3, category),
          percentage = COALESCE($4, percentage),
          fixed_amount = COALESCE($5, fixed_amount),
          applicable_service = COALESCE($6, applicable_service),
          status = COALESCE($7, status),
          description = COALESCE($8, description)
        WHERE id = $9
        RETURNING *
      `, [title, discount_code, category, percentage ? parseInt(percentage, 10) : undefined, fixed_amount ? parseFloat(fixed_amount) : undefined, applicable_service, status, description, id]);

      if (updateRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Discount policy not found' });
      await refreshCache();
      return res.json({ success: true, data: updateRes.rows[0] });
    }

    const db = getDB();
    const idx = (db.discounts || []).findIndex(d => d.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Discount policy not found' });
    db.discounts[idx] = { ...db.discounts[idx], ...req.body };
    return res.json({ success: true, data: db.discounts[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hrRoutes.delete('/discounts/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPostgresPool();
    if (pool) {
      await pool.query('DELETE FROM zmc_discounts WHERE id = $1', [id]);
      await refreshCache();
      return res.json({ success: true, message: 'Discount policy deleted' });
    }
    const db = getDB();
    db.discounts = (db.discounts || []).filter(d => d.id !== id);
    return res.json({ success: true, message: 'Discount policy deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
