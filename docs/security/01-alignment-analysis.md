# Security Architecture Alignment Analysis

**Date**: February 2026  
**Reviewed By**: Alphi (Backend Developer)  
**Cyber Security Requirements**: AES-256 Encryption & Multi-Tenant Data Isolation

---

## ✅ What's Already Implemented

### 1. Multi-Tenant Architecture (IMPLEMENTED)

**Current Setup**:
```sql
-- Every table has shop_id for tenant isolation
CREATE TABLE inventory (
    id UUID PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id),
    sku_id UUID NOT NULL,
    ...
);

-- Automatic tenant filtering via foreign keys
-- All queries are scoped to shop_id
```

**Status**: ✅ **ALIGNED**
- Every data table has `shop_id` foreign key
- Cascade deletes ensure data isolation
- Queries automatically scoped to authenticated shop

---

### 2. Key Storage Infrastructure (PARTIAL)

**Current Setup**:
```sql
CREATE TABLE shops (
    id UUID PRIMARY KEY,
    shop_name VARCHAR(150),
    owner_phone VARCHAR(20),
    aes_key_hash TEXT,  -- ✅ Field exists
    ...
);
```

**Status**: ⚠️ **PARTIALLY ALIGNED**
- Database field exists for encryption keys
- **MISSING**: Actual AES-256 encryption implementation
- **MISSING**: Key Management Service (KMS) integration

---

### 3. Data in Transit (IMPLEMENTED)

**Current Setup**:
- HTTPS/TLS 1.2+ for all API communication
- JWT tokens for authentication
- Secure headers (Helmet.js)

**Status**: ✅ **ALIGNED**

---

### 4. Authentication & Authorization (IMPLEMENTED)

**Current Setup**:
- PIN hashing with bcrypt
- JWT token-based sessions
- Role-based access (OWNER/STAFF)
- Device whitelisting

**Status**: ✅ **ALIGNED**

---

## ❌ What's Missing (Critical Gaps)

### 1. AES-256 Encryption at Rest (NOT IMPLEMENTED)

**Required**:
```
Sensitive fields must be encrypted before database storage:
- Phone numbers
- Financial data (prices, sales amounts)
- Staff names
- Transaction details
```

**Current State**: Data stored in plaintext in database

**Impact**: HIGH - Does not meet "Data Protection by Default" requirement

---

### 2. Row-Level Security (RLS) (NOT IMPLEMENTED)

**Required**:
```sql
-- PostgreSQL RLS to enforce tenant isolation at DB level
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON inventory
    USING (shop_id = current_setting('app.current_shop_id')::uuid);
```

**Current State**: Tenant isolation enforced only at application level

**Impact**: MEDIUM - If application layer is bypassed, cross-tenant access possible

---

### 3. Key Management Service (NOT IMPLEMENTED)

**Required**:
- Secure key storage (AWS KMS, Azure Key Vault, or HashiCorp Vault)
- Automatic key rotation
- Audit logging for key access

**Current State**: No KMS integration

**Impact**: HIGH - Keys would be stored insecurely

---

### 4. Encryption Layer Middleware (NOT IMPLEMENTED)

**Required**:
```javascript
// Automatic encryption/decryption middleware
app.use(encryptionMiddleware({
  fields: ['phone', 'full_name', 'amount'],
  algorithm: 'aes-256-gcm'
}));
```

**Current State**: No encryption middleware

**Impact**: HIGH - Manual encryption prone to errors

---

## 📋 Implementation Roadmap

### Phase 1: Critical Security (Week 1-2)

**Priority: HIGH**

1. **Implement AES-256 Encryption**
   - Add encryption middleware
   - Encrypt sensitive fields before DB write
   - Decrypt on read (after auth check)

2. **Add Row-Level Security (RLS)**
   - Enable RLS on all tenant-scoped tables
   - Create tenant isolation policies
   - Test cross-tenant access prevention

3. **Integrate Key Management**
   - Set up KMS (recommend AWS KMS for MVP)
   - Store encryption keys securely
   - Implement key rotation schedule

---

### Phase 2: Enhanced Security (Week 3-4)

**Priority: MEDIUM**

4. **Audit Logging**
   - Log all encryption/decryption operations
   - Track key access
   - Monitor suspicious queries

5. **Backup Encryption**
   - Encrypt database backups
   - Secure backup storage
   - Test restore procedures

6. **Security Testing**
   - Penetration testing
   - Cross-tenant access attempts
   - Key compromise scenarios

---

## 🔧 Recommended Implementation

### 1. Add Encryption Middleware

**File**: `src/middleware/encryption.js`

