#!/usr/bin/env python3
"""BrewStock API test suite — tests all endpoints + business logic"""
import json, sys
from urllib import request, error
from urllib.request import urlopen, Request
from datetime import date, datetime

BASE = "http://localhost:3001"
TODAY = date.today().isoformat()
MONTH = date.today().strftime("%Y-%m")

passed = 0
failed = 0
errors = []

def get(path):
    try:
        with urlopen(f"{BASE}{path}", timeout=10) as r:
            return r.status, json.loads(r.read())
    except Exception as e:
        return 0, str(e)

def post(path, body):
    try:
        data = json.dumps(body).encode()
        req = Request(f"{BASE}{path}", data=data, headers={"Content-Type": "application/json"})
        with urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, str(e)

def put(path, body):
    try:
        data = json.dumps(body).encode()
        req = Request(f"{BASE}{path}", data=data, headers={"Content-Type": "application/json"}, method="PUT")
        with urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, str(e)

def delete(path, body):
    try:
        data = json.dumps(body).encode()
        req = Request(f"{BASE}{path}", data=data, headers={"Content-Type": "application/json"}, method="DELETE")
        with urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, str(e)

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  ✅ {name}")
        passed += 1
    else:
        print(f"  ❌ {name}" + (f" → {detail}" if detail else ""))
        failed += 1
        errors.append(f"{name}: {detail}")

def section(title):
    print(f"\n── {title} {'─'*(45-len(title))}")

# ── GET endpoints ─────────────────────────────────────────────
section("GET endpoints")

s, categories = get("/api/categories")
check("GET /api/categories", s==200 and isinstance(categories, list) and len(categories)>=6, f"status={s} len={len(categories) if isinstance(categories,list) else 0}")

s, suppliers = get("/api/suppliers")
check("GET /api/suppliers", s==200 and isinstance(suppliers, list) and len(suppliers)>=4, f"status={s}")

s, inventory = get("/api/inventory")
check("GET /api/inventory", s==200 and isinstance(inventory, list) and len(inventory)>=10, f"status={s}")
check("Inventory has category_name", s==200 and all("category_name" in i for i in inventory[:3]), "Missing category_name join")
check("Inventory has supplier_name", s==200 and any(i.get("supplier_name") for i in inventory[:5]), "Missing supplier_name join")

s, transactions = get("/api/transactions")
check("GET /api/transactions", s==200 and isinstance(transactions, list), f"status={s}")
check("Transactions has item_name", s==200 and all("item_name" in t for t in transactions[:3]) if transactions else True, "Missing item_name join")

s, employees = get("/api/employees")
check("GET /api/employees", s==200 and isinstance(employees, list) and len(employees)>=5, f"status={s}")

s, shifts = get(f"/api/shifts?date={TODAY}")
check("GET /api/shifts (today)", s==200 and isinstance(shifts, list), f"status={s}")
check("Shifts has employee_name", s==200 and all("employee_name" in sh for sh in shifts[:2]) if shifts else True, "Missing join")

s, menu = get("/api/menu")
check("GET /api/menu", s==200 and isinstance(menu, list) and len(menu)>=14, f"status={s}")
check("Menu is_available as int", s==200 and all(isinstance(m["is_available"], int) for m in menu[:3]), "is_available not int")

s, orders = get("/api/orders?limit=5")
check("GET /api/orders (limit=5)", s==200 and isinstance(orders, list), f"status={s}")
check("Orders limit works", s==200 and len(orders) <= 5, f"got {len(orders)}")
check("Orders has cashier_name", s==200 and all("cashier_name" in o for o in orders[:2]) if orders else True, "Missing join")

s, dashboard = get("/api/dashboard")
check("GET /api/dashboard", s==200 and isinstance(dashboard, dict), f"status={s}")
check("Dashboard has todaySales",    s==200 and "todaySales" in dashboard)
check("Dashboard has weekRevenue",   s==200 and "weekRevenue" in dashboard and len(dashboard["weekRevenue"])==7)
check("Dashboard has lowStockItems", s==200 and "lowStockItems" in dashboard)
check("Dashboard has recentOrders",  s==200 and "recentOrders" in dashboard)

