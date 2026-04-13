# QR Code Setup Guide for Table Menu

## Overview

Each table in your coffee shop needs a unique QR code that customers can scan to access the digital menu. This guide explains how to generate, deploy, and manage QR codes.

---

## URL Format

The QR codes should link to:

```
https://your-domain.com/menu/[TABLE_NUMBER]
```

**Examples:**
- Table 1: `https://brewstock.vercel.app/menu/1`
- Table 2: `https://brewstock.vercel.app/menu/2`
- VIP Table: `https://brewstock.vercel.app/menu/vip-corner`
- Outdoor 5: `https://brewstock.vercel.app/menu/outdoor-5`

The table number can be:
- Numeric: `1`, `2`, `3`
- Alphanumeric: `A1`, `B2`, `VIP-1`
- Descriptive: `window-corner`, `outdoor-patio`

---

## Generating QR Codes

### Option 1: Using Node.js Script (Recommended)

Create a script to generate QR codes for all your tables:

```javascript
// scripts/generate-qr-codes.js
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://brewstock.vercel.app';
const OUTPUT_DIR = './public/qr-codes';

const tables = [
  '1', '2', '3', '4', '5', '6',
  'vip-1', 'vip-2',
  'outdoor-1', 'outdoor-2',
];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate QR code for each table
for (const table of tables) {
  const url = `${DOMAIN}/menu/${table}`;
  const filename = path.join(OUTPUT_DIR, `table-${table}.png`);

  QRCode.toFile(filename, url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1a1a',
      light: '#ffffff',
    },
  }, (err) => {
    if (err) {
      console.error(`Error generating QR for table ${table}:`, err);
    } else {
      console.log(`✓ Generated QR code for table ${table}`);
    }
  });
}

console.log('QR code generation complete!');
```

**To run:**
```bash
npx tsx scripts/generate-qr-codes.js
```

### Option 2: Online QR Code Generator

Use free online tools:
- https://qr-code-generator.com
- https://www.qr-code-generator.com
- https://www.zxing.org/w/decode.jspx

**Steps:**
1. Visit any QR code generator
2. Enter your URL: `https://your-domain.com/menu/1`
3. Customize colors (dark: `#1a1a1a`, light: `#ffffff`)
4. Download PNG image
5. Repeat for each table

### Option 3: Print Service

Services that can generate and print QR codes:
- Vistaprint
- Printful
- Local printing services

---

## Displaying QR Codes

### Option A: Physical Printed Codes

**Best for:** Permanent setup, professional appearance

**Materials needed:**
- Laminated cards or stickers (5x5 cm or 2x2 inches)
- QR code PNG files
- Laminating sheets or sticker paper

**Steps:**
1. Print QR codes at 5x5 cm or 2x2 inches
2. Laminate for durability
3. Attach to table center or corner
4. Ensure QR code is clean and not scratched

### Option B: Acrylic/Plastic Stands

**Best for:** Elegant, reusable, professional

**Setup:**
1. Print QR codes at 10x10 cm
2. Mount in clear acrylic stands
3. Place at table center or near menu board
4. Easy to replace if codes change

### Option C: Table Tent Cards

**Best for:** Flexible, changeable designs

**Setup:**
1. Design double-sided table cards in PowerPoint or Canva
2. Include:
   - QR code (10x10 cm)
   - "Scan to Order" text
   - Table number
   - Restaurant logo
3. Print on cardstock
4. Fold in half and place on table

### Option D: Digital Displays

**Best for:** Modern setup, customizable

**Setup:**
1. Install small tablets at each table
2. Display QR code with optional link
3. Customers can tap QR or enter URL directly
4. Update easily from admin

---

## QR Code Best Practices

### ✅ Do's
- Use adequate contrast (dark code on light background)
- Leave at least 4mm white border around code
- Test each QR code before deployment
- Make QR code at least 2x2 inches (5x5 cm)
- Clean QR codes regularly
- Have backup codes available
- Test on multiple phones and browsers

