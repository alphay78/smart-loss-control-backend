const express = require('express');
const router = express.Router();
const {
  registerOwner,
  verifyOTP,
  loginWithPIN,
  linkStaff,
  generateQRCode,
  checkQRStatus,
  getSMSStatus
} = require('../controllers/authController');
const { authenticateJWT, requireOwner } = require('../middleware/auth');

// Owner Registration (Step 1: Send OTP)
router.post('/register-owner', registerOwner);

// Owner OTP Verification (Step 2: Verify and Login)
router.post('/verify-otp', verifyOTP);

// Generate QR Code for Staff Onboarding (Owner only)
router.post('/generate-qr', authenticateJWT, requireOwner, generateQRCode);

// Check QR Code Status (Public endpoint for countdown)
router.get('/qr-status/:qr_token', checkQRStatus);

// SMS Service Status (Development endpoint)
router.get('/sms-status', getSMSStatus);

// Staff PIN Login
router.post('/login-pin', loginWithPIN);

// Staff Link (QR Code Onboarding)
router.post('/staff/link', linkStaff);

module.exports = router;