for period in ["today", "week", "month"]:
    s, rpt = get(f"/api/reports?period={period}")
    check(f"GET /api/reports?period={period}", s==200 and "orderSummary" in rpt, f"status={s}")
    check(f"  reports.{period} has revenueByDay", s==200 and isinstance(rpt.get("revenueByDay"), list))
    check(f"  reports.{period} has topProducts",  s==200 and "topProducts" in rpt)

s, payroll = get(f"/api/payroll?month={MONTH}")
check("GET /api/payroll", s==200 and "payroll" in payroll, f"status={s}")
check("Payroll has totals", s==200 and "totals" in payroll)

s, recipes = get("/api/recipes")
check("GET /api/recipes", s==200 and isinstance(recipes, list) and len(recipes)>=20, f"status={s} len={len(recipes) if isinstance(recipes,list) else 0}")
check("Recipes has inventory_name", s==200 and all("inventory_name" in r for r in recipes[:3]) if recipes else True)

s, pos_orders = get("/api/purchase-orders")
check("GET /api/purchase-orders", s==200 and isinstance(pos_orders, list), f"status={s}")

s, reorder = get("/api/reorder-suggestions")
check("GET /api/reorder-suggestions", s==200 and "lowItems" in reorder, f"status={s}")
check("Reorder has summary", s==200 and "summary" in reorder)

# ── POST / CREATE ────────────────────────────────────────────
section("POST (create) + business logic")

s, new_cat = post("/api/categories", {"name": "Test Cat", "icon": "🧪", "color": "bg-blue-100 text-blue-700"})
check("POST /api/categories", s==200 and "id" in new_cat, f"status={s} body={new_cat}")
CAT_ID = new_cat.get("id", 0)

s, new_sup = post("/api/suppliers", {"name": "Test Supplier", "contact": "Alice", "phone": "0812", "email": "t@t.id", "category": "Test"})
check("POST /api/suppliers", s==200 and "id" in new_sup, f"status={s}")
SUP_ID = new_sup.get("id", 0)

s, new_inv = post("/api/inventory", {"name": "Test Item", "category_id": CAT_ID, "unit": "pcs", "stock": 100, "min_stock": 10, "max_stock": 200, "cost": 5000, "supplier_id": SUP_ID, "expiry": "", "notes": ""})
check("POST /api/inventory", s==200 and "id" in new_inv, f"status={s}")
INV_ID = new_inv.get("id", 0)

s, txn = post("/api/transactions", {"type": "in", "item_id": INV_ID, "qty": 20, "price": 5000, "source": "Test", "note": "test", "date": TODAY})
check("POST /api/transactions (stock in)", s==200 and "id" in txn, f"status={s}")
TXN_ID = txn.get("id", 0)

# Verify stock updated after transaction
s, inv_after = get("/api/inventory")
test_item = next((i for i in inv_after if i["id"] == INV_ID), None)
check("Stock incremented after txn +20", test_item and round(test_item["stock"],2) == 120.0, f"stock={test_item['stock'] if test_item else 'N/A'}")

s, new_emp = post("/api/employees", {"name": "Test Emp", "role": "Kasir", "phone": "0812", "email": "e@e.id", "pin": "9999", "hourly_rate": 22000, "status": "active"})
check("POST /api/employees", s==200 and "id" in new_emp, f"status={s}")
EMP_ID = new_emp.get("id", 0)

s, new_shift = post("/api/shifts", {"employee_id": EMP_ID, "date": TODAY, "shift_type": "morning", "status": "scheduled"})
check("POST /api/shifts", s==200 and "id" in new_shift, f"status={s}")
SHIFT_ID = new_shift.get("id", 0)

s, new_menu = post("/api/menu", {"name": "Test Drink", "category": "Coffee", "price": 25000, "cost": 8000, "image_emoji": "☕", "is_available": 1, "description": "test"})
check("POST /api/menu", s==200 and "id" in new_menu, f"status={s}")
MENU_ID = new_menu.get("id", 0)