```javascript
const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Fields to encrypt
const ENCRYPTED_FIELDS = {
  users: ['phone', 'full_name'],
  transactions: ['meta'],
  shops: ['owner_phone']
};

function encrypt(text, masterKey) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

function decrypt(encryptedData, masterKey) {
  const buffer = Buffer.from(encryptedData, 'base64');
  
  const salt = buffer.slice(0, SALT_LENGTH);
  const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}

module.exports = { encrypt, decrypt, ENCRYPTED_FIELDS };
```

---

### 2. Add Row-Level Security Migration

**File**: `migrations/002_add_rls.sql`

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE restocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE decants ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation_inventory ON inventory
    USING (shop_id = current_setting('app.current_shop_id')::uuid);

CREATE POLICY tenant_isolation_transactions ON transactions
    USING (shop_id = current_setting('app.current_shop_id')::uuid);

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    USING (shop_id = current_setting('app.current_shop_id')::uuid);

CREATE POLICY tenant_isolation_alerts ON alerts
    USING (shop_id = current_setting('app.current_shop_id')::uuid);

CREATE POLICY tenant_isolation_restocks ON restocks
    USING (shop_id = current_setting('app.current_shop_id')::uuid);

CREATE POLICY tenant_isolation_decants ON decants
    USING (shop_id = current_setting('app.current_shop_id')::uuid);

-- Function to set current shop context
CREATE OR REPLACE FUNCTION set_current_shop(shop_uuid UUID) RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_shop_id', shop_uuid::text, false);
END;
$$ LANGUAGE plpgsql;
```

---

### 3. Update Database Connection

**File**: `src/config/db.js`

```javascript
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Set shop context for RLS
async function setShopContext(client, shopId) {
  await client.query('SELECT set_current_shop($1)', [shopId]);
}

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

module.exports = { pool, setShopContext };
```

---

## 📊 Security Compliance Matrix

| Requirement | Current Status | Priority | Effort |
|-------------|---------------|----------|--------|
| Multi-Tenant Architecture | ✅ Implemented | - | - |
| AES-256 Encryption | ❌ Missing | HIGH | 3 days |
| Row-Level Security | ❌ Missing | HIGH | 2 days |
| Key Management Service | ❌ Missing | HIGH | 4 days |
| HTTPS/TLS | ✅ Implemented | - | - |
| JWT Authentication | ✅ Implemented | - | - |
| PIN Hashing | ✅ Implemented | - | - |
| Audit Logging | ⚠️ Partial | MEDIUM | 2 days |
| Backup Encryption | ❌ Missing | MEDIUM | 2 days |
| Key Rotation | ❌ Missing | MEDIUM | 3 days |

---

## 🎯 Immediate Action Items

### For Backend Team (You):

1. **Create encryption middleware** (3 days)
2. **Implement RLS migration** (2 days)
3. **Integrate AWS KMS** (4 days)
4. **Update API routes to use encryption** (2 days)
5. **Write security tests** (2 days)

**Total Estimated Time**: 2 weeks

---

### For Cyber Security Team:

1. **Provide KMS credentials** (AWS/Azure/Vault)
2. **Define key rotation policy** (30/60/90 days?)
3. **Review encryption implementation**
4. **Conduct penetration testing**
5. **Approve for production**

---

## 💡 Recommendations

### Short-Term (MVP):

1. **Implement AES-256 encryption** for sensitive fields
2. **Add Row-Level Security** for tenant isolation
3. **Use environment variables** for master keys (temporary)
4. **Enable HTTPS** in production

### Long-Term (Production):

1. **Migrate to AWS KMS** or Azure Key Vault
2. **Implement automatic key rotation**
3. **Add comprehensive audit logging**
4. **Set up encrypted backups**
5. **Regular security audits**

---

## 📞 Next Steps

**Immediate**:
1. Schedule meeting with cyber security team
2. Get KMS access credentials
3. Prioritize encryption implementation
4. Create security testing plan

**This Week**:
1. Implement encryption middleware
2. Add RLS migration
3. Update API routes
4. Test tenant isolation

---

## ⚠️ Risk Assessment

**Current Risk Level**: MEDIUM-HIGH

**Risks**:
- Data stored in plaintext (HIGH)
- No database-level tenant isolation (MEDIUM)
- No key management system (HIGH)

**Mitigation**:
- Implement encryption immediately
- Add RLS before production
- Integrate KMS within 2 weeks

---

**Status**: Your architecture is **PARTIALLY ALIGNED** with cyber security requirements.  
**Action Required**: Implement AES-256 encryption and RLS before production deployment.  
**Timeline**: 2 weeks for full compliance.
