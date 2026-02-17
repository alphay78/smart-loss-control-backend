# UI Specifications for UX/UI Team

**Backend Developer**: Alphi  
**Project**: Smart Loss Control  
**Last Updated**: February 2026

---

## 📁 Folder Structure

This folder contains complete UI specifications for all features, organized by user flow.

### Files Overview:

| File | Description | User Role |
|------|-------------|-----------|
| `01-authentication.md` | Owner & Staff login flows | Both |
| `02-owner-dashboard.md` | Owner home screen & navigation | Owner |
| `03-inventory-management.md` | Restock & decant operations | Owner |
| `04-staff-dashboard.md` | Staff home screen & sales grid | Staff |
| `05-sales-logging.md` | Offline sales logging flow | Staff |
| `06-ai-spot-checks.md` | AI-triggered physical counts | Staff |
| `07-alerts.md` | Alert viewing & resolution | Owner |
| `08-reports.md` | Deviation & performance reports | Owner |
| `09-settings.md` | Shop settings & staff management | Owner |

---

## 🎯 How to Use These Specs

### For Each File You'll Find:

1. **Screen Layouts** - ASCII wireframes showing UI structure
2. **Field Specifications** - Exact field names, types, validation rules
3. **Backend API Calls** - Request/response examples
4. **Design Notes** - Button sizes, colors, interactions
5. **User Flow Diagrams** - Step-by-step navigation

### Design Requirements (All Screens):

✅ **Button Size**: Minimum 48x48dp (greasy fingers)  
✅ **Text Size**: Minimum 18px bold for numbers/prices  
✅ **Contrast**: 7:1 ratio (poor lighting in markets)  
✅ **Loading States**: Show spinners during API calls  
✅ **Error Handling**: Red text below fields  
✅ **Offline Indicator**: Show sync status badge  

### Color Palette:

- **Primary**: Green (#28A745) - Success, confirmations
- **Danger**: Red (#DC3545) - Alerts, critical issues
- **Warning**: Orange (#FFC107) - Warnings, pending actions
- **Info**: Blue (#17A2B8) - Information, neutral
- **Background**: White (#FFFFFF) or Light Gray (#F8F9FA)
- **Text**: Dark Gray (#212529)

---

## 📱 Screen Flow Overview

### Owner Journey:
```
Registration → OTP → Dashboard → [Restock/Add Staff/View Alerts/Reports]
```

### Staff Journey:
```
QR Scan → PIN Setup → Dashboard → [Log Sales/Decant/Spot Check]
```

---

## 🔗 Additional Resources

- **API Documentation**: `docs/openapi.yaml` or `http://localhost:5000/api-docs`
- **Database Schema**: `docs/database-schema.md`
- **Frontend Integration Guide**: `docs/FRONTEND_GUIDE.md`

---

## 📞 Questions?

Contact: Alphi (Backend Developer)  
All specs are aligned with the backend API and database schema.