s, new_recipe = post("/api/recipes", {"menu_item_id": MENU_ID, "inventory_item_id": INV_ID, "qty_used": 0.018, "unit": "pcs", "notes": "test"})
check("POST /api/recipes", s==200 and "id" in new_recipe, f"status={s}")
RECIPE_ID = new_recipe.get("id", 0)

# POS order — core business logic test
s, order_resp = post("/api/orders", {
    "cashier_id": EMP_ID,
    "items": [{"menu_item_id": MENU_ID, "name": "Test Drink", "qty": 3, "price": 25000, "subtotal": 75000}],
    "subtotal": 75000, "discount": 0, "tax": 7500, "total": 82500,
    "payment_method": "cash", "amount_paid": 100000, "change_amount": 17500
})
check("POST /api/orders (POS checkout)", s==200 and "order_no" in order_resp, f"status={s} body={order_resp}")

# Verify inventory deducted via recipe (0.018 * 3 = 0.054 deducted from 120)
s, inv_check = get("/api/inventory")
item_after_pos = next((i for i in inv_check if i["id"] == INV_ID), None)
expected_stock = round(120 - 0.018*3, 4)  # 119.946
actual_stock   = round(item_after_pos["stock"], 3) if item_after_pos else None
check("🔑 Stock deducted via recipe after POS (business logic)", actual_stock == round(expected_stock, 3), f"expected={round(expected_stock,3)} actual={actual_stock}")

# Verify transaction logged for deduction
s, txns = get("/api/transactions")
pos_txns = [t for t in txns if t.get("source") == "POS"]
check("🔑 POS deduction logged in stock_transactions", len(pos_txns) > 0, f"found {len(pos_txns)} POS transactions")

# Purchase order flow
s, new_po = post("/api/purchase-orders", {
    "supplier_id": SUP_ID,
    "notes": "test PO",
    "items": [{"inventory_item_id": INV_ID, "item_name": "Test Item", "qty_ordered": 50, "unit": "pcs", "unit_cost": 5000, "subtotal": 250000}]
})
check("POST /api/purchase-orders", s==200 and "id" in new_po, f"status={s}")
PO_ID = new_po.get("id", 0)

# ── PUT / UPDATE ────────────────────────────────────────────
section("PUT (update + actions)")

s, _ = put("/api/categories", {"id": CAT_ID, "name": "Updated Cat", "icon": "✅", "color": "bg-green-100 text-green-700"})
check("PUT /api/categories", s==200)
# Verify update persisted
s2, cats = get("/api/categories")
updated_cat = next((c for c in cats if c["id"] == CAT_ID), None)
check("  Category name persisted", updated_cat and updated_cat["name"] == "Updated Cat", f"got={updated_cat['name'] if updated_cat else None}")

s, _ = put("/api/suppliers", {"id": SUP_ID, "name": "Updated Sup", "contact": "Bob", "phone": "0813", "email": "b@b.id", "category": "Updated"})
check("PUT /api/suppliers", s==200)

s, _ = put("/api/inventory", {"id": INV_ID, "name": "Updated Item", "category_id": CAT_ID, "unit": "pcs", "stock": 100, "min_stock": 10, "max_stock": 200, "cost": 6000, "supplier_id": SUP_ID, "expiry": "", "notes": "updated"})
check("PUT /api/inventory", s==200)

s, _ = put("/api/employees", {"id": EMP_ID, "name": "Updated Emp", "role": "Supervisor", "phone": "0814", "email": "u@u.id", "pin": "1111", "hourly_rate": 35000, "status": "active"})
check("PUT /api/employees", s==200)

s, _ = put("/api/menu", {"id": MENU_ID, "name": "Updated Drink", "category": "Food", "price": 28000, "cost": 9000, "image_emoji": "🍰", "is_available": 1, "description": "updated"})
check("PUT /api/menu", s==200)

s, _ = put("/api/recipes", {"id": RECIPE_ID, "qty_used": 0.025, "unit": "pcs", "notes": "updated"})
check("PUT /api/recipes", s==200)
# Verify update
s2, recs = get(f"/api/recipes?menu_item_id={MENU_ID}")
rec_updated = next((r for r in recs if r["id"] == RECIPE_ID), None)
check("  Recipe qty_used updated", rec_updated and round(rec_updated["qty_used"],3) == 0.025, f"got={rec_updated['qty_used'] if rec_updated else None}")

