# backend/app.py
import os
import random
import string
from datetime import datetime, timedelta, timezone
from functools import wraps

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)

from extensions import db, jwt, migrate
from models import (
    AdminUser,
    Cart,
    CartItem,
    Customer,
    NewsletterSubscriber,
    Order,
    OrderItem,
    Payment,
    Product,
    ProductMedia,
    ProductVariant,
    StoreSetting,
    WishlistItem,
)
from mpesa_utils import (
    BUSINESS_SHORTCODE,
    format_phone_number,
    generate_password,
    get_mpesa_access_token,
)

DELIVERY_RATES = {
    'pickup_mtaani': {'label': 'Pickup Mtaani', 'price': 200.0},
    'doorstep_nairobi': {'label': 'Doorstep (Nairobi CBD & Environs)', 'price': 500.0},
    'parcel_countrywide': {'label': 'Countrywide Express (G4S / Fargo)', 'price': 800.0},
}


def generate_order_number():
    digits = ''.join(random.choices(string.digits, k=4))
    suffix = ''.join(random.choices(string.ascii_uppercase, k=2))
    return f"PE-{digits}{suffix}"


def generate_mpesa_receipt():
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"SL{chars}"


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"error": "Admin privileges required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def get_or_create_settings():
    settings = StoreSetting.query.first()
    if not settings:
        settings = StoreSetting()
        db.session.add(settings)
        db.session.commit()
    return settings


