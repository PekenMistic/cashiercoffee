# Menu Meja - Modern Digital Menu System for Coffee Shops

> A complete redesign of the table menu system with modern, minimalist design, advanced features, and seamless integration with BrewStock management system.

## ✨ What's New

Your Menu Meja system has been completely redesigned from the ground up with:

- **🎨 Modern Design** - Minimalist, elegant aesthetic with warm, professional color scheme
- **📱 Perfect Mobile Experience** - Fully responsive design optimized for customer phones
- **🔍 Smart Search & Filtering** - Real-time search and multi-select category/dietary filtering
- **🛒 Intelligent Shopping Cart** - Smart cart with customization options and real-time calculations
- **💳 Payment Integration** - Support for multiple payment methods (Cash, Card, QRIS)
- **📊 Inventory Management** - Real-time stock tracking and automatic inventory deduction
- **🎯 User-Friendly Interface** - Intuitive navigation, smooth animations, excellent UX
- **♿ Accessible** - WCAG compliant, keyboard navigable, screen reader friendly

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm or yarn
- Database configured (SQLite)

### Installation

1. **Clone and install dependencies**
```bash
npm install
# or
pnpm install
```

2. **Set up environment variables**
```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Add your database URL
echo "DATABASE_URL=file:./db.sqlite" >> .env.local
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open in browser**
Visit `http://localhost:3000/menu/1` (Table 1)

### Generate QR Codes

For production deployment, see [QR_CODE_SETUP.md](./QR_CODE_SETUP.md)

## 📚 Documentation

We've provided comprehensive documentation:

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](./QUICK_START.md) | 5-minute setup for developers |
| [MENU_REDESIGN.md](./MENU_REDESIGN.md) | Complete feature documentation |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | What was built and why |
| [QR_CODE_SETUP.md](./QR_CODE_SETUP.md) | QR code generation and deployment |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-launch verification checklist |
| [REDESIGN_OVERVIEW.txt](./REDESIGN_OVERVIEW.txt) | High-level project overview |

## 🎯 Core Features

### 1. Search & Discovery
- Real-time search across item names and descriptions
- Category-based filtering (Coffee, Food, Beverages, etc.)
- Dietary preference filters (Vegan, Vegetarian, Gluten-free)
- Recommended items highlighting
- Real-time stock availability

### 2. Shopping Cart
- Smooth add/remove operations
- Quantity adjustments with +/- buttons
- Customization options (size, toppings, special instructions)
- Real-time subtotal, tax, and total calculation
- Visual feedback animations

### 3. Checkout & Payment
- Multiple payment methods (Cash, Card, QRIS)
- Automatic 10% tax calculation
- Order confirmation with order number
- Table-linked order tracking
- Inventory automatic deduction

### 4. Admin Integration
- Real-time menu sync from admin dashboard
- Live inventory tracking
- Order history and analytics
- Multi-location support
- Easy menu management

## 🏗️ Architecture

### Component Structure
```
components/menu/
├── MenuHeader.tsx           # Sticky header with search
├── FilterBar.tsx            # Category & dietary filters
├── MenuCard.tsx             # Individual item card
├── MenuGrid.tsx             # Responsive grid layout
├── CartPanel.tsx            # Shopping cart interface
├── ItemDetailsModal.tsx      # Item details & customization
└── CheckoutModal.tsx        # Order review & payment
```

### State Management
Using Zustand for cart and filter state:
- Cart operations (add, remove, update)
- Filter management (search, categories, dietary)
- Modal state (item details, checkout)

### Data Flow
```
Menu Page
  ├─ Fetch menu items via SWR
  ├─ Apply filters via Zustand store
  ├─ Display items in MenuGrid
  └─ Handle cart operations
```

## 🎨 Design System

### Color Palette
| Purpose | Color | Code |
|---------|-------|------|
| Primary | Warm Brown | `#8b7355` |
| Text | Dark Charcoal | `#1a1a1a` |
| Background | White | `#ffffff` |
| Border | Light Gray | `#e5e5e5` |
| Success | Green | `#2ecc71` |
| Error | Red | `#e74c3c` |
| Warning | Orange | `#f39c12` |

### Typography
- **Font**: System fonts (optimal performance)
- **Headings**: Bold with tight letter spacing
- **Body**: 14px with 1.6 line height
- **Scale**: 3:2 ratio for harmonious sizing

### Spacing
- **Base Unit**: 4px
- **Scale**: 4, 8, 12, 16, 20, 24, 28, 32px
- **Padding/Margin**: Uses Tailwind scale (p-4, m-6, etc.)

## 📱 Responsive Design

### Mobile (< 640px)
- Single-column menu grid
- Bottom-sheet cart overlay
- Touch-optimized buttons (44x44px minimum)
- Full-width form inputs

### Tablet (640px - 1024px)
- Two-column menu grid
- Flexible spacing
- Balanced layout

### Desktop (> 1024px)
- Three-column menu grid
- Side panels available
- Expanded modal centering
- Enhanced interactions

## 🔧 API Endpoints

### Public Endpoints (Customer-facing)
```
GET /api/public/menu
  Returns: Array of available menu items

POST /api/public/orders
  Body: { table_no, items, payment_method, notes }
  Returns: { order_id, order_number, total }

GET /api/public/orders?order_id=X
  Returns: Order details and items
```

### Admin Endpoints
```
GET /api/menu
  Returns: All menu items with details

POST /api/menu
  Creates new menu item

PUT /api/menu
  Updates menu item

DELETE /api/menu
  Deletes or soft-deletes menu item
```

