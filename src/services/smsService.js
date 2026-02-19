const twilio = require('twilio');

// Initialize Twilio client
let twilioClient = null;

// Check if Twilio is configured
const isTwilioConfigured = () => {
  return process.env.TWILIO_ACCOUNT_SID && 
         process.env.TWILIO_AUTH_TOKEN && 
         process.env.TWILIO_ACCOUNT_SID !== 'your_account_sid_here';
};

// Check if WhatsApp is configured
const isWhatsAppConfigured = () => {
  return isTwilioConfigured() && process.env.TWILIO_WHATSAPP_NUMBER;
};

// Initialize Twilio client if configured
if (isTwilioConfigured()) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    if (isWhatsAppConfigured()) {
      console.log('✅ Twilio WhatsApp service initialized');
    } else {
      console.log('✅ Twilio SMS service initialized');
    }
  } catch (error) {
    console.error('❌ Twilio initialization failed:', error.message);
  }
} else {
  console.log('⚠️  Twilio not configured - using development mode (console logging)');
}

/**
 * Send OTP via WhatsApp or SMS
 * @param {string} phoneNumber - Recipient phone number (e.g., +2348012345678)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} - Success/failure result
 */
async function sendOTP(phoneNumber, otp) {
  const message = `🔐 *Smart Loss Control*\n\nYour verification code is: *${otp}*\n\nValid for 5 minutes.\n⚠️ Do not share this code with anyone.`;
  
  // Development mode - log to console
  if (!isTwilioConfigured()) {
    console.log(`📱 OTP (DEV MODE) to ${phoneNumber}: ${otp}`);
    return {
      success: true,
      mode: 'development',
      channel: 'console',
      message: 'OTP logged to console (development mode)',
      sid: 'dev_' + Date.now()
    };
  }

  // Try WhatsApp first, fallback to SMS
  if (isWhatsAppConfigured()) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phoneNumber}`
      });

      console.log(`✅ WhatsApp OTP sent to ${phoneNumber}, SID: ${result.sid}`);
      
      return {
        success: true,
        mode: 'production',
        channel: 'whatsapp',
        message: 'OTP sent via WhatsApp',
        sid: result.sid,
        status: result.status
      };

    } catch (whatsappError) {
      console.warn(`⚠️  WhatsApp failed, trying SMS: ${whatsappError.message}`);
      
      // Fallback to SMS if WhatsApp fails
      if (process.env.TWILIO_PHONE_NUMBER) {
        try {
          const smsMessage = `Your Smart Loss Control verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
          const result = await twilioClient.messages.create({
            body: smsMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
          });

          console.log(`✅ SMS OTP sent (WhatsApp fallback) to ${phoneNumber}, SID: ${result.sid}`);
          
          return {
            success: true,
            mode: 'production',
            channel: 'sms',
            message: 'OTP sent via SMS (WhatsApp fallback)',
            sid: result.sid,
            status: result.status
          };

        } catch (smsError) {
          console.error('❌ Both WhatsApp and SMS failed:', smsError.message);
          return fallbackToConsole(phoneNumber, otp);
        }
      } else {
        return fallbackToConsole(phoneNumber, otp);
      }
    }
  } else {
    // SMS only mode
    try {
      const smsMessage = `Your Smart Loss Control verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
      const result = await twilioClient.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`✅ SMS OTP sent to ${phoneNumber}, SID: ${result.sid}`);
      
      return {
        success: true,
        mode: 'production',
        channel: 'sms',
        message: 'OTP sent via SMS',
        sid: result.sid,
        status: result.status
      };

    } catch (error) {
      console.error('❌ SMS sending failed:', error.message);
      return fallbackToConsole(phoneNumber, otp);
    }
  }
}

/**
 * Fallback to console logging when all channels fail
 */
function fallbackToConsole(phoneNumber, otp) {
  console.log(`📱 FALLBACK OTP to ${phoneNumber}: ${otp}`);
  
  return {
    success: false,
    mode: 'fallback',
    channel: 'console',
    message: 'All channels failed, OTP logged to console',
    fallback_otp: otp
  };
}

/**
 * Send notification via WhatsApp or SMS (for alerts, etc.)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message content
 * @param {string} channel - Preferred channel: 'whatsapp', 'sms', or 'auto' (default)
 * @returns {Promise<Object>} - Success/failure result
 */
async function sendNotification(phoneNumber, message, channel = 'auto') {
  // Development mode - log to console
  if (!isTwilioConfigured()) {
    console.log(`📱 NOTIFICATION (DEV MODE) to ${phoneNumber}: ${message}`);
    return {
      success: true,
      mode: 'development',
      channel: 'console',
      message: 'Notification logged to console'
    };
  }

  // Auto-select channel: WhatsApp preferred, SMS fallback
  if (channel === 'auto') {
    channel = isWhatsAppConfigured() ? 'whatsapp' : 'sms';
  }

  // Send via WhatsApp
  if (channel === 'whatsapp' && isWhatsAppConfigured()) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phoneNumber}`
      });

      console.log(`✅ WhatsApp notification sent to ${phoneNumber}, SID: ${result.sid}`);
      
      return {
        success: true,
        mode: 'production',
        channel: 'whatsapp',
        message: 'Notification sent via WhatsApp',
        sid: result.sid
      };

    } catch (error) {
      console.warn(`⚠️  WhatsApp notification failed, trying SMS: ${error.message}`);
      
      // Fallback to SMS
      if (process.env.TWILIO_PHONE_NUMBER) {
        return sendNotificationSMS(phoneNumber, message);
      } else {
        return {
          success: false,
          mode: 'error',
          channel: 'whatsapp',
          message: 'WhatsApp notification failed',
          error: error.message
        };
      }
    }
  }

  // Send via SMS
  return sendNotificationSMS(phoneNumber, message);
}

/**
 * Send notification via SMS
 */
async function sendNotificationSMS(phoneNumber, message) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`✅ SMS notification sent to ${phoneNumber}, SID: ${result.sid}`);
    
    return {
      success: true,
      mode: 'production',
      channel: 'sms',
      message: 'Notification sent via SMS',
      sid: result.sid
    };

  } catch (error) {
    console.error('❌ SMS notification failed:', error.message);
    
    return {
      success: false,
      mode: 'error',
      channel: 'sms',
      message: 'SMS notification failed',
      error: error.message
    };
  }
}

/**
 * Get messaging service status
 * @returns {Object} - Service configuration status
 */
function getServiceStatus() {
  return {
    configured: isTwilioConfigured(),
    mode: isTwilioConfigured() ? 'production' : 'development',
    channels: {
      whatsapp: {
        enabled: isWhatsAppConfigured(),
        number: process.env.TWILIO_WHATSAPP_NUMBER || 'not_configured'
      },
      sms: {
        enabled: !!process.env.TWILIO_PHONE_NUMBER,
        number: process.env.TWILIO_PHONE_NUMBER || 'not_configured'
      }
    },
    account_sid: process.env.TWILIO_ACCOUNT_SID ? 
      process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'not_configured',
    provider: 'Twilio'
  };
}

module.exports = {
  sendOTP,
  sendNotification,
  getServiceStatus,
  isTwilioConfigured,
  isWhatsAppConfigured
};
