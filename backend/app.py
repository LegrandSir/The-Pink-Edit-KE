# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from extensions import db, jwt, migrate
from models import AdminUser, Product, ProductVariant, ProductMedia, Customer, Order, Payment
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from mpesa_utils import get_mpesa_access_token, generate_password, format_phone_number, BUSINESS_SHORTCODE
import requests
from datetime import datetime

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pinkedit.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Secret Keys (These secure your login tokens)
    app.config['SECRET_KEY'] = 'super-secret-pink-edit-key'
    app.config['JWT_SECRET_KEY'] = 'super-secret-jwt-key' 

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # ---------------------------------------------------------
    # ROUTE: HEALTH CHECK
    # ---------------------------------------------------------
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy", 
            "message": "The Pink Edit API is connected to the database."
        }), 200

    # ---------------------------------------------------------
    # ROUTE: ADMIN LOGIN
    # ---------------------------------------------------------
    @app.route('/api/admin/login', methods=['POST'])
    def admin_login():
        data = request.get_json()
        
        # 1. Validate that we received both email and password
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Missing email or password"}), 400

        # 2. Query the database for the user
        user = AdminUser.query.filter_by(email=data.get('email')).first()

        # 3. Check if user exists AND if the password matches the hash
        if not user or not user.check_password(data.get('password')):
            return jsonify({"error": "Invalid email or password"}), 401
            
        # 4. Ensure the account hasn't been deactivated
        if not user.is_active:
            return jsonify({"error": "Account has been deactivated"}), 403

        # 5. Generate the JWT token (Using the user's ID as their "identity")
        # In a real app, you can set expiration times here too!
        access_token = create_access_token(identity=str(user.id))

        # 6. Return the token and the safe user data
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": user.to_dict()
        }), 200
    
    # ---------------------------------------------------------
    # ROUTE: GET ALL PRODUCTS (Public)
    # ---------------------------------------------------------
    @app.route('/api/products', methods=['GET'])
    def get_products():
        # Only fetch products that haven't been soft-deleted and are Active
        products = Product.query.filter_by(is_deleted=False, status='Active').all()
        return jsonify([product.to_dict() for product in products]), 200

    # ---------------------------------------------------------
    # ROUTE: GET SINGLE PRODUCT (Public)
    # ---------------------------------------------------------
    @app.route('/api/products/<int:product_id>', methods=['GET'])
    def get_product(product_id):
        product = Product.query.filter_by(id=product_id, is_deleted=False).first()
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
            
        return jsonify(product.to_dict()), 200
    
    # ---------------------------------------------------------
    # ROUTE: CREATE PRODUCT (Protected Admin Route)
    # ---------------------------------------------------------
    @app.route('/api/products', methods=['POST'])
    @jwt_required() # This locks the door! Only valid tokens allowed.
    def create_product():
        # Identify who is making the request (Optional, but great for audit logs!)
        current_admin_id = get_jwt_identity()
        
        data = request.get_json()
        
        # 1. Basic Validation
        if not data.get('title') or not data.get('base_price') or not data.get('category'):
            return jsonify({"error": "Title, base_price, and category are required"}), 400
            
        try:
            # 2. Create the Parent Product
            new_product = Product(
                title=data.get('title'),
                description=data.get('description'),
                category=data.get('category'),
                collection=data.get('collection'),
                base_price=float(data.get('base_price')),
                status=data.get('status', 'Draft'), # Defaults to Draft if not provided
                tags=data.get('tags'),
                scent_family=data.get('scent_family')
            )
            
            db.session.add(new_product)
            db.session.flush() # Assigns an ID to new_product without permanently saving yet
            
            # 3. Create Variants (if provided)
            variants_data = data.get('variants', [])
            for v_data in variants_data:
                variant = ProductVariant(
                    product_id=new_product.id,
                    sku=v_data.get('sku'),
                    size=v_data.get('size'),
                    metal_type=v_data.get('metal_type'),
                    price_adjustment=float(v_data.get('price_adjustment', 0.0)),
                    available_stock=int(v_data.get('available_stock', 0))
                )
                db.session.add(variant)
                
            # 4. Create Media (if provided)
            media_data = data.get('media', [])
            for m_data in media_data:
                media = ProductMedia(
                    product_id=new_product.id,
                    image_url=m_data.get('image_url'),
                    is_main_image=m_data.get('is_main_image', False)
                )
                db.session.add(media)
                
            # 5. Commit everything to the database safely
            db.session.commit()
            
            return jsonify({
                "message": "Product created successfully",
                "product": new_product.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback() # If anything fails, undo everything!
            return jsonify({"error": str(e)}), 500
        
    # =========================================================
    # ADMIN DASHBOARD ROUTES (PROTECTED)
    # =========================================================

    @app.route('/api/admin/dashboard/stats', methods=['GET'])
    @jwt_required()
    def get_dashboard_stats():
        """Powers the top cards on the dashboard and orders page."""
        total_sales = db.session.query(db.func.sum(Order.total_amount)).filter(Order.payment_status == 'Paid').scalar() or 0.0
        pending_orders = Order.query.filter_by(fulfillment_status='Unfulfilled').count()
        total_customers = Customer.query.count()
        low_stock_items = ProductVariant.query.filter(ProductVariant.available_stock < 5).count()

        return jsonify({
            "total_sales": total_sales,
            "pending_orders": pending_orders,
            "total_customers": total_customers,
            "low_stock_items": low_stock_items
        }), 200

    @app.route('/api/admin/orders', methods=['GET'])
    @jwt_required()
    def get_admin_orders():
        """Powers the Orders List page."""
        orders = Order.query.order_by(Order.created_at.desc()).all()
        return jsonify([order.to_dict() for order in orders]), 200
    
    @app.route('/api/admin/orders/<int:order_id>', methods=['GET'])
    @jwt_required()
    def get_single_order(order_id):
        order = Order.query.filter_by(id=order_id).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404
            
        # Manually build the dictionary to include the items
        order_data = order.to_dict()
        order_data['items'] = []
        for item in order.items:
            order_data['items'].append({
                "id": item.id,
                "product_name": item.variant.product.title if item.variant and item.variant.product else "Unknown",
                "sku": item.variant.sku if item.variant else "Unknown",
                "quantity": item.quantity,
                "price": item.price_at_purchase
            })
            
        return jsonify(order_data), 200

    @app.route('/api/admin/customers', methods=['GET'])
    @jwt_required()
    def get_admin_customers():
        """Powers the Customer Database page."""
        customers = Customer.query.order_by(Customer.created_at.desc()).all()
        return jsonify([customer.to_dict() for customer in customers]), 200

    @app.route('/api/admin/inventory', methods=['GET'])
    @jwt_required()
    def get_admin_inventory():
        """Powers the Inventory & Stock Matrix page."""
        variants = ProductVariant.query.all()
        inventory_data = []
        for v in variants:
            inventory_data.append({
                "product_name": v.product.title if v.product else "Unknown",
                "sku": v.sku,
                "committed": v.committed_stock,
                "available": v.available_stock,
                "status": "Out of Stock" if v.available_stock == 0 else ("Low Stock" if v.available_stock < 5 else "Healthy")
            })
        return jsonify(inventory_data), 200
    
    # ---------------------------------------------------------
    # ROUTE: INITIATE M-PESA CHECKOUT
    # ---------------------------------------------------------
    @app.route('/api/checkout/mpesa', methods=['POST'])
    def mpesa_checkout():
        data = request.get_json()
        raw_phone = data.get('phone_number')
        amount = data.get('amount') # Ideally, recalculate this on the backend based on cart items!
        
        if not raw_phone or not amount:
            return jsonify({"error": "Phone number and amount required"}), 400

        phone_number = format_phone_number(raw_phone)
        
        # 1. Prepare Daraja STK Push Payload
        access_token = get_mpesa_access_token()
        api_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = generate_password(timestamp)
        
        # CRITICAL: This is where Safaricom will send the receipt. 
        # For local testing, you MUST use an ngrok URL here, not 127.0.0.1
        callback_url = "https://swipe-list-portal.ngrok-free.dev"

        payload = {
            "BusinessShortCode": BUSINESS_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(float(amount)), # Daraja Sandbox prefers integers
            "PartyA": phone_number,
            "PartyB": BUSINESS_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url,
            "AccountReference": "The Pink Edit",
            "TransactionDesc": "Perfume and Jewellery Order"
        }
        
        # 2. Send Request to Safaricom
        response = requests.post(api_url, json=payload, headers=headers)
        mpesa_data = response.json()

        # ADD THIS LINE TO DEBUG:
        print("\n--- DARAJA RESPONSE ---")
        print(mpesa_data)
        print("-----------------------\n")
        
        
        if mpesa_data.get('ResponseCode') == '0':
            # SUCCESS: The prompt is on the user's phone!
            # Here is where you would normally create the `Order` and `Payment` 
            # in your database and save the `CheckoutRequestID` to track it.
            return jsonify({
                "message": "STK Push sent successfully. Please check your phone.",
                "checkout_request_id": mpesa_data.get('CheckoutRequestID')
            }), 200
        else:
            return jsonify({"error": "Failed to initiate M-Pesa", "details": mpesa_data}), 400

    # ---------------------------------------------------------
    # ROUTE: SAFARICOM CALLBACK (The Receipt)
    # ---------------------------------------------------------
    @app.route('/api/callback/mpesa', methods=['POST'])
    def mpesa_callback():
        # Safaricom calls this URL automatically. 
        callback_data = request.get_json()
        
        result_code = callback_data['Body']['stkCallback']['ResultCode']
        checkout_request_id = callback_data['Body']['stkCallback']['CheckoutRequestID']
        
        if result_code == 0:
            # Payment SUCCESSFUL
            # 1. Find the Payment in DB using checkout_request_id
            # 2. Update Payment status to 'Completed'
            # 3. Update Order fulfillment_status to 'Processing'
            print(f"✅ Payment Success for {checkout_request_id}")
        else:
            # Payment FAILED or CANCELLED
            # 1. Update Payment status to 'Failed'
            # 2. Release 'committed_stock' back to 'available_stock'
            print(f"❌ Payment Failed for {checkout_request_id}")

        # You must return a success response so Safaricom knows you received it
        return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)

    

