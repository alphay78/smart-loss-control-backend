const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { generateToken, generateOTP } = require('../utils/jwt');
const { sendOTP } = require('../services/smsService');

// Owner Registration (Step 1: Send OTP)
const registerOwner = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { full_name, shop_name, phone } = req.body;

    // Validation
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Check if owner already exists
    const existingOwner = await client.query(
      'SELECT * FROM users WHERE phone = $1 AND role = $2',
      [phone, 'OWNER']
    );

    let shopId;

    if (existingOwner.rows.length > 0) {
      // Existing owner - just send new OTP
      shopId = existingOwner.rows[0].shop_id;
    } else {
      // New owner - validate required fields
      if (!full_name || !shop_name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Full name and shop name are required for registration' 
        });
      }

      // Create shop
      const shopResult = await client.query(
        'INSERT INTO shops (shop_name, owner_phone) VALUES ($1, $2) RETURNING id',
        [shop_name, phone]
      );
      shopId = shopResult.rows[0].id;

      // Create owner user
      await client.query(
        'INSERT INTO users (shop_id, full_name, phone, role) VALUES ($1, $2, $3, $4)',
        [shopId, full_name, phone, 'OWNER']
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    await client.query(
      'INSERT INTO otp_verifications (phone, otp_code, expires_at) VALUES ($1, $2, $3)',
      [phone, otp, expiresAt]
    );

    // Send OTP via SMS
    const smsResult = await sendOTP(phone, otp);
    
    // Response based on SMS result
    const response = {
      success: true,
      message: `OTP sent to ${phone}`,
      sms_status: smsResult.mode
    };

    // Include OTP in development mode or if SMS failed
    if (process.env.NODE_ENV === 'development' || !smsResult.success) {
      response.dev_otp = otp;
    }

    // Include SMS details for debugging
    if (smsResult.mode === 'production') {
      response.sms_sid = smsResult.sid;
    } else if (smsResult.mode === 'fallback') {
      response.sms_error = smsResult.error;
      response.fallback_note = 'SMS failed, check console for OTP';
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Register owner error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Owner OTP Verification (Step 2: Verify and Login)
const verifyOTP = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { phone, otp } = req.body;

    // Validation
    if (!phone || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone and OTP are required' 
      });
    }

    // Security: Check for too many failed attempts (rate limiting)
    const recentAttempts = await client.query(
      `SELECT COUNT(*) as attempt_count 
       FROM otp_verifications 
       WHERE phone = $1 
       AND created_at > NOW() - INTERVAL '15 minutes'`,
      [phone]
    );

    if (parseInt(recentAttempts.rows[0].attempt_count) > 5) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many OTP requests. Please wait 15 minutes and try again.' 
      });
    }

    // Check OTP
    const otpResult = await client.query(
      `SELECT * FROM otp_verifications 
       WHERE phone = $1 AND otp_code = $2 AND is_verified = false 
       AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    // Mark OTP as verified
    await client.query(
      'UPDATE otp_verifications SET is_verified = true WHERE id = $1',
      [otpResult.rows[0].id]
    );

    // Get user
    const userResult = await client.query(
      'SELECT id, shop_id, full_name, phone, role FROM users WHERE phone = $1 AND role = $2',
      [phone, 'OWNER']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];

    // Update last login
    await client.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      shop_id: user.shop_id,
      role: user.role,
      phone: user.phone
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        shop_id: user.shop_id,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'OTP verification failed', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Staff PIN Login
const loginWithPIN = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { staff_name, pin } = req.body;

    // Validation
    if (!staff_name || !pin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Staff name and PIN are required' 
      });
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ 
        success: false, 
        message: 'PIN must be exactly 4 digits' 
      });
    }

    // Get staff user
    const userResult = await client.query(
      `SELECT id, shop_id, full_name, phone, role, pin_hash, is_active 
       FROM users 
       WHERE full_name = $1 AND role = $2`,
      [staff_name, 'STAFF']
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid staff name or PIN' 
      });
    }

    const user = userResult.rows[0];

    // Check if active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Verify PIN
    const pinMatch = await bcrypt.compare(pin, user.pin_hash);

    if (!pinMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid staff name or PIN' 
      });
    }

    // Update last login
    await client.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      shop_id: user.shop_id,
      role: user.role,
      staff_name: user.full_name
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        shop_id: user.shop_id,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login with PIN error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Staff Link (QR Code Onboarding)
const linkStaff = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { qr_token, device_id, staff_name, pin } = req.body;

    // Validation
    if (!qr_token || !device_id || !staff_name || !pin) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ 
        success: false, 
        message: 'PIN must be exactly 4 digits' 
      });
    }

    // Verify QR code
    const qrResult = await client.query(
      `SELECT * FROM qr_codes 
       WHERE code = $1 AND is_used = false AND expires_at > NOW()`,
      [qr_token]
    );

    if (qrResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired QR code' 
      });
    }

    const qrCode = qrResult.rows[0];
    const shopId = qrCode.shop_id;

    // Check if staff name already exists in this shop
    const existingStaff = await client.query(
      'SELECT id FROM users WHERE shop_id = $1 AND full_name = $2 AND role = $3',
      [shopId, staff_name, 'STAFF']
    );

    if (existingStaff.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Staff name already exists in this shop' 
      });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Create staff user
    const userResult = await client.query(
      `INSERT INTO users (shop_id, full_name, role, pin_hash) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, shop_id, full_name, role`,
      [shopId, staff_name, 'STAFF', pinHash]
    );

    const user = userResult.rows[0];

    // Link device
    await client.query(
      'INSERT INTO devices (user_id, device_id) VALUES ($1, $2)',
      [user.id, device_id]
    );

    // Mark QR code as used
    await client.query(
      'UPDATE qr_codes SET is_used = true WHERE id = $1',
      [qrCode.id]
    );

    res.status(201).json({
      success: true,
      message: 'Staff device linked successfully',
      staff: {
        id: user.id,
        full_name: user.full_name,
        device_id: device_id,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Link staff error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Staff linking failed', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Generate QR Code for Staff Onboarding (Owner only)
const generateQRCode = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { shop_id, role } = req.user;

    // Only owners can generate QR codes
    if (role !== 'OWNER') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only shop owners can generate QR codes' 
      });
    }

    // Generate unique QR token
    const qrToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store QR code in database
    const qrResult = await client.query(
      `INSERT INTO qr_codes (shop_id, code, expires_at) 
       VALUES ($1, $2, $3) 
       RETURNING id, code, expires_at`,
      [shop_id, qrToken, expiresAt]
    );

    const qrCode = qrResult.rows[0];

    // Calculate remaining time
    const now = new Date();
    const remainingMs = new Date(qrCode.expires_at) - now;
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    res.status(201).json({
      success: true,
      message: 'QR code generated successfully',
      qr_code: {
        id: qrCode.id,
        token: qrCode.code,
        expires_at: qrCode.expires_at,
        expires_in_minutes: 30,
        remaining_time: {
          hours: remainingHours,
          minutes: remainingMinutes,
          total_minutes: Math.floor(remainingMs / (1000 * 60))
        }
      },
      instructions: {
        usage: 'Share this QR code with staff to link their devices',
        expiry: `QR code expires in ${remainingMinutes}m`,
        staff_flow: 'Staff scans QR → Enters name + PIN → Device linked'
      }
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'QR code generation failed', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Check QR Code Status (Public endpoint for countdown)
const checkQRStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { qr_token } = req.params;

    if (!qr_token) {
      return res.status(400).json({ 
        success: false, 
        message: 'QR token is required' 
      });
    }

    // Get QR code details
    const qrResult = await client.query(
      `SELECT id, shop_id, code, expires_at, is_used, created_at 
       FROM qr_codes 
       WHERE code = $1`,
      [qr_token]
    );

    if (qrResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'QR code not found' 
      });
    }

    const qrCode = qrResult.rows[0];
    const now = new Date();
    const expiresAt = new Date(qrCode.expires_at);
    const remainingMs = expiresAt - now;

    // Check if expired
    const isExpired = remainingMs <= 0;
    const isUsed = qrCode.is_used;

    let status = 'active';
    if (isUsed) status = 'used';
    else if (isExpired) status = 'expired';

    // Calculate remaining time
    const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
    const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
    const remainingSeconds = Math.max(0, Math.floor((remainingMs % (1000 * 60)) / 1000));

    res.json({
      success: true,
      qr_status: {
        token: qrCode.code,
        status: status,
        is_expired: isExpired,
        is_used: isUsed,
        expires_at: qrCode.expires_at,
        created_at: qrCode.created_at,
        remaining_time: {
          hours: remainingHours,
          minutes: remainingMinutes,
          seconds: remainingSeconds,
          total_seconds: Math.max(0, Math.floor(remainingMs / 1000))
        }
      },
      message: status === 'active' 
        ? `QR code valid for ${remainingMinutes}m ${remainingSeconds}s`
        : status === 'used' 
        ? 'QR code has been used'
        : 'QR code has expired'
    });

  } catch (error) {
    console.error('Check QR status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check QR status', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// SMS Service Status (Development endpoint)
const getSMSStatus = async (req, res) => {
  const { getServiceStatus } = require('../services/smsService');
  
  try {
    const status = getServiceStatus();
    
    res.json({
      success: true,
      sms_service: status,
      environment: process.env.NODE_ENV || 'development',
      message: status.configured 
        ? 'SMS service is configured and ready'
        : 'SMS service not configured - using development mode'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get SMS status', 
      error: error.message 
    });
  }
};

module.exports = {
  registerOwner,
  verifyOTP,
  loginWithPIN,
  linkStaff,
  generateQRCode,
  checkQRStatus,
  getSMSStatus
};