## 💾 Database Schema

### Enhanced Menu Items Table
```sql
CREATE TABLE menu_items (
  id                INTEGER PRIMARY KEY,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,
  price             REAL NOT NULL,
  cost              REAL DEFAULT 0,
  image_emoji       TEXT DEFAULT '☕',
  image_url         TEXT DEFAULT '',
  is_available      BOOLEAN DEFAULT true,
  description       TEXT DEFAULT '',
  dietary_tags      TEXT DEFAULT '',          -- JSON array
  is_recommended    BOOLEAN DEFAULT false,
  stock_quantity    REAL DEFAULT -1,          -- -1 = unlimited
  reorder_level     REAL DEFAULT 0,
  customizations    TEXT DEFAULT ''           -- JSON object
)
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|----------|
| Framework | Next.js 16 |
| Runtime | React 19.2 |
| State | Zustand 5.0 |
| Data Fetch | SWR 2.4 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Database | Drizzle ORM + SQLite |
| Language | TypeScript 5.0 |

## ⚡ Performance

### Optimization Techniques
- Image optimization (uses emojis to avoid HTTP requests)
- SWR caching with revalidation
- Code splitting and lazy loading
- Minimal dependencies
- CSS utility classes (no CSS bloat)
- Efficient state management

### Target Metrics
- First paint: < 1 second
- Menu load: < 2 seconds
- Search response: < 200ms
- Add to cart: < 100ms
- Bundle size: < 500KB

## ♿ Accessibility

### Features
- WCAG AA+ color contrast
- Keyboard navigation support
- Touch targets minimum 44x44px
- Semantic HTML structure
- Screen reader compatible
- Clear focus indicators
- Error message clarity
- Form label association

### Testing
```bash
# Run accessibility checks
npm run lint   # TypeScript and ESLint
```

## 🚀 Deployment

### Prerequisites
1. Database configured and running
2. Environment variables set
3. QR codes generated and tested
4. Menu items loaded
5. Staff trained

### Steps
1. Build the project: `npm run build`
2. Deploy to Vercel or your hosting
3. Configure environment variables
4. Run database migrations
5. Generate and install QR codes
6. Monitor for issues

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed checklist.

## 🧪 Testing

### Manual Testing Checklist
- [ ] Menu loads without errors
- [ ] Search works correctly
- [ ] Filters apply properly
- [ ] Add/remove items from cart
- [ ] Customization options save
- [ ] Checkout calculates correctly
- [ ] Orders save to database
- [ ] Inventory deductions work
- [ ] QR codes work on devices
- [ ] Responsive design looks good

### Browser Testing
- Chrome/Chromium
- Firefox
- Safari
- Edge
- Mobile browsers

## 🐛 Troubleshooting

### Menu Won't Load
1. Check `/api/public/menu` endpoint
2. Verify `DATABASE_URL` is set
3. Check browser console for errors
4. Try clearing cache and reload

### Orders Not Saving
1. Verify `/api/public/orders` accepts POST
2. Check database write permissions
3. Verify order payload structure
4. Check database connection

### QR Code Issues
1. Verify QR code has good contrast
2. Check code isn't damaged
3. Test with multiple scanning apps
4. Ensure URL is correct

See [MENU_REDESIGN.md](./MENU_REDESIGN.md) for more troubleshooting.

## 📊 Monitoring

### Key Metrics to Monitor
- Order volume and trends
- Average order value
- Payment method distribution
- System uptime
- Page load times
- Error rates
- Inventory accuracy
- Customer satisfaction

### Recommended Tools
- Google Analytics (usage tracking)
- Sentry (error tracking)
- Vercel Analytics (performance)
- Database monitoring tools

## 🔐 Security

### Implementation Details
- HTTPS enforced
- SQL injection prevention (via Drizzle ORM)
- XSS protection (React automatically)
- CSRF tokens (if needed)
- Input validation on all endpoints
- Secure environment variables
- Rate limiting ready

## 📈 Future Enhancements

### Short-term
- [ ] User authentication and accounts
- [ ] Order history for customers
- [ ] Photo uploads for menu items
- [ ] Multi-language support

### Medium-term
- [ ] Loyalty program integration
- [ ] AI-powered recommendations
- [ ] Real-time order notifications
- [ ] Advanced analytics dashboard

### Long-term
- [ ] Mobile app (React Native)
- [ ] Blockchain-based payments
- [ ] IoT integration
- [ ] Voice ordering

## 📝 License

This project is part of BrewStock Coffee Management System.

## 🙋 Support

### Getting Help
1. Check the documentation files
2. Review error messages in browser console
3. Check [MENU_REDESIGN.md](./MENU_REDESIGN.md) troubleshooting section
4. Contact support team

### Reporting Issues
1. Document the issue clearly
2. Note steps to reproduce
3. Include browser/device info
4. Provide console errors
5. Submit to development team

## 👥 Contributors

- **Design & Frontend**: Modern minimalist design system
- **Backend Integration**: Seamless API integration
- **Documentation**: Comprehensive guides and checklists
- **Quality Assurance**: Testing and validation

## 🎉 Summary

Menu Meja has been transformed into a modern, professional digital menu system that:
- **Delights customers** with beautiful, intuitive interface
- **Empowers your team** with easy management
- **Drives revenue** with increased order efficiency
- **Integrates seamlessly** with existing systems
- **Scales effortlessly** as your business grows

Ready to serve your customers the modern way! 🚀

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: April 13, 2026

For detailed information, see the documentation files included in this project.