def recalculate_customer_metrics(customer):
    paid_orders = [o for o in customer.orders if o.payment_status == 'Paid']
    customer.total_spent = sum(o.total_amount for o in paid_orders)
    if customer.total_spent >= 100000:
        customer.status = 'VIP'
    elif len(paid_orders) >= 2:
        customer.status = 'Regular'
    else:
        customer.status = 'New'


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Database & Engine Reliability (Neon Serverless Postgres friendly)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///pinkedit.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # Security & JWT
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-only')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # =========================================================
    # PUBLIC ROUTES
    # =========================================================

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "The Pink Edit API",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }), 200

    @app.route('/api/settings/public', methods=['GET'])
    def get_public_settings():
        settings = get_or_create_settings()
        return jsonify({
            "store_name": settings.store_name,
            "support_email": settings.support_email,
            "currency": settings.currency,
            "mpesa_enabled": settings.mpesa_enabled,
            "pod_enabled": settings.pod_enabled,
            "flat_shipping_rate": settings.flat_shipping_rate,
            "free_shipping_threshold": settings.free_shipping_threshold,
            "tax_rate": settings.tax_rate,
            "delivery_rates": DELIVERY_RATES,
        }), 200

    @app.route('/api/newsletter', methods=['POST'])
    def subscribe_newsletter():
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        if not email or '@' not in email:
            return jsonify({"error": "Please enter a valid email address."}), 400

        existing = NewsletterSubscriber.query.filter_by(email=email).first()
        if existing:
            return jsonify({"message": "You are already on The Edit list."}), 200

        sub = NewsletterSubscriber(email=email)
        db.session.add(sub)
        db.session.commit()
        return jsonify({"message": "Welcome to The Edit. Expect curated releases soon."}), 201

    @app.route('/api/products', methods=['GET'])
    def get_products():
        query = Product.query.filter_by(is_deleted=False, status='Active')

        category = request.args.get('category')
        if category and category != 'All Collections':
            query = query.filter(Product.category.ilike(category))

        scent = request.args.get('scent')
        if scent:
            query = query.filter(Product.scent_family.ilike(scent))

        search = request.args.get('search')
        if search:
            like = f"%{search.strip()}%"
            query = query.filter(
                db.or_(
                    Product.title.ilike(like),
                    Product.description.ilike(like),
                    Product.category.ilike(like),
                    Product.collection.ilike(like),
                    Product.scent_family.ilike(like),
                )
            )

        sort = request.args.get('sort', 'featured')
        if sort == 'price_asc':
            query = query.order_by(Product.base_price.asc())
        elif sort == 'price_desc':
            query = query.order_by(Product.base_price.desc())
        else:
            query = query.order_by(Product.id.asc())

        products = query.all()
        return jsonify([product.to_dict() for product in products]), 200

    @app.route('/api/products/<int:product_id>', methods=['GET'])
    def get_product(product_id):
        product = Product.query.filter_by(id=product_id, is_deleted=False).first()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        return jsonify(product.to_dict()), 200

    # =========================================================
    # CUSTOMER AUTH & DEMO ACCESS
    # =========================================================

    @app.route('/api/register', methods=['POST'])
    def register_customer():
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')
        full_name = (data.get('name') or '').strip()

        if not email or not password or not full_name:
            return jsonify({"error": "Name, email, and password are required"}), 400

        if Customer.query.filter_by(email=email).first():
            return jsonify({"error": "An account with that email already exists."}), 409

        name_parts = full_name.split(' ', 1)
        f_name = name_parts[0]
        l_name = name_parts[1] if len(name_parts) > 1 else ''

        new_customer = Customer(
            first_name=f_name,
            last_name=l_name,
            email=email,
            phone_number=data.get('phone_number'),
        )
        new_customer.set_password(password)
        db.session.add(new_customer)
        db.session.commit()

        access_token = create_access_token(
            identity=str(new_customer.id),
            additional_claims={"role": "customer"},
        )
        return jsonify({
            "message": "Account created successfully!",
            "access_token": access_token,
            "user": new_customer.to_dict(),
        }), 201

    @app.route('/api/login', methods=['POST'])
    def customer_login():
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Missing email or password"}), 400

        customer = Customer.query.filter_by(email=email).first()
        if not customer or not customer.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401

        access_token = create_access_token(
            identity=str(customer.id),
            additional_claims={"role": "customer"},
        )
        return jsonify({
            "access_token": access_token,
            "user": customer.to_dict(),
        }), 200

    @app.route('/api/auth/demo-customer', methods=['POST'])
    def demo_customer_login():
        """One-click portfolio login into a pre-seeded VIP customer account."""
        demo_email = 'amara@thepinkedit.com'
        customer = Customer.query.filter_by(email=demo_email).first()
        if not customer:
            customer = Customer(
                first_name='Amara',
                last_name='Wanjiku',
                email=demo_email,
                phone_number='0712345678',
                default_address='Kilimani, Rose Avenue, Suite 4B, Nairobi',
                status='VIP',
            )
            customer.set_password('Demo123!')
            db.session.add(customer)
            db.session.commit()

        access_token = create_access_token(
            identity=str(customer.id),
            additional_claims={"role": "customer"},
        )
        return jsonify({
            "message": "Signed in as Demo Customer",
            "access_token": access_token,
            "user": customer.to_dict(),
        }), 200

    @app.route('/api/auth/google', methods=['POST'])
    def google_auth():
        data = request.get_json() or {}
        access_token = data.get('access_token')
        if not access_token:
            return jsonify({"error": "No access token provided"}), 400

        google_res = requests.get(
            f'https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}',
            timeout=10,
        )
        if not google_res.ok:
            return jsonify({"error": "Invalid Google token"}), 401

        user_info = google_res.json()
        email = (user_info.get('email') or '').lower()
        full_name = user_info.get('name', 'Google User')
        name_parts = full_name.split(' ', 1)
        f_name = name_parts[0]
        l_name = name_parts[1] if len(name_parts) > 1 else ''

        customer = Customer.query.filter_by(email=email).first()
        if not customer:
            customer = Customer(first_name=f_name, last_name=l_name, email=email)
            db.session.add(customer)
            db.session.commit()

        jwt_token = create_access_token(
            identity=str(customer.id),
            additional_claims={"role": "customer"},
        )
        return jsonify({
            "access_token": jwt_token,
            "user": customer.to_dict(),
        }), 200

    # =========================================================
    # CUSTOMER ACCOUNT, WISHLIST & CART ROUTES
    # =========================================================

    @app.route('/api/account/profile', methods=['GET', 'PUT'])
    @jwt_required()
    def account_profile():
        customer = db.session.get(Customer, int(get_jwt_identity()))
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        if request.method == 'PUT':
            data = request.get_json() or {}
            if 'first_name' in data:
                customer.first_name = data['first_name'].strip() or customer.first_name
            if 'last_name' in data:
                customer.last_name = data['last_name'].strip()
            if 'phone_number' in data:
                customer.phone_number = data['phone_number'].strip()
            if 'default_address' in data:
                customer.default_address = data['default_address'].strip()
            db.session.commit()

        return jsonify(customer.to_dict()), 200

    @app.route('/api/account/orders', methods=['GET'])
    @jwt_required()
    def account_orders():
        customer_id = int(get_jwt_identity())
        orders = (
            Order.query.filter_by(customer_id=customer_id)
            .order_by(Order.created_at.desc())
            .all()
        )
        return jsonify([o.to_dict(include_items=True) for o in orders]), 200

    @app.route('/api/wishlist', methods=['GET'])
    @jwt_required()
    def get_wishlist():
        customer_id = int(get_jwt_identity())
        rows = WishlistItem.query.filter_by(customer_id=customer_id).all()
        products = [r.product.to_dict() for r in rows if r.product and not r.product.is_deleted]
        return jsonify(products), 200

    @app.route('/api/wishlist/<int:product_id>', methods=['POST', 'DELETE'])
    @jwt_required()
    def toggle_wishlist(product_id):
        customer_id = int(get_jwt_identity())
        existing = WishlistItem.query.filter_by(
            customer_id=customer_id, product_id=product_id
        ).first()

        if request.method == 'DELETE':
            if existing:
                db.session.delete(existing)
                db.session.commit()
            return jsonify({"message": "Removed from wishlist", "saved": False}), 200

        if not existing:
            product = db.session.get(Product, product_id)
            if not product or product.is_deleted:
                return jsonify({"error": "Product not found"}), 404
            db.session.add(WishlistItem(customer_id=customer_id, product_id=product_id))
            db.session.commit()
        return jsonify({"message": "Saved to wishlist", "saved": True}), 200

    @app.route('/api/cart/sync', methods=['POST'])
    @jwt_required()
    def sync_cart():
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        local_items = data.get('localItems', [])
        replace_mode = data.get('replace', False)

        cart = Cart.query.filter_by(customer_id=current_user_id).first()
        if not cart:
            cart = Cart(customer_id=current_user_id)
            db.session.add(cart)
            db.session.commit()

        if replace_mode:
            CartItem.query.filter_by(cart_id=cart.id).delete()
            for item in local_items:
                qty = int(item.get('qty', 1))
                if qty <= 0:
                    continue
                db.session.add(
                    CartItem(
                        cart_id=cart.id,
                        product_id=item['id'],
                        variant_id=item.get('variantId'),
                        size=item.get('size'),
                        quantity=qty,
                    )
                )
        else:
            for item in local_items:
                size = item.get('size')
                db_item = CartItem.query.filter_by(
                    cart_id=cart.id, product_id=item['id'], size=size
                ).first()
                if db_item:
                    db_item.quantity = max(db_item.quantity, int(item.get('qty', 1)))
                else:
                    db.session.add(
                        CartItem(
                            cart_id=cart.id,
                            product_id=item['id'],
                            variant_id=item.get('variantId'),
                            size=size,
                            quantity=int(item.get('qty', 1)),
                        )
                    )

        db.session.commit()

        master_cart = []
        for db_item in cart.items:
            product = db.session.get(Product, db_item.product_id)
            if not product or product.is_deleted:
                continue
            variant = None
            if db_item.variant_id:
                variant = db.session.get(ProductVariant, db_item.variant_id)
            if not variant and db_item.size:
                variant = next((v for v in product.variants if v.size == db_item.size), None)
            if not variant and product.variants:
                variant = product.variants[0]

            price = (
                product.base_price + (variant.price_adjustment or 0.0)
                if variant
                else product.base_price
            )
            primary_image = product.media[0].image_url if product.media else ""

            master_cart.append({
                "id": product.id,
                "variantId": variant.id if variant else None,
                "sku": variant.sku if variant else "",
                "qty": db_item.quantity,
                "name": product.title,
                "title": product.title,
                "category": product.category,
                "size": variant.size if variant else (db_item.size or "One Size"),
                "price": price,
                "img": primary_image,
                "image": primary_image,
            })

        return jsonify({"cartItems": master_cart}), 200

    # =========================================================
    # CHECKOUT & REAL ORDER CREATION
    # =========================================================

    @app.route('/api/checkout/order', methods=['POST'])
    @jwt_required()
    def create_order():
        """
        Creates a real Order, OrderItems, and Payment in Neon Postgres,
        deducts variant stock, updates customer lifetime value, and clears the cart.
        Supports 'mpesa_demo' (instant portfolio simulation), 'mpesa_live' (Daraja), and 'pod'.
        """
        customer_id = int(get_jwt_identity())
        customer = db.session.get(Customer, customer_id)
        if not customer:
            return jsonify({"error": "Customer account not found"}), 404

        data = request.get_json() or {}
        items_payload = data.get('items', [])
        if not items_payload:
            return jsonify({"error": "Your bag is empty"}), 400

        delivery_method = data.get('delivery_method', 'pickup_mtaani')
        shipping_address = (data.get('shipping_address') or '').strip()
        shipping_phone = (data.get('shipping_phone') or '').strip()
        payment_method = data.get('payment_method', 'mpesa_demo')
        mpesa_phone = (data.get('mpesa_phone') or shipping_phone).strip()
        notes = (data.get('notes') or '').strip()

        if not shipping_address or not shipping_phone:
            return jsonify({"error": "Shipping phone and delivery address are required"}), 400

        settings = get_or_create_settings()
        delivery_info = DELIVERY_RATES.get(delivery_method, DELIVERY_RATES['doorstep_nairobi'])

        try:
            resolved_items = []
            subtotal = 0.0

            for entry in items_payload:
                qty = int(entry.get('qty', 1))
                if qty <= 0:
                    continue

                variant = None
                if entry.get('variantId'):
                    variant = db.session.get(ProductVariant, int(entry['variantId']))
                if not variant and entry.get('id'):
                    product = db.session.get(Product, int(entry['id']))
                    if product and product.variants:
                        size = entry.get('size')
                        variant = next(
                            (v for v in product.variants if v.size == size),
                            product.variants[0],
                        )
                if not variant:
                    return jsonify({"error": "One of the items in your bag is no longer available."}), 400

                if variant.available_stock < qty:
                    return jsonify({
                        "error": f"Only {variant.available_stock} left in stock for {variant.product.title} ({variant.size})."
                    }), 400

                unit_price = variant.product.base_price + (variant.price_adjustment or 0.0)
                subtotal += unit_price * qty
                resolved_items.append((variant, qty, unit_price))

            if not resolved_items:
                return jsonify({"error": "No valid items to order"}), 400

            shipping_cost = (
                0.0
                if subtotal >= (settings.free_shipping_threshold or 25000.0)
                else delivery_info['price']
            )
            total_amount = subtotal + shipping_cost

            order_num = generate_order_number()
            while Order.query.filter_by(order_number=order_num).first():
                order_num = generate_order_number()

            is_paid = payment_method == 'mpesa_demo'
            payment_status = 'Paid' if is_paid else 'Pending'
            fulfillment_status = 'Processing' if is_paid else 'Unfulfilled'
            clean_method = 'mpesa' if payment_method.startswith('mpesa') else 'pod'

            order = Order(
                order_number=order_num,
                customer_id=customer.id,
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                total_amount=total_amount,
                fulfillment_status=fulfillment_status,
                payment_status=payment_status,
                payment_method=clean_method,
                delivery_method=delivery_info['label'],
                shipping_address=shipping_address,
                shipping_phone=shipping_phone,
                notes=notes or None,
            )
            db.session.add(order)
            db.session.flush()

            for variant, qty, unit_price in resolved_items:
                db.session.add(
                    OrderItem(
                        order_id=order.id,
                        variant_id=variant.id,
                        quantity=qty,
                        price_at_purchase=unit_price,
                    )
                )
                variant.available_stock -= qty
                variant.committed_stock = (variant.committed_stock or 0) + qty

            tx_ref = generate_mpesa_receipt() if is_paid else f"POD-{order_num}"
            daraja_response = None

            if payment_method == 'mpesa_live':
                try:
                    formatted_phone = format_phone_number(mpesa_phone)
                    access_token = get_mpesa_access_token()
                    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                    payload = {
                        "BusinessShortCode": BUSINESS_SHORTCODE,
                        "Password": generate_password(timestamp),
                        "Timestamp": timestamp,
                        "TransactionType": "CustomerPayBillOnline",
                        "Amount": int(round(total_amount)),
                        "PartyA": formatted_phone,
                        "PartyB": BUSINESS_SHORTCODE,
                        "PhoneNumber": formatted_phone,
                        "CallBackURL": os.environ.get(
                            "MPESA_CALLBACK_URL",
                            "https://the-pink-edit-ke.onrender.com/api/callback/mpesa",
                        ),
                        "AccountReference": order_num,
                        "TransactionDesc": "The Pink Edit Order",
                    }
                    res = requests.post(
                        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
                        json=payload,
                        headers={"Authorization": f"Bearer {access_token}"},
                        timeout=12,
                    )
                    daraja_response = res.json()
                    if daraja_response.get('ResponseCode') == '0':
                        tx_ref = daraja_response.get('CheckoutRequestID', tx_ref)
                except Exception as daraja_err:
                    daraja_response = {"warning": f"Daraja sandbox unavailable: {str(daraja_err)}"}

            payment = Payment(
                order_id=order.id,
                method=clean_method,
                transaction_reference=tx_ref,
                amount=total_amount,
                status='Completed' if is_paid else 'Pending',
            )
            db.session.add(payment)

            # Save contact info on customer profile if empty
            if not customer.phone_number:
                customer.phone_number = shipping_phone
            if not customer.default_address:
                customer.default_address = shipping_address

            recalculate_customer_metrics(customer)

            # Clear customer's persisted DB cart
            cart = Cart.query.filter_by(customer_id=customer.id).first()
            if cart:
                CartItem.query.filter_by(cart_id=cart.id).delete()

            db.session.commit()

            return jsonify({
                "message": "Order confirmed successfully!",
                "order": order.to_dict(include_items=True),
                "receipt": tx_ref,
                "daraja": daraja_response,
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Checkout failed: {str(e)}"}), 500

    @app.route('/api/checkout/mpesa', methods=['POST'])
    def mpesa_checkout():
        """Legacy STK push endpoint preserved for direct Daraja sandbox testing."""
        data = request.get_json() or {}
        raw_phone = data.get('phone_number')
        amount = data.get('amount')
        if not raw_phone or not amount:
            return jsonify({"error": "Phone number and amount required"}), 400

        phone_number = format_phone_number(raw_phone)
        try:
            access_token = get_mpesa_access_token()
            api_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
            headers = {"Authorization": f"Bearer {access_token}"}
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            payload = {
                "BusinessShortCode": BUSINESS_SHORTCODE,
                "Password": generate_password(timestamp),
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(float(amount)),
                "PartyA": phone_number,
                "PartyB": BUSINESS_SHORTCODE,
                "PhoneNumber": phone_number,
                "CallBackURL": os.environ.get(
                    "MPESA_CALLBACK_URL",
                    "https://the-pink-edit-ke.onrender.com/api/callback/mpesa",
                ),
                "AccountReference": "The Pink Edit",
                "TransactionDesc": "Perfume and Jewellery Order",
            }
            response = requests.post(api_url, json=payload, headers=headers, timeout=12)
            mpesa_data = response.json()
            if mpesa_data.get('ResponseCode') == '0':
                return jsonify({
                    "message": "STK Push sent successfully. Please check your phone.",
                    "checkout_request_id": mpesa_data.get('CheckoutRequestID'),
                }), 200
            return jsonify({"error": "Failed to initiate M-Pesa", "details": mpesa_data}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/callback/mpesa', methods=['POST'])
    def mpesa_callback():
        callback_data = request.get_json() or {}
        stk = callback_data.get('Body', {}).get('stkCallback', {})
        result_code = stk.get('ResultCode')
        checkout_request_id = stk.get('CheckoutRequestID')

        payment = Payment.query.filter_by(transaction_reference=checkout_request_id).first()
        if payment:
            order = payment.order
            if result_code == 0:
                payment.status = 'Completed'
                order.payment_status = 'Paid'
                order.fulfillment_status = 'Processing'
                recalculate_customer_metrics(order.customer)
            else:
                payment.status = 'Failed'
                order.payment_status = 'Pending'
            db.session.commit()

        return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200

    # =========================================================
    # ADMIN AUTH & DEMO LOGIN
    # =========================================================

    @app.route('/api/admin/login', methods=['POST'])
    def admin_login():
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Missing email or password"}), 400

        user = AdminUser.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401
        if not user.is_active:
            return jsonify({"error": "Account has been deactivated"}), 403

        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": "admin", "admin_role": user.role},
        )
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": user.to_dict(),
        }), 200

    @app.route('/api/admin/demo-login', methods=['POST'])
    def admin_demo_login():
        """One-click portfolio login into the Admin Command Center."""
        user = AdminUser.query.filter_by(email='admin@thepinkedit.com').first()
        if not user:
            user = AdminUser(
                email='admin@thepinkedit.com',
                first_name='System',
                last_name='Admin',
                role='SuperAdmin',
                is_active=True,
            )
            user.set_password('Admin123!')
            db.session.add(user)
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": "admin", "admin_role": user.role},
        )
        return jsonify({
            "message": "Signed in as Demo Admin",
            "access_token": access_token,
            "user": user.to_dict(),
        }), 200

    # =========================================================
    # ADMIN DASHBOARD ANALYTICS
    # =========================================================

    @app.route('/api/admin/dashboard/stats', methods=['GET'])
    @admin_required
    def get_dashboard_stats():
        paid_orders = Order.query.filter(Order.payment_status == 'Paid').all()
        total_sales = sum(o.total_amount for o in paid_orders)
        avg_order_value = round(total_sales / len(paid_orders), 2) if paid_orders else 0.0

        pending_orders = Order.query.filter(
            Order.fulfillment_status.in_(['Unfulfilled', 'Processing'])
        ).count()
        total_orders = Order.query.count()
        total_customers = Customer.query.count()

        low_stock_variants = (
            ProductVariant.query.join(Product)
            .filter(Product.is_deleted == False, ProductVariant.available_stock < 8)
            .order_by(ProductVariant.available_stock.asc())
            .all()
        )

        # 14-day revenue & order trend for Recharts
        now = datetime.now(timezone.utc).date()
        trend_map = {}
        for offset in range(13, -1, -1):
            day = now - timedelta(days=offset)
            trend_map[day.isoformat()] = {
                "date": day.strftime('%b %d'),
                "iso": day.isoformat(),
                "revenue": 0.0,
                "orders": 0,
            }

        for order in paid_orders:
            if not order.created_at:
                continue
            day_key = order.created_at.date().isoformat()
            if day_key in trend_map:
                trend_map[day_key]["revenue"] += order.total_amount
                trend_map[day_key]["orders"] += 1

        # Category revenue breakdown from actual OrderItems
        category_totals = {}
        for order in paid_orders:
            for item in order.items:
                cat = item.variant.product.category if (item.variant and item.variant.product) else "Other"
                if cat not in category_totals:
                    category_totals[cat] = {"name": cat, "revenue": 0.0, "units": 0}
                category_totals[cat]["revenue"] += item.price_at_purchase * item.quantity
                category_totals[cat]["units"] += item.quantity

        category_breakdown = sorted(
            category_totals.values(), key=lambda x: x["revenue"], reverse=True
        )
        max_cat_rev = max([c["revenue"] for c in category_breakdown], default=1.0) or 1.0
        for c in category_breakdown:
            c["share"] = round((c["revenue"] / total_sales) * 100, 1) if total_sales > 0 else 0
            c["bar_width"] = round((c["revenue"] / max_cat_rev) * 100, 1)

        recent_orders = (
            Order.query.order_by(Order.created_at.desc()).limit(5).all()
        )

        return jsonify({
            "total_sales": total_sales,
            "avg_order_value": avg_order_value,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "total_customers": total_customers,
            "low_stock_items": len(low_stock_variants),
            "revenue_trend": list(trend_map.values()),
            "category_breakdown": category_breakdown,
            "recent_orders": [o.to_dict() for o in recent_orders],
            "low_stock_list": [
                {
                    "id": v.id,
                    "product_id": v.product_id,
                    "product_name": v.product.title,
                    "sku": v.sku,
                    "size": v.size,
                    "available_stock": v.available_stock,
                }
                for v in low_stock_variants[:6]
            ],
        }), 200

    # =========================================================
    # ADMIN PRODUCTS & INVENTORY CRUD
    # =========================================================

    @app.route('/api/admin/products', methods=['GET'])
    @admin_required
    def get_admin_products():
        products = (
            Product.query.filter_by(is_deleted=False)
            .order_by(Product.id.desc())
            .all()
        )
        return jsonify([p.to_dict() for p in products]), 200

    @app.route('/api/products', methods=['POST'])
    @admin_required
    def create_product():
        data = request.get_json() or {}
        if not data.get('title') or data.get('base_price') is None or not data.get('category'):
            return jsonify({"error": "Title, base_price, and category are required"}), 400

        try:
            new_product = Product(
                title=data.get('title').strip(),
                description=data.get('description'),
                category=data.get('category'),
                collection=data.get('collection'),
                base_price=float(data.get('base_price')),
                status=data.get('status', 'Active'),
                tags=data.get('tags'),
                scent_family=data.get('scent_family'),
                scent_notes=data.get('scent_notes'),
            )
            db.session.add(new_product)
            db.session.flush()

            variants_data = data.get('variants') or []
            if not variants_data:
                slug = ''.join(ch for ch in new_product.title.upper() if ch.isalnum())[:6]
                variants_data = [{
                    "sku": f"{slug}-{new_product.id}-STD",
                    "size": "Standard",
                    "price_adjustment": 0.0,
                    "available_stock": int(data.get('initial_stock', 20)),
                }]

            for v_data in variants_data:
                db.session.add(
                    ProductVariant(
                        product_id=new_product.id,
                        sku=v_data.get('sku').strip(),
                        size=v_data.get('size') or 'Standard',
                        metal_type=v_data.get('metal_type'),
                        price_adjustment=float(v_data.get('price_adjustment', 0.0)),
                        available_stock=int(v_data.get('available_stock', 0)),
                    )
                )

            media_data = data.get('media') or []
            if not media_data and data.get('image_url'):
                media_data = [{"image_url": data['image_url'], "is_main_image": True}]

            for idx, m_data in enumerate(media_data):
                if not m_data.get('image_url'):
                    continue
                db.session.add(
                    ProductMedia(
                        product_id=new_product.id,
                        image_url=m_data['image_url'].strip(),
                        is_main_image=m_data.get('is_main_image', idx == 0),
                        display_order=idx + 1,
                    )
                )

            db.session.commit()
            return jsonify({
                "message": "Product created successfully",
                "product": new_product.to_dict(),
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route('/api/products/<int:product_id>', methods=['PUT'])
    @admin_required
    def update_product(product_id):
        product = Product.query.filter_by(id=product_id, is_deleted=False).first()
        if not product:
            return jsonify({"error": "Product not found"}), 404

        data = request.get_json() or {}
        try:
            for field in ['title', 'description', 'category', 'collection', 'status', 'tags', 'scent_family', 'scent_notes']:
                if field in data:
                    setattr(product, field, data[field])
            if 'base_price' in data and data['base_price'] is not None:
                product.base_price = float(data['base_price'])

            # Update media if supplied
            if 'media' in data and isinstance(data['media'], list):
                ProductMedia.query.filter_by(product_id=product.id).delete()
                for idx, m_data in enumerate(data['media']):
                    url = (m_data.get('image_url') or '').strip()
                    if url:
                        db.session.add(
                            ProductMedia(
                                product_id=product.id,
                                image_url=url,
                                is_main_image=m_data.get('is_main_image', idx == 0),
                                display_order=idx + 1,
                            )
                        )
            elif data.get('image_url'):
                main_media = ProductMedia.query.filter_by(product_id=product.id, is_main_image=True).first()
                if main_media:
                    main_media.image_url = data['image_url'].strip()
                else:
                    db.session.add(
                        ProductMedia(
                            product_id=product.id,
                            image_url=data['image_url'].strip(),
                            is_main_image=True,
                            display_order=1,
                        )
                    )

            # Upsert variants safely (preserving IDs referenced by past OrderItems)
            if 'variants' in data and isinstance(data['variants'], list):
                for v_data in data['variants']:
                    v_id = v_data.get('id')
                    if v_id:
                        variant = ProductVariant.query.filter_by(id=v_id, product_id=product.id).first()
                        if variant:
                            variant.sku = v_data.get('sku', variant.sku).strip()
                            variant.size = v_data.get('size', variant.size)
                            variant.metal_type = v_data.get('metal_type', variant.metal_type)
                            variant.price_adjustment = float(v_data.get('price_adjustment', variant.price_adjustment or 0.0))
                            variant.available_stock = int(v_data.get('available_stock', variant.available_stock))
                    elif v_data.get('sku'):
                        db.session.add(
                            ProductVariant(
                                product_id=product.id,
                                sku=v_data['sku'].strip(),
                                size=v_data.get('size') or 'Standard',
                                metal_type=v_data.get('metal_type'),
                                price_adjustment=float(v_data.get('price_adjustment', 0.0)),
                                available_stock=int(v_data.get('available_stock', 0)),
                            )
                        )

            db.session.commit()
            return jsonify({
                "message": "Product updated successfully",
                "product": product.to_dict(),
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route('/api/products/<int:product_id>', methods=['DELETE'])
    @admin_required
    def delete_product(product_id):
        product = Product.query.filter_by(id=product_id, is_deleted=False).first()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        product.is_deleted = True
        product.status = 'Archived'
        db.session.commit()
        return jsonify({"message": "Product archived successfully"}), 200

    @app.route('/api/admin/variants/<int:variant_id>/stock', methods=['PATCH'])
    @admin_required
    def adjust_variant_stock(variant_id):
        variant = db.session.get(ProductVariant, variant_id)
        if not variant:
            return jsonify({"error": "Variant not found"}), 404
        data = request.get_json() or {}
        if 'available_stock' in data:
            variant.available_stock = max(0, int(data['available_stock']))
        elif 'delta' in data:
            variant.available_stock = max(0, variant.available_stock + int(data['delta']))
        db.session.commit()
        return jsonify({"message": "Stock updated", "variant": variant.to_dict()}), 200

    @app.route('/api/admin/inventory', methods=['GET'])
    @admin_required
    def get_admin_inventory():
        variants = (
            ProductVariant.query.join(Product)
            .filter(Product.is_deleted == False)
            .all()
        )
        inventory_data = []
        for v in variants:
            inventory_data.append({
                "id": v.id,
                "product_id": v.product_id,
                "product_name": v.product.title if v.product else "Unknown",
                "size": v.size,
                "sku": v.sku,
                "committed": v.committed_stock,
                "available": v.available_stock,
                "status": "Out of Stock" if v.available_stock == 0 else ("Low Stock" if v.available_stock < 8 else "Healthy"),
            })
        return jsonify(inventory_data), 200

    # =========================================================
    # ADMIN ORDERS MANAGEMENT
    # =========================================================

    @app.route('/api/admin/orders', methods=['GET', 'POST'])
    @admin_required
    def admin_orders():
        if request.method == 'GET':
            orders = Order.query.order_by(Order.created_at.desc()).all()
            return jsonify([order.to_dict(include_items=True) for order in orders]), 200

        # Manual Admin Order Creation
        data = request.get_json() or {}
        customer_id = data.get('customer_id')
        variant_id = data.get('variant_id')
        quantity = int(data.get('quantity', 1))

        customer = db.session.get(Customer, int(customer_id)) if customer_id else None
        variant = db.session.get(ProductVariant, int(variant_id)) if variant_id else None

        if not customer or not variant:
            return jsonify({"error": "Valid customer and product variant are required"}), 400
        if variant.available_stock < quantity:
            return jsonify({"error": f"Insufficient stock ({variant.available_stock} available)"}), 400

        try:
            unit_price = variant.product.base_price + (variant.price_adjustment or 0.0)
            subtotal = unit_price * quantity
            shipping_cost = float(data.get('shipping_cost', 500.0))
            total_amount = subtotal + shipping_cost
            payment_status = data.get('payment_status', 'Paid')

            order = Order(
                order_number=generate_order_number(),
                customer_id=customer.id,
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                total_amount=total_amount,
                fulfillment_status=data.get('fulfillment_status', 'Unfulfilled'),
                payment_status=payment_status,
                payment_method=data.get('payment_method', 'mpesa'),
                delivery_method=data.get('delivery_method', 'Doorstep (Nairobi CBD)'),
                shipping_address=data.get('shipping_address') or customer.default_address or 'Nairobi, Kenya',
                shipping_phone=data.get('shipping_phone') or customer.phone_number or '0700000000',
                notes=data.get('notes'),
            )
            db.session.add(order)
            db.session.flush()

            db.session.add(
                OrderItem(
                    order_id=order.id,
                    variant_id=variant.id,
                    quantity=quantity,
                    price_at_purchase=unit_price,
                )
            )
            variant.available_stock -= quantity
            variant.committed_stock = (variant.committed_stock or 0) + quantity

            db.session.add(
                Payment(
                    order_id=order.id,
                    method=order.payment_method,
                    transaction_reference=generate_mpesa_receipt() if payment_status == 'Paid' else f"MAN-{order.order_number}",
                    amount=total_amount,
                    status='Completed' if payment_status == 'Paid' else 'Pending',
                )
            )
            recalculate_customer_metrics(customer)
            db.session.commit()
            return jsonify({"message": "Order created", "order": order.to_dict(include_items=True)}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route('/api/admin/orders/<int:order_id>', methods=['GET', 'PATCH'])
    @admin_required
    def admin_single_order(order_id):
        order = db.session.get(Order, order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404

        if request.method == 'GET':
            return jsonify(order.to_dict(include_items=True)), 200

        data = request.get_json() or {}
        prev_fulfillment = order.fulfillment_status
        prev_payment = order.payment_status

        if 'fulfillment_status' in data:
            order.fulfillment_status = data['fulfillment_status']
        if 'payment_status' in data:
            order.payment_status = data['payment_status']
        if 'tracking_number' in data:
            order.tracking_number = data['tracking_number']
        if 'notes' in data:
            order.notes = data['notes']
        if 'shipping_address' in data:
            order.shipping_address = data['shipping_address']

        # Inventory lifecycle reconciliation
        if order.fulfillment_status == 'Fulfilled' and prev_fulfillment != 'Fulfilled':
            for item in order.items:
                if item.variant:
                    item.variant.committed_stock = max(0, (item.variant.committed_stock or 0) - item.quantity)

        if (
            (order.fulfillment_status == 'Canceled' and prev_fulfillment != 'Canceled')
            or (order.payment_status == 'Refunded' and prev_payment != 'Refunded')
        ):
            for item in order.items:
                if item.variant:
                    item.variant.available_stock += item.quantity
                    item.variant.committed_stock = max(0, (item.variant.committed_stock or 0) - item.quantity)
            for p in order.payments:
                if order.payment_status == 'Refunded':
                    p.status = 'Refunded'

        if order.payment_status == 'Paid' and prev_payment != 'Paid':
            for p in order.payments:
                p.status = 'Completed'

        if order.customer:
            recalculate_customer_metrics(order.customer)

        db.session.commit()
        return jsonify({
            "message": "Order updated successfully",
            "order": order.to_dict(include_items=True),
        }), 200

    # =========================================================
    # ADMIN CUSTOMERS MANAGEMENT
    # =========================================================

    @app.route('/api/admin/customers', methods=['GET', 'POST'])
    @admin_required
    def admin_customers():
        if request.method == 'GET':
            customers = Customer.query.order_by(Customer.created_at.desc()).all()
            return jsonify([c.to_dict() for c in customers]), 200

        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        first_name = (data.get('first_name') or '').strip()
        last_name = (data.get('last_name') or '').strip()

        if not email or not first_name:
            return jsonify({"error": "First name and email are required"}), 400
        if Customer.query.filter_by(email=email).first():
            return jsonify({"error": "Customer with that email already exists"}), 409

        customer = Customer(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone_number=data.get('phone_number'),
            default_address=data.get('default_address'),
            status=data.get('status', 'New'),
        )
        if data.get('password'):
            customer.set_password(data['password'])
        db.session.add(customer)
        db.session.commit()
        return jsonify({"message": "Customer added", "customer": customer.to_dict()}), 201

    @app.route('/api/admin/customers/<int:customer_id>', methods=['PATCH'])
    @admin_required
    def update_admin_customer(customer_id):
        customer = db.session.get(Customer, customer_id)
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        data = request.get_json() or {}
        if 'status' in data:
            customer.status = data['status']
        if 'phone_number' in data:
            customer.phone_number = data['phone_number']
        if 'default_address' in data:
            customer.default_address = data['default_address']
        db.session.commit()
        return jsonify({"message": "Customer updated", "customer": customer.to_dict()}), 200

    # =========================================================
    # ADMIN SETTINGS & TEAM
    # =========================================================

    @app.route('/api/admin/settings', methods=['GET', 'PUT'])
    @admin_required
    def admin_settings():
        settings = get_or_create_settings()
        if request.method == 'PUT':
            data = request.get_json() or {}
            for field in [
                'store_name',
                'support_email',
                'currency',
                'timezone',
                'mpesa_enabled',
                'stripe_enabled',
                'pod_enabled',
            ]:
                if field in data:
                    setattr(settings, field, data[field])
            for num_field in ['flat_shipping_rate', 'free_shipping_threshold', 'tax_rate']:
                if num_field in data and data[num_field] is not None:
                    setattr(settings, num_field, float(data[num_field]))
            db.session.commit()
            return jsonify({"message": "Settings saved", "settings": settings.to_dict()}), 200

        return jsonify(settings.to_dict()), 200

    @app.route('/api/admin/team', methods=['GET', 'POST'])
    @admin_required
    def admin_team():
        if request.method == 'GET':
            members = AdminUser.query.order_by(AdminUser.id.asc()).all()
            return jsonify([m.to_dict() for m in members]), 200

        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        first_name = (data.get('first_name') or '').strip()
        last_name = (data.get('last_name') or '').strip()
        if not email or not first_name:
            return jsonify({"error": "First name and email are required"}), 400
        if AdminUser.query.filter_by(email=email).first():
            return jsonify({"error": "A staff member with that email already exists"}), 409

        member = AdminUser(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=data.get('role', 'Support'),
            is_active=True,
        )
        member.set_password(data.get('password') or 'PinkEditStaff2026!')
        db.session.add(member)
        db.session.commit()
        return jsonify({"message": "Team member invited", "member": member.to_dict()}), 201

    @app.route('/api/admin/team/<int:member_id>', methods=['PATCH', 'DELETE'])
    @admin_required
    def admin_team_member(member_id):
        member = db.session.get(AdminUser, member_id)
        if not member:
            return jsonify({"error": "Team member not found"}), 404
        if member.email == 'admin@thepinkedit.com':
            return jsonify({"error": "Primary SuperAdmin account cannot be modified or removed"}), 400

        if request.method == 'DELETE':
            db.session.delete(member)
            db.session.commit()
            return jsonify({"message": "Team member removed"}), 200

        data = request.get_json() or {}
        if 'role' in data:
            member.role = data['role']
        if 'is_active' in data:
            member.is_active = bool(data['is_active'])
        db.session.commit()
        return jsonify({"message": "Role updated", "member": member.to_dict()}), 200

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)