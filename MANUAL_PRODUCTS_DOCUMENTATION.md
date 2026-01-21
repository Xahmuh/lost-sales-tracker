# Manual Products Handling - Documentation

## Overview
This document explains how manual products (products not in the main products database) are handled in the Lost Sales Tracker system.

## Key Concept
**Manual products are NOT saved to the `products` table.** They exist only in the `lost_sales` and `shortages` records.

## How It Works

### 1. Creating a Manual Product
When a user searches for a product that doesn't exist:
- The system opens `ManualProductModal`
- User enters: Product Name, Price, Agent, Category
- On save, a **temporary product object** is created in memory only

### 2. Temporary Product Object
```typescript
{
  id: `manual_${Date.now()}_${Math.random()}`, // Temporary ID (not saved to DB)
  name: "Product Name",
  defaultPrice: 5.500,
  agent: "Agent Name",
  category: "Category",
  isManual: true,
  createdByBranch: "branch-uuid",
  internalCode: undefined,
  internationalCode: undefined
}
```

### 3. Adding to Cart
When the temporary product is added to cart:
- `productId` is set to **`null`** (not the temporary ID)
- `productName`, `agentName`, `category` are saved directly
- `isManual` flag is set to `true`
- `priceSource` is set to `'manual'`

### 4. Saving to Database
When the cart is checked out:

**For Lost Sales:**
```sql
INSERT INTO lost_sales (
  branch_id,
  pharmacist_id,
  pharmacist_name,
  product_id,        -- NULL for manual products
  product_name,      -- Saved directly
  agent_name,        -- Saved directly
  category,          -- Saved directly
  unit_price,
  quantity,
  price_source,      -- 'manual'
  is_manual,         -- true
  ...
)
```

**For Shortages:**
```sql
INSERT INTO shortages (
  branch_id,
  pharmacist_id,
  product_id,        -- NULL for manual products
  product_name,      -- Saved directly
  pharmacist_name,
  status,
  ...
)
```

## Database Schema

### products table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  agent TEXT,
  default_price NUMERIC(10, 3),
  is_manual BOOLEAN DEFAULT false,
  ...
);
```
**Note:** Manual products from POS are **NOT** inserted here.

### lost_sales table
```sql
CREATE TABLE lost_sales (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),  -- NULLABLE (can be NULL)
  product_name TEXT NOT NULL,               -- Always saved
  agent_name TEXT,                          -- Always saved
  category TEXT,                            -- Always saved
  is_manual BOOLEAN DEFAULT false,          -- Flag for manual products
  price_source TEXT,                        -- 'db' or 'manual'
  ...
);
```

### shortages table
```sql
CREATE TABLE shortages (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),  -- NULLABLE (can be NULL)
  product_name TEXT NOT NULL,               -- Always saved
  ...
);
```

## Benefits of This Approach

1. **Clean Product Database**
   - Only real inventory products in `products` table
   - No pollution from one-time manual entries

2. **Complete Data Capture**
   - All manual product information is preserved in the sales/shortage records
   - Product name, agent, category are saved directly

3. **Accurate Reporting**
   - Manual products appear in KPIs and Excel exports
   - Clearly marked with `isManual: true` flag
   - Can be filtered or analyzed separately

4. **Database Integrity**
   - No orphaned product records
   - No foreign key conflicts
   - Clean data separation

## Excel Export Behavior

Manual products in Excel exports:
- **Internal Code**: Shows "N/A" (since no product_id)
- **Product Name**: Shows the entered name
- **Agent**: Shows the entered agent name
- **Category**: Shows the entered category
- **Price Source**: Shows "manual"

## Code References

### POS Page (`app/pos/page.tsx`)
- **Line 471-489**: Manual product modal handler (creates temp object)
- **Line 78, 95**: Sets `productId` to `null` for manual products
- **Line 84**: Sets `priceSource` to `'manual'`

### Manual Product Modal (`components/ManualProductModal.tsx`)
- Returns product data without saving to database
- User enters: name, price, agent, category

### Dashboard Export (`app/dashboard/page.tsx`)
- **Line 554-572**: Handles products with `null` productId
- Shows "N/A" for internal code when product_id is null

## Summary

✅ Manual products are **NOT** saved to `products` table  
✅ Manual products exist **ONLY** in `lost_sales` and `shortages` records  
✅ All product information is preserved in the transaction records  
✅ Manual products appear in all reports and KPIs  
✅ Clean separation between inventory products and manual entries  
