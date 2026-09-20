import { Request, Response, NextFunction } from 'express';

export function validateCreatePatient(req: Request, res: Response, next: NextFunction): void {
  const { cardType, patientCanProvideDetails } = req.body;

  // For unconscious or unidentified emergency intake
  if (cardType === 'Emergency' && patientCanProvideDetails === false) {
    if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
      req.body.name = 'Unidentified Emergency Patient';
    }
    if (!req.body.dateOfBirth || isNaN(Date.parse(req.body.dateOfBirth))) {
      req.body.dateOfBirth = new Date().toISOString().split('T')[0];
    }
    if (!req.body.gender || !['Male', 'Female', 'Other'].includes(req.body.gender)) {
      req.body.gender = 'Male';
    }
    if (!req.body.phoneNumber || typeof req.body.phoneNumber !== 'string' || req.body.phoneNumber.trim() === '') {
      req.body.phoneNumber = '08000000000';
    }
    if (!req.body.address || typeof req.body.address !== 'string' || req.body.address.trim() === '') {
      req.body.address = 'Emergency Trauma Scene';
    }
  }

  const { name, dateOfBirth, gender, phoneNumber, address } = req.body;

  // Validate Full Name: must not be empty, must be at least 2 characters, and cannot be purely whitespace
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ success: false, error: 'Patient full name is required and must be at least 2 characters.' });
    return;
  }

  // Validate Date of Birth: must be a valid date and CANNOT be in the future
  if (!dateOfBirth || isNaN(Date.parse(dateOfBirth))) {
    res.status(400).json({ success: false, error: 'Valid Date of Birth is required' });
    return;
  }

  const dobDate = new Date(dateOfBirth);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (dobDate > today) {
    res.status(400).json({ success: false, error: 'Date of Birth cannot be in the future. Please enter a valid birth date.' });
    return;
  }

  if (dobDate < new Date('1900-01-01')) {
    res.status(400).json({ success: false, error: 'Date of Birth cannot be earlier than year 1900.' });
    return;
  }

  if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
    res.status(400).json({ success: false, error: 'Gender must be Male, Female, or Other' });
    return;
  }

  // Validate Phone Number: must contain at least 7 digits and at most 15 digits
  const phoneDigits = typeof phoneNumber === 'string' ? phoneNumber.replace(/\D/g, '') : '';
  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneDigits.length < 7 || phoneDigits.length > 15) {
    res.status(400).json({ success: false, error: 'A valid and complete phone number (at least 7 digits) is required.' });
    return;
  }

  if (!address || typeof address !== 'string' || address.trim() === '') {
    res.status(400).json({ success: false, error: 'Address is required' });
    return;
  }

  if (!cardType || !['Standard', 'Maternity', 'Emergency'].includes(cardType)) {
    res.status(400).json({ success: false, error: 'Card type must be Standard, Maternity, or Emergency' });
    return;
  }

  next();
}

export function validateRecordVitals(req: Request, res: Response, next: NextFunction): void {
  const { bloodPressure, temperature, pulseRate, respiratoryRate, spo2, weight, height } = req.body;

  if (!bloodPressure || typeof bloodPressure !== 'string') {
    res.status(400).json({ error: 'Blood Pressure is required (e.g. 120/80)' });
    return;
  }

  if (temperature === undefined || isNaN(Number(temperature))) {
    res.status(400).json({ error: 'Temperature is required and must be a number' });
    return;
  }

  if (pulseRate === undefined || isNaN(Number(pulseRate))) {
    res.status(400).json({ error: 'Pulse Rate is required and must be a number' });
    return;
  }

  if (weight === undefined || isNaN(Number(weight))) {
    res.status(400).json({ error: 'Weight is required and must be a number' });
    return;
  }

  next();
}