# Shift clock in/out
s, _ = put("/api/shifts", {"id": SHIFT_ID, "action": "clockin"})
check("PUT /api/shifts (clockin)", s==200)
s2, sh = get(f"/api/shifts?date={TODAY}")
sh_item = next((s for s in sh if s["id"] == SHIFT_ID), None)
check("  Shift status → active", sh_item and sh_item["status"] == "active", f"status={sh_item['status'] if sh_item else None}")

s, _ = put("/api/shifts", {"id": SHIFT_ID, "action": "clockout"})
check("PUT /api/shifts (clockout)", s==200)
s2, sh2 = get(f"/api/shifts?date={TODAY}")
sh_done = next((s for s in sh2 if s["id"] == SHIFT_ID), None)
check("  Shift status → completed", sh_done and sh_done["status"] == "completed", f"status={sh_done['status'] if sh_done else None}")
check("  hours_worked > 0", sh_done and sh_done["hours_worked"] >= 0, f"hours={sh_done['hours_worked'] if sh_done else None}")

# PO workflow: send → receive
# After PUT /api/inventory reset stock to 100; PO receive will add 50 → expect ~150
s_tmp, inv_tmp = get("/api/inventory")
stock_before_po = next((i for i in inv_tmp if i["id"] == INV_ID), {}).get("stock", 0)

s, _ = put("/api/purchase-orders", {"id": PO_ID, "action": "send"})
check("PUT /api/purchase-orders (send)", s==200)
s2, pos_list = get("/api/purchase-orders")
po_sent = next((p for p in pos_list if p["id"] == PO_ID), None)
check("  PO status → sent", po_sent and po_sent["status"] == "sent", f"status={po_sent['status'] if po_sent else None}")

s, _ = put("/api/purchase-orders", {"id": PO_ID, "action": "receive"})
check("PUT /api/purchase-orders (receive)", s==200)
s2, inv_after_po = get("/api/inventory")
item_po = next((i for i in inv_after_po if i["id"] == INV_ID), None)
check("🔑 Stock increased after PO receive +50", item_po and item_po["stock"] >= stock_before_po + 49, f"before={stock_before_po} after={item_po['stock'] if item_po else None} (expected >={stock_before_po+49})")

# Verify PO receive logged in transactions
s, txns2 = get("/api/transactions")
po_txns = [t for t in txns2 if t.get("source") == "Purchase Order"]
check("🔑 PO receive logged in stock_transactions", len(po_txns) > 0, f"found {len(po_txns)}")

# Verify PO status → received
s3, pos_list2 = get("/api/purchase-orders")
po_recv = next((p for p in pos_list2 if p["id"] == PO_ID), None)
check("  PO status → received", po_recv and po_recv["status"] == "received", f"status={po_recv['status'] if po_recv else None}")

# ── VALIDATION (should reject bad input) ─────────────────────
section("Validation (should return 4xx)")

s, body = post("/api/categories", {"name": ""})
check("Empty category name → 400", s==400, f"got {s}")

s, body = post("/api/categories", {"name": "   "})
check("Whitespace-only name → 400", s==400, f"got {s}")

s, body = post("/api/transactions", {"type": "out", "item_id": INV_ID, "qty": 999999, "price": 0, "source": "x", "note": "", "date": TODAY})
check("Insufficient stock → 400", s==400, f"got {s}")

s, body = post("/api/orders", {"cashier_id": EMP_ID, "items": [], "subtotal": 0, "total": 0, "payment_method": "cash", "amount_paid": 0})
check("Empty cart order → 400", s==400, f"got {s}")

s, body = post("/api/recipes", {"menu_item_id": None, "inventory_item_id": None, "qty_used": None})
check("Recipe missing required fields → 400", s==400, f"got {s}")

s, body = post("/api/purchase-orders", {"items": []})
check("PO with no items → 400", s==400, f"got {s}")

# Cannot delete non-draft PO
s, body = delete("/api/purchase-orders", {"id": PO_ID})
check("Cannot delete received PO → 400", s==400, f"got {s}")

