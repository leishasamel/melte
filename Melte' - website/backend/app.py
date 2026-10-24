
from flask import Flask, request, jsonify, send_from_directory, session, redirect
from flask_cors import CORS
from pathlib import Path
from datetime import datetime, timezone
import json
import threading
import hmac
import os

app = Flask(__name__)

ADMIN_SECRET_FILE = Path(__file__).parent / ".admin_secret"

def get_admin_secret():
    configured = os.environ.get("ADMIN_PASSWORD", "").strip()
    if configured:
        return configured
    if ADMIN_SECRET_FILE.exists():
        return ADMIN_SECRET_FILE.read_text(
            encoding="utf-8"
        ).strip()
    return ""

# Use a dedicated session secret in production; retain the local fallback.
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "").strip()
if not app.secret_key and ADMIN_SECRET_FILE.exists():
    app.secret_key = ADMIN_SECRET_FILE.read_text(
        encoding="utf-8"
    ).strip()
if not app.secret_key:
    raise RuntimeError(
        "Set FLASK_SECRET_KEY or provide backend/.admin_secret"
    )

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=(
        os.environ.get("SESSION_COOKIE_SECURE", "false").lower()
        == "true"
    )
)

@app.after_request
def allow_local_checkout(response):
    allowed_origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    }
    configured_origins = os.environ.get("FRONTEND_ORIGIN", "")
    allowed_origins.update(
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    )

    origin = request.headers.get("Origin", "").rstrip("/")
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"

    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


ORDERS_FILE = Path(__file__).parent / "orders.json"
file_lock = threading.Lock()

# Admin authentication
def check_admin_key():
    expected_key = get_admin_secret()
    provided_key = request.headers.get("X-Admin-Key", "")

    return bool(expected_key) and hmac.compare_digest(
        provided_key,
        expected_key
    )

# Melte' chocolate products and prices
PRODUCTS = {
    1: ("Dark Chocolate", 249, "250g"),
    2: ("Chocolate Truffles", 399, "250g"),
    3: ("Milk Chocolate", 199, "250g"),
    4: ("Hazelnut Chocolate", 349, "250g"),
    5: ("Peanut Butter Chocolate", 129, "250g"),
    6: ("Peanut & Dates Chocolate", 139, "250g"),
    7: ("Coconut Chocolate", 119, "250g"),
    8: ("Dry Fruit Chocolate", 149, "250g"),
    9: ("Strawberry Chocolate", 300, "250g"),
    10: ("Mango Chocolate", 350, "250g"),
    11: ("Lotus Biscoff Chocolate", 400, "250g"),
    12: ("Kunafa Chocolate", 450, "250g"),
    13: ("Chocolate Brownies", 299, "250g"),
    14: ("Chocolate Gift Box", 599, "400g")
}


def load_orders():
    import sqlite3

    database = Path(__file__).parent / "melte.db"

    with sqlite3.connect(database) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            "SELECT * FROM orders ORDER BY order_id"
        ).fetchall()

    orders = []
    for row in rows:
        order = dict(row)
        order["items"] = json.loads(order.pop("items_json"))
        orders.append(order)

    return orders


def save_orders(orders):
    import sqlite3

    database = Path(__file__).parent / "melte.db"

    with sqlite3.connect(database) as connection:
        for order in orders:
            connection.execute(
                """
                INSERT INTO orders (
                    order_id, customer_name, phone, address,
                    items_json, total, payment_method,
                    status, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(order_id) DO UPDATE SET
                    customer_name=excluded.customer_name,
                    phone=excluded.phone,
                    address=excluded.address,
                    items_json=excluded.items_json,
                    total=excluded.total,
                    payment_method=excluded.payment_method,
                    status=excluded.status,
                    created_at=excluded.created_at
                """,
                (
                    order["order_id"],
                    order["customer_name"],
                    order["phone"],
                    order["address"],
                    json.dumps(order["items"]),
                    order["total"],
                    order["payment_method"],
                    order["status"],
                    order["created_at"]
                )
            )


@app.get("/api/health")
def health():
    return jsonify({
        "message": "Melte backend is running!"
    })
@app.get("/images/<path:filename>")
def serve_images(filename):
    return send_from_directory(
    Path(__file__).parent.parent / "images",
    filename
)
    

@app.post("/api/orders")
def create_order():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid order data"}), 400

    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()
    items = data.get("items", [])

    if not name or not phone or not address:
        return jsonify({
            "error": "Please enter all customer details"
        }), 400

    if len(name) > 100 or len(phone) > 20 or len(address) > 500:
        return jsonify({
            "error": "Customer details are too long"
        }), 400

    if not isinstance(items, list) or not 1 <= len(items) <= 100:
        return jsonify({
            "error": "Invalid shopping cart"
        }), 400

    current_products = {
        p["id"]: (p["name"], p["price"], p["quantity"])
        for p in get_products()
    }

    total = 0
    order_items = []

    for item in items:
        if not isinstance(item, dict):
            return jsonify({"error": "Invalid item"}), 400

        product_id = item.get("id")
        quantity = item.get("count")

        if (
            type(product_id) is not int
            or product_id not in current_products
            or type(quantity) is not int
            or not 1 <= quantity <= 50
        ):
            return jsonify({
                "error": "Invalid product or quantity"
            }), 400

        product_name, price, weight = current_products[product_id]

        total += price * quantity

        order_items.append({
            "product": product_name,
            "weight": weight,
            "quantity": quantity,
            "price": price,
            "subtotal": price * quantity
        })

    with file_lock:
        orders = load_orders()

        order_id = max(
            (order["order_id"] for order in orders),
            default=0
        ) + 1

        order = {
            "order_id": order_id,
            "customer_name": name,
            "phone": phone,
            "address": address,
            "items": order_items,
            "total": total,
            "payment_method": "Cash on Delivery",
            "status": "Pending",
            "created_at": datetime.now(
                timezone.utc
            ).isoformat()
        }

        orders.append(order)
        save_orders(orders)

    return jsonify({
        "message": "Order placed successfully!",
        "order_id": order_id,
        "total": total
    }), 201