### ❌ Don'ts
- Don't obscure or crop the QR code
- Don't use low-contrast colors
- Don't rotate or distort the code
- Don't place reflective plastic directly on code
- Don't use QR codes smaller than 1x1 inch
- Don't forget to test mobile functionality

---

## Testing Your QR Codes

### Before Deployment

1. **Phone Test**
   - Use iOS Camera app (built-in QR scanning)
   - Use Android Google Lens or separate QR app
   - Ensure it opens the correct menu URL

2. **Browser Test**
   - Open link on mobile browser
   - Verify page loads in < 2 seconds
   - Check menu displays correctly
   - Test search and filtering
   - Test adding items to cart
   - Complete a test order

3. **Distance Test**
   - Scan from normal viewing distance
   - Test from different angles
   - Verify focus doesn't blur

4. **Print Test**
   - Scan printed version
   - Verify it works after lamination
   - Test after handling/cleaning

### Deployment Checklist
- [ ] All QR codes generated
- [ ] QR codes tested on iOS
- [ ] QR codes tested on Android
- [ ] Each table has QR code
- [ ] QR codes properly positioned
- [ ] Backup codes printed and stored
- [ ] Staff trained on system
- [ ] Menu items loaded in system
- [ ] Test orders completed successfully

---

## Managing QR Codes Long-Term

### Updates

If you change your domain:
1. Generate new QR codes with new URL
2. Print and install new codes
3. Remove old codes from tables

If you change table numbers:
1. Update table numbers in system
2. Generate new QR codes
3. Install new codes

### Maintenance

- Weekly: Inspect codes for damage/dirt
- Monthly: Clean codes with dry cloth
- Quarterly: Replace any damaged codes
- Annually: Review and reorganize as needed

### Troubleshooting

**QR code won't scan:**
- Check for scratches or damage
- Verify adequate contrast
- Ensure code isn't rotated
- Try cleaning code
- Test on different devices

**Wrong URL appears:**
- Verify URL in QR generator
- Check domain spelling
- Ensure HTTPS is working
- Test on multiple devices

**Menu doesn't load:**
- Check internet connection
- Verify server is running
- Check browser console for errors
- Try incognito/private mode
- Clear browser cache

---

## Sample HTML Page with QR Code

If you want to display QR codes in admin area:

```html
<!-- pages/admin/qr-codes.tsx -->
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
  {tables.map(table => (
    <div key={table} className="flex flex-col items-center p-4 border rounded-lg">
      <img 
        src={`/qr-codes/table-${table}.png`}
        alt={`Table ${table} QR Code`}
        className="w-48 h-48 mb-4"
      />
      <h3 className="font-bold text-lg">Table {table}</h3>
      <p className="text-gray-600 text-sm">
        https://brewstock.vercel.app/menu/{table}
      </p>
      <button 
        onClick={() => window.print()}
        className="mt-4 btn btn-primary"
      >
        Print QR Code
      </button>
    </div>
  ))}
</div>
```

---

## Advanced: Dynamic QR Codes

For restaurants with frequently changing menus:

```javascript
// Create API that generates QR on-the-fly
import QRCode from 'qrcode';

export default async function handler(req, res) {
  const { table } = req.query;
  const url = `${process.env.BASE_URL}/menu/${table}`;
  
  const qrCode = await QRCode.toDataURL(url);
  res.setHeader('Content-Type', 'image/png');
  res.send(qrCode);
}
```

Access at: `/api/qr-code?table=1`

---

## Support

If customers have trouble:
1. Check camera permissions
2. Ensure good lighting
3. Try different scanning apps
4. Provide alternative: manual URL entry
5. Have staff ready to help

---

## Summary

1. Generate QR codes for each table using the URL format above
2. Print and laminate codes
3. Attach to tables
4. Test thoroughly before going live
5. Maintain and update as needed
6. Provide backup manual access if needed

**Your QR code is ready to use once deployed!**