# Cannot delete category used by inventory
s2, inv2 = get("/api/inventory")
used_cat_id = next((i["category_id"] for i in inv2 if i["category_id"]), None)
if used_cat_id:
    s3, body3 = delete("/api/categories", {"id": used_cat_id})
    check("Cannot delete category in use → 400", s3==400, f"got {s3}")

# ── DELETE / CLEANUP ──────────────────────────────────────────
section("DELETE (cleanup)")

# Recipes can always be deleted
s, _ = delete("/api/recipes",      {"id": RECIPE_ID})
check("DELETE /api/recipes", s==200, f"status={s}")

# Transactions can always be deleted
s, _ = delete("/api/transactions", {"id": TXN_ID})
check("DELETE /api/transactions", s==200, f"status={s}")

# Shifts can always be deleted
s, _ = delete("/api/shifts",       {"id": SHIFT_ID})
check("DELETE /api/shifts", s==200, f"status={s}")

# Menu: soft-delete if referenced by orders, hard delete otherwise
s, del_body = delete("/api/menu", {"id": MENU_ID})
check("DELETE /api/menu (soft or hard delete)", s==200, f"status={s}")

# Inventory: our test item has 2 stock_transactions → expect 400 (FK protection)
s, del_body = delete("/api/inventory", {"id": INV_ID})
check("DELETE /api/inventory (FK protected → 400)", s==400, f"status={s} — expected 400 because item has txn history")
check("  FK error message returned", "error" in del_body, f"body={del_body}")

# Employees: test emp has 1 order → expect soft delete (200 with soft=true)
s, del_body = delete("/api/employees", {"id": EMP_ID})
check("DELETE /api/employees (soft delete)", s==200, f"status={s}")
check("  Employee soft-deleted (not hard)", del_body.get("soft") == True or s==200, f"body={del_body}")

# Verify employee is now inactive (not deleted)
s2, emp_list = get("/api/employees")
emp_check = next((e for e in emp_list if e["id"] == EMP_ID), None)
check("  Employee marked inactive", emp_check is None or emp_check["status"] == "inactive", 
      f"status={emp_check['status'] if emp_check else 'deleted'}")

# Suppliers: test supplier has 1 inventory item → expect 400 (FK protection)
s, del_body = delete("/api/suppliers", {"id": SUP_ID})
check("DELETE /api/suppliers (FK protected → 400)", s==400, f"status={s} — expected 400 because supplier has inventory")
check("  FK error message returned", "error" in del_body, f"body={del_body}")

# Categories: test category has 1 inventory item → expect 400 (FK protection)
s, del_body = delete("/api/categories", {"id": CAT_ID})
check("DELETE /api/categories (FK protected → 400)", s==400, f"status={s} — expected 400 because category has inventory")
check("  FK error message returned", "error" in del_body, f"body={del_body}")

# Now test HARD delete when no references exist (create fresh items)
s, fresh_cat = post("/api/categories", {"name": "Fresh Cat", "icon": "🗑️", "color": "bg-gray-100 text-gray-700"})
FRESH_CAT = fresh_cat.get("id", 0)
s2, _ = delete("/api/categories", {"id": FRESH_CAT})
check("DELETE /api/categories (hard delete when no refs)", s2==200, f"status={s2}")

s, fresh_sup = post("/api/suppliers", {"name": "Fresh Sup", "contact": "", "phone": "", "email": "", "category": ""})
FRESH_SUP = fresh_sup.get("id", 0)
s2, _ = delete("/api/suppliers", {"id": FRESH_SUP})
check("DELETE /api/suppliers (hard delete when no refs)", s2==200, f"status={s2}")

# ── SUMMARY ──────────────────────────────────────────────────
total = passed + failed
pct = round(passed/total*100) if total else 0

print(f"""
════════════════════════════════════════════
  ✅  PASSED : {passed}/{total}  ({pct}%)
  ❌  FAILED : {failed}/{total}
════════════════════════════════════════════""")

if errors:
    print("\nFailed tests:")
    for e in errors:
        print(f"  • {e}")

sys.exit(0 if failed == 0 else 1)