@app.get("/api/admin/orders")
def admin_get_orders():
    if not check_admin_key():
        return jsonify({
            "error": "Unauthorized access"
        }), 401

    with file_lock:
        orders = load_orders()

    return jsonify({
        "total_orders": len(orders),
        "orders": list(reversed(orders))
    }), 200

# Serve the Melte' admin dashboard

@app.get("/admin")
def admin_dashboard():
    if not session.get("admin_logged_in"):
        return redirect("/admin/login")

    return send_from_directory(
        Path(__file__).parent / "admin",
        "admin.html"
    )



# Melte' Admin Login
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        password = request.form.get("password", "")

        expected_password = get_admin_secret()
        if not expected_password:
            return "Admin configuration missing", 500

        if hmac.compare_digest(password, expected_password):
            session.clear()
            session["admin_logged_in"] = True
            return redirect("/admin")

        return "Incorrect admin password. Please go back and try again.", 401

    return send_from_directory(
        Path(__file__).parent / "admin",
        "login.html"
    )


# Melte' Admin Logout
@app.post("/admin/logout")
def admin_logout():
    session.clear()
    return redirect("/admin/login")


# Orders API for the logged-in admin dashboard
@app.get("/api/admin/dashboard/orders")
def dashboard_orders():
    if not session.get("admin_logged_in"):
        return jsonify({
            "error": "Please log in as admin"
        }), 401

    with file_lock:
        orders = load_orders()

    total_value = sum(order.get("total", 0) for order in orders)

    pending_orders = sum(
        1 for order in orders
        if order.get("status") == "Pending"
    )

    return jsonify({
        "total_orders": len(orders),
        "total_value": total_value,
        "pending_orders": pending_orders,
        "orders": list(reversed(orders))
    }), 200




@app.post("/api/admin/dashboard/orders/<int:order_id>/status")
def update_order_status(order_id):
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    allowed = {"Pending", "Processing", "Shipped", "Delivered", "Cancelled"}

    if new_status not in allowed:
        return jsonify({"error": "Invalid order status"}), 400

    with file_lock:
        orders = load_orders()
        order = next(
            (o for o in orders if o["order_id"] == order_id),
            None
        )

        if order is None:
            return jsonify({"error": "Order not found"}), 404

        order["status"] = new_status
        save_orders(orders)

    return jsonify({
        "message": "Order status updated",
        "order_id": order_id,
        "status": new_status
    }), 200



def get_products():
    import sqlite3
    with sqlite3.connect(Path(__file__).parent / "melte.db") as db:
        db.row_factory = sqlite3.Row
        return [dict(row) for row in db.execute(
            "SELECT * FROM products ORDER BY id"
        )]


@app.get("/api/products")
def public_products():
    return jsonify(get_products())


@app.route("/api/admin/products", methods=["GET", "POST"])
def admin_products():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == "GET":
        return jsonify(get_products())

    data = request.get_json(silent=True) or {}
    try:
        name = str(data.get("name", "")).strip()
        price = int(data.get("price", 0))
        quantity = str(data.get("quantity", "250g")).strip()
        description = str(data.get("description", "")).strip()
        image = str(data.get("image", "")).strip()
        category = data.get("category", "classic")

        if (not name or len(name) > 100 or price <= 0
                or price > 100000 or not quantity
                or len(quantity) > 30
                or len(description) > 500
                or len(image) > 250
                or category not in ("classic", "special")):
            raise ValueError()
    except (ValueError, TypeError, OverflowError):
        return jsonify({"error": "Invalid product details"}), 400

    import sqlite3
    with sqlite3.connect(Path(__file__).parent / "melte.db") as db:
        cursor = db.execute("""
            INSERT INTO products
            (name, price, quantity, description, image, category)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (name, price, quantity, description, image, category))

    return jsonify({"id": cursor.lastrowid}), 201


@app.route("/api/admin/products/<int:product_id>",
           methods=["PUT", "DELETE"])
def admin_product_detail(product_id):
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    import sqlite3
    with sqlite3.connect(Path(__file__).parent / "melte.db") as db:
        if request.method == "DELETE":
            cursor = db.execute(
                "DELETE FROM products WHERE id = ?", (product_id,)
            )
        else:
            data = request.get_json(silent=True) or {}
            try:
                name = str(data.get("name", "")).strip()
                price = int(data.get("price", 0))
                quantity = str(data.get("quantity", "")).strip()
                description = str(data.get("description", "")).strip()
                image = str(data.get("image", "")).strip()
                category = data.get("category", "classic")

                if (not name or len(name) > 100
                        or price <= 0 or price > 100000
                        or not quantity or len(quantity) > 30
                        or len(description) > 500
                        or len(image) > 250
                        or category not in ("classic", "special")):
                    raise ValueError()
            except (ValueError, TypeError, OverflowError):
                return jsonify({"error": "Invalid product details"}), 400

            cursor = db.execute("""
                UPDATE products SET
                name=?, price=?, quantity=?, description=?,
                image=?, category=?
                WHERE id=?
            """, (name, price, quantity, description,
                  image, category, product_id))

        if cursor.rowcount == 0:
            return jsonify({"error": "Product not found"}), 404

    return jsonify({"success": True})


if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug_mode, port=5001)
