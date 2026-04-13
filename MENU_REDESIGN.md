# Menu Meja (Table Menu) Redesign - Complete Guide

## Overview

The Menu Meja system has been completely redesigned with a modern, minimalist, and elegant aesthetic. Customers scan a QR code at their table to access an interactive digital menu with advanced features including real-time search, category filtering, dietary information, customization options, and integrated payment processing.

## Design System

### Color Palette (Minimalist & Clean)
- **Primary**: Warm brown (`#8b7355`) - represents coffee and elegance
- **Text**: Dark charcoal (`#1a1a1a`) for excellent readability
- **Background**: Pure white (`#ffffff`) for clean, professional appearance
- **Accents**: Soft grays and warm neutrals for secondary elements
- **Status Colors**: Green (success), Red (error), Yellow (warning)

### Typography
- **System fonts**: Uses native system fonts for fast loading and consistency
- **Headings**: Bold, tight letter-spacing for modern look
- **Body text**: 14px base with 1.6 line height for comfortable reading on mobile

### Layout Approach
- **Mobile-first**: Optimized for phone screens (customer's primary use case)
- **Responsive**: Scales beautifully to tablets and larger screens
- **Flexbox-based**: Efficient, predictable layout across all devices

## Core Features

### 1. Search & Discovery
- **Search Bar**: Real-time search across item names and descriptions
- **Category Filters**: Browse by Coffee, Food, Beverages, etc.
- **Dietary Tags**: Filter by vegan, vegetarian, gluten-free, etc.
- **Recommended Items**: Highlighted bestsellers and staff picks
- **Availability Status**: Real-time stock status with out-of-stock badges

### 2. Item Details & Customization
- **Item Modal**: Detailed view with description, dietary info, allergens
- **Size Selection**: Small, Medium, Large options with price adjustments
- **Add-ons/Toppings**: Choose extra shots, syrups, milk alternatives
- **Special Instructions**: Notes field for custom preferences
- **Quantity Selection**: Easy increment/decrement before adding to cart

### 3. Smart Cart
- **Persistent Cart**: Items stay in cart for easy reordering
- **Quick Adjustments**: Modify quantities with +/- buttons
- **Remove Items**: Quick delete with trash icon
- **Real-time Totals**: Automatic subtotal, tax, and total calculation
- **Animated Notifications**: Visual feedback when items are added

### 4. Checkout & Payment
- **Multiple Payment Methods**: Cash, Card, QRIS (QR code payment)
- **Tax Calculation**: Automatic 10% tax inclusion
- **Order Summary**: Clear breakdown of all charges
- **Table Reference**: Order linked to specific table for kitchen workflow
- **Order Confirmation**: Receipt and status tracking

## Technology Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **State Management**: Zustand for cart and filter state
- **Data Fetching**: SWR for real-time menu sync
- **Database**: Drizzle ORM with SQLite
- **Icons**: Lucide React
- **UI Features**: Smooth animations and transitions

## Component Architecture

### Menu Components (`/components/menu/`)

1. **MenuHeader.tsx**
   - Sticky header with table number
   - Search input with clear button
   - Responsive padding and typography

2. **FilterBar.tsx**
   - Category selection buttons
   - Dietary filter options
   - Recommended items toggle
   - Reset filters button

3. **MenuGrid.tsx**
   - Responsive grid layout (1-3 columns based on screen size)
   - Dynamic item cards
   - Loading and error states

4. **MenuCard.tsx**
   - Item image/emoji display
   - Name, description, and price
   - Stock status badges
   - Quick add-to-cart button
   - Quantity counter when in cart

5. **ItemDetailsModal.tsx**
   - Full item details
   - Customization options (size, add-ons)
   - Quantity selector
   - Add to cart with customizations

6. **CartPanel.tsx**
   - Fixed bottom button when closed (shows total and item count)
   - Full modal view when open
   - Item list with quantity controls
   - Summary section with tax calculation
   - Checkout button

7. **CheckoutModal.tsx**
   - Order review
   - Payment method selection
   - Special instructions input
   - Order submission with loading state
   - Success confirmation

## Database Schema Updates

### New MenuItems Fields
- `image_url` - URL for item images (if using images instead of emojis)
- `dietary_tags` - JSON array of dietary info (vegan, vegetarian, gluten-free)
- `is_recommended` - Boolean flag for featured items
- `stock_quantity` - Real-time stock tracking (-1 = unlimited)
- `reorder_level` - Alert level for low stock
- `customizations` - JSON definition of available customization options

### Order Enhancement
- Enhanced `source` field to distinguish QR orders from POS
- `table_no` field to link orders to specific tables
- Full payment integration support

## API Endpoints

### Public Endpoints (Customer-facing)
- `GET /api/public/menu` - Fetch available menu items with all details
- `POST /api/public/orders` - Create new order from table menu
- `GET /api/public/orders?order_id=X` - Check order status

### Admin Endpoints
- `GET /api/menu` - Fetch all menu items (admin)
- `POST /api/menu` - Create menu item
- `PUT /api/menu` - Update menu item
- `DELETE /api/menu` - Delete/soft-delete menu item

## State Management with Zustand

### Cart Store (`/lib/store.ts`)

**Cart Operations:**
- `addItem(item)` - Add or increment item in cart
- `removeItem(id)` - Remove item from cart
- `updateItemQty(id, qty)` - Update item quantity
- `updateItemCustomizations(id, customizations)` - Update selected options
- `clearCart()` - Empty entire cart

**Filter Operations:**
- `setSearchQuery(query)` - Update search text
- `toggleCategory(category)` - Toggle category filter
- `toggleDietaryFilter(tag)` - Toggle dietary filter
- `toggleRecommendedOnly()` - Show only recommended items
- `toggleAvailableOnly()` - Show only in-stock items
- `resetFilters()` - Clear all filters

**Modal States:**
- `setSelectedItemId(id)` - Open/close item details modal
- `setCheckoutOpen(open)` - Toggle checkout modal

## Responsive Design Details

### Mobile (< 640px)
- Single column menu grid
- Full-width cart button at bottom
- Bottom sheet style modals
- Optimized touch targets (minimum 44px)
- Vertical scrolling primary interaction

### Tablet (640px - 1024px)
- Two column menu grid
- Side panel cart option available
- Modal corners slightly rounded
- Balanced spacing and padding

### Desktop (> 1024px)
- Three column menu grid
- Floating cart panel option
- Full modal with centered positioning
- Expanded views for item details

## Performance Optimization

- **Image Optimization**: Uses emoji rendering (no HTTP requests) or optimized image loading
- **SWR Caching**: Menu data cached and revalidated efficiently
- **Lazy Loading**: Components load on demand
- **CSS-in-JS**: Minimal CSS, leveraging Tailwind utility classes
- **Bundle Size**: Minimal dependencies with optimized tree-shaking

## Integration with Management System

### Real-time Sync
- Menu updates in admin panel immediately reflect in customer view
- Stock levels update in real-time when orders are created
- Inventory automatically deducted based on recipes

### Order Flow
1. Customer submits order via QR menu
2. Order created with status 'pending' or 'completed'
3. Kitchen staff sees order with table number
4. Customer can view order status
5. Historical data syncs to admin dashboard

### Analytics
- Orders from QR are tagged with `source: 'qr'`
- Table-based ordering provides traffic pattern insights
- Payment method tracking for reconciliation
- Customization preferences inform menu optimization

## Accessibility Features

- Semantic HTML structure
- Proper heading hierarchy
- Color contrast meets WCAG standards
- Touch-friendly button sizes (minimum 44x44px)
- Clear focus indicators for keyboard navigation
- Alt text for all icons and images

## Future Enhancements

1. **Image Upload**: Allow restaurant to upload actual photos instead of emojis
2. **Recommendations Engine**: AI-powered suggestions based on customer preferences
3. **Loyalty Integration**: QR menu linked to customer loyalty program
4. **Real-time Notifications**: Notify customer when order is ready
5. **Language Support**: Multi-language menu for international customers
6. **Allergen Warnings**: Prominent allergen information with warnings
7. **Nutritional Data**: Full nutritional information display
8. **Time Estimation**: Predicted wait times for each item

## Testing Checklist

- [ ] Search functionality works across all devices
- [ ] Category filters apply correctly
- [ ] Dietary filters work with multiple selections
- [ ] Add to cart increments existing items
- [ ] Quantity adjustments reflect in totals
- [ ] Remove item works correctly
- [ ] Customization options save properly
- [ ] Checkout calculates tax correctly
- [ ] All payment methods display properly
- [ ] Order submission creates record in database
- [ ] Responsive design looks good on mobile, tablet, desktop
- [ ] Load times are under 2 seconds
- [ ] Images/emojis load without errors
- [ ] No console errors in browser

## Deployment Notes

1. Ensure `DATABASE_URL` is properly configured
2. Run database migrations for new fields
3. Update admin menu management interface if needed
4. Set up QR codes to point to `/menu/[table-number]`
5. Test order flow end-to-end in staging
6. Monitor order creation and inventory deductions
7. Set up monitoring for API performance

## Support & Troubleshooting

### Common Issues

**Menu not loading:**
- Check `/api/public/menu` endpoint
- Verify `DATABASE_URL` environment variable
- Check browser console for fetch errors

**Orders not saving:**
- Verify `/api/public/orders` endpoint is working
- Check order payload structure
- Ensure database has write permissions

**Stock not updating:**
- Verify recipes are configured in admin
- Check inventory items linked correctly
- Monitor stock_transactions table

## Contact & Feedback

For issues or feature requests, contact the development team with:
- Issue description
- Steps to reproduce
- Device/browser information
- Console error messages (if any)
