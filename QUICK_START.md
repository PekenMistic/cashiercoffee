# Quick Start Guide - Menu Meja Redesign

## What's New

Your menu system has been completely redesigned with:
- ✨ Modern, minimalist design
- 🎨 Professional warm brown color scheme
- 📱 Perfect mobile experience
- 🔍 Search and filtering capabilities
- 🛒 Smart shopping cart
- 💳 Multiple payment options
- 📊 Real-time inventory integration

---

## Get Started in 5 Steps

### 1. Start the Development Server
```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000`

### 2. Access the Menu
Navigate to: `http://localhost:3000/menu/1`
(Replace `1` with any table number)

### 3. Test the Features
- **Search:** Type in the search box to find items
- **Filter:** Click category buttons to filter
- **Add Items:** Tap items to see details and customize
- **Cart:** Click the cart button to review and checkout
- **Pay:** Select payment method and confirm order

### 4. Generate QR Codes (For Production)
See `QR_CODE_SETUP.md` for complete instructions

### 5. Configure Your Menu
Add your menu items in the admin dashboard:
```
/admin/menu
```

---

## Key Files

### Menu Page
```
app/menu/[table]/page.tsx
```
Main customer-facing menu page

### Components
```
components/menu/
├── MenuHeader.tsx
├── FilterBar.tsx
├── MenuCard.tsx
├── MenuGrid.tsx
├── CartPanel.tsx
├── ItemDetailsModal.tsx
└── CheckoutModal.tsx
```

### Styling
```
app/globals.css
```
Design tokens and component styles

### State Management
```
lib/store.ts
```
Zustand store for cart and filters

### Database
```
db/schema.ts
```
Enhanced with new menu fields

### API
```
app/api/public/menu/route.ts      - Get menu items
app/api/public/orders/route.ts    - Create orders
app/api/menu/route.ts              - Admin menu management
```

---

## Key Features Explained

### 🔍 Search
- Real-time search across item names and descriptions
- Clear button to reset search
- Case-insensitive matching

### 🏷️ Filters
- **Categories:** Coffee, Food, Beverages, etc.
- **Dietary:** Vegan, Vegetarian, Gluten-free, etc.
- **Availability:** Show only in-stock items
- **Recommended:** Highlight bestsellers

### 🛍️ Cart
- **Add items:** Tap item or "Add to Cart" button
- **Modify quantity:** Use +/- buttons or input
- **Customizations:** Size, toppings, special instructions
- **Remove items:** Trash icon removes completely

### 💰 Checkout
- **Payment methods:** Cash, Card, QRIS
- **Auto-calculation:** Subtotal, tax (10%), total
- **Order confirmation:** Generates order number
- **Table tracking:** Links order to specific table

---

## Customization Guide

### Change Colors
Edit design tokens in `/app/globals.css`:
```css
:root {
  --primary: #8b7355;        /* Main brand color */
  --foreground: #1a1a1a;     /* Text color */
  --background: #ffffff;     /* Background */
}
```

### Change Table Numbers
In the menu page `app/menu/[table]/page.tsx`, the `[table]` parameter comes from the URL:
- `/menu/1` → Table 1
- `/menu/vip-corner` → VIP Corner
- `/menu/outdoor-5` → Outdoor 5

### Add Categories
Update in your admin menu management or edit database directly

### Add Dietary Tags
Edit menu item customizations:
```javascript
dietary_tags: ['vegan', 'gluten-free']
```

### Change Tax Rate
Find `TAX_RATE = 0.1` (10%) in:
- `components/menu/CartPanel.tsx`
- `app/api/public/orders/route.ts`

---

## Common Tasks

### Add a New Menu Item
```bash
# Via admin dashboard at /admin/menu
1. Click "Add Item"
2. Enter name, category, price
3. Add description and image
4. Set dietary tags
5. Mark as recommended if applicable
6. Save
```

Or via API:
```bash
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cappuccino",
    "category": "Coffee",
    "price": 35000,
    "description": "Rich espresso with steamed milk"
  }'
```

### Test an Order
1. Go to `/menu/test-table`
2. Add some items
3. Click cart button
4. Fill in details
5. Click "Confirm Order"
6. Check console for success message

### Check Orders
```bash
curl http://localhost:3000/api/orders
```

### View Menu Items
```bash
curl http://localhost:3000/api/public/menu
```

---

## Design System

### Colors
| Use | Color | Code |
|-----|-------|------|
| Primary (buttons, links) | Brown | `#8b7355` |
| Text | Dark Charcoal | `#1a1a1a` |
| Background | White | `#ffffff` |
| Borders | Light Gray | `#e5e5e5` |
| Success | Green | `#2ecc71` |
| Error | Red | `#e74c3c` |
| Warning | Orange | `#f39c12` |

### Typography
- **Headings:** Bold, tight spacing
- **Body:** 14px, 1.6 line height
- **Font:** System fonts (no web fonts for speed)

### Spacing
- Use Tailwind spacing scale: `p-4`, `m-6`, `gap-2`
- Consistent 4px base unit
- Ample whitespace for clean look

### Components
- Buttons: 44px minimum height (touch-friendly)
- Cards: 8px border radius
- Modals: Slide in from bottom (mobile), center (desktop)

---

## Responsive Design

### Mobile (< 640px)
- 1 column menu grid
- Bottom sheet modals
- Full-width buttons
- Optimized for thumb interaction

### Tablet (640px - 1024px)
- 2 column menu grid
- Increased padding
- Balanced layout

### Desktop (> 1024px)
- 3 column menu grid
- Side panels available
- Modal centering

---

## Performance Tips

1. **Image Optimization:** Uses emojis (no HTTP requests)
2. **Caching:** Menu data cached via SWR
3. **Code Splitting:** Components load on demand
4. **Minimal Dependencies:** Only essential packages

Load time targets:
- First paint: < 1s
- Menu loads: < 2s
- Add to cart: < 100ms
- Checkout: < 200ms

---

## Troubleshooting

### Menu Won't Load
```
1. Check: npm run dev is running
2. Check: Database connection works
3. Check: /api/public/menu returns data
4. Check: Browser console for errors
```

### Orders Not Saving
```
1. Check: DATABASE_URL is set
2. Check: POST /api/public/orders works
3. Check: Database has write permissions
4. Check: Order data is valid
```

### Styling Looks Wrong
```
1. Check: globals.css is imported
2. Check: Tailwind CSS is configured
3. Check: Browser cache is cleared (Ctrl+Shift+Del)
4. Check: No conflicting CSS
```

### QR Code Won't Scan
```
1. Check: QR code has good contrast
2. Check: QR code isn't damaged
3. Check: Using correct URL format
4. Check: Domain is accessible
```

---

## Next Steps

1. **Customize Colors** - Match your brand
2. **Add Menu Items** - Input your coffee shop menu
3. **Generate QR Codes** - See QR_CODE_SETUP.md
4. **Train Staff** - Show team the new system
5. **Deploy** - Push to production
6. **Monitor** - Check orders and performance

---

## Documentation Files

- `MENU_REDESIGN.md` - Complete feature guide
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `QR_CODE_SETUP.md` - QR code generation guide
- `QUICK_START.md` - This file

---

## Support

Need help? Check:
1. Console for error messages (`F12` → Console)
2. Documentation files listed above
3. Git commit history for recent changes
4. API responses with detailed error messages

---

## Summary

You now have a modern, professional menu system that:
- Works perfectly on mobile devices
- Integrates with your existing system
- Handles orders and payments
- Tracks inventory
- Provides excellent user experience

**Ready to deploy! 🚀**
