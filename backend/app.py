# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from extensions import db, jwt, migrate
from models import AdminUser, Product, ProductVariant, ProductMedia, Customer, Order, Payment,Cart, CartItem
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from mpesa_utils import get_mpesa_access_token, generate_password, format_phone_number, BUSINESS_SHORTCODE
import requests
from datetime import datetime
from werkzeug.security import generate_password_hash

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
        products = Product.query.all()
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
    
    # ---------------------------------------------------------
    # ROUTE: CUSTOMER REGISTRATION
    # ---------------------------------------------------------
    # ---------------------------------------------------------
    # ROUTE: CUSTOMER REGISTRATION
    # ---------------------------------------------------------
    @app.route('/api/register', methods=['POST'])
    def register_customer():
        data = request.get_json()
        
        # 1. Look for the single 'name' field coming from React
        if not data or not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({"error": "Name, email, and password are required"}), 400
            
        if Customer.query.filter_by(email=data['email']).first():
            return jsonify({"error": "An account with that email already exists."}), 409
            
        # 2. Split "paul wafula" into "paul" and "wafula"
        full_name = data.get('name').strip()
        name_parts = full_name.split(' ', 1) # Splits only on the first space
        f_name = name_parts[0]
        l_name = name_parts[1] if len(name_parts) > 1 else '' # Fallback if they only type one name
            
        # 3. Feed the split names to the database model
        new_customer = Customer(
            first_name=f_name,
            last_name=l_name,
            email=data['email']
        )
        new_customer.set_password(data['password'])
        
        db.session.add(new_customer)
        db.session.commit()
        
        return jsonify({"message": "Account created successfully!"}), 201

    # ---------------------------------------------------------
    # ROUTE: CUSTOMER LOGIN
    # ---------------------------------------------------------
    @app.route('/api/login', methods=['POST'])
    def customer_login():
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Missing email or password"}), 400
            
        customer = Customer.query.filter_by(email=data['email']).first()
        
        if not customer or not customer.check_password(data['password']):
            return jsonify({"error": "Invalid email or password"}), 401
            
        # Generate the JWT token! 
        # We add a claim "role: customer" so we know they aren't an admin
        access_token = create_access_token(
            identity=customer.id, 
            additional_claims={"role": "customer"}
        )
        
        return jsonify({
            "access_token": access_token,
            "user": customer.to_dict()
        }), 200
    
    # ---------------------------------------------------------
    # ROUTE: GOOGLE SIGN-IN
    # ---------------------------------------------------------
    @app.route('/api/auth/google', methods=['POST'])
    def google_auth():
        data = request.get_json()
        access_token = data.get('access_token')

        if not access_token:
            return jsonify({"error": "No access token provided"}), 400

        # Verify the token with Google's servers
        google_res = requests.get(f'https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}')
        if not google_res.ok:
            return jsonify({"error": "Invalid Google token"}), 401

        user_info = google_res.json()
        email = user_info.get('email')
        full_name = user_info.get('name', 'Google User')

        # Split the name
        name_parts = full_name.split(' ', 1)
        f_name = name_parts[0]
        l_name = name_parts[1] if len(name_parts) > 1 else ''

        # Check if customer exists
        customer = Customer.query.filter_by(email=email).first()

        # If they don't exist, magically create an account for them!
        if not customer:
            customer = Customer(
                first_name=f_name,
                last_name=l_name,
                email=email
            )
            # We don't set a password hash here! 
            db.session.add(customer)
            db.session.commit()

        # Generate our JWT token
        jwt_token = create_access_token(
            identity=customer.id, 
            additional_claims={"role": "customer"}
        )

        return jsonify({
            "access_token": jwt_token,
            "user": customer.to_dict()
        }), 200
    
    # ---------------------------------------------------------
    # ROUTE: SYNC CART
    # ---------------------------------------------------------
    @app.route('/api/cart/sync', methods=['POST'])
    @jwt_required()
    def sync_cart():
        current_user_id = get_jwt_identity()
        data = request.get_json()
        local_items = data.get('localItems', [])

        # 1. Find or create the user's cart in the DB
        cart = Cart.query.filter_by(customer_id=current_user_id).first()
        if not cart:
            cart = Cart(customer_id=current_user_id)
            db.session.add(cart)
            db.session.commit()

        # 2. Merge local items into the database
        for item in local_items:
            db_item = CartItem.query.filter_by(cart_id=cart.id, product_id=item['id']).first()
            if db_item:
                # If it's in both, take the higher quantity to prevent losing items
                db_item.quantity = max(db_item.quantity, item.get('qty', 1))
            else:
                # Add new local item to DB
                new_item = CartItem(cart_id=cart.id, product_id=item['id'], quantity=item.get('qty', 1))
                db.session.add(new_item)
        
        db.session.commit()

        # 3. Build the Master Cart list to send back to React
        # Note: In a real app, you would query your Product model here to get the full title, price, and image.
        # For now, we will construct a basic representation from the DB items.
       # 3. Build the Master Cart list to send back to React
        # 3. Build the Master Cart list to send back to React
        # 3. Build the Master Cart list to send back to React
        master_cart = []
        for db_item in cart.items:
            # Look up the actual product in your database using the ID
            product = db.session.get(Product, db_item.product_id)
            
            if product:
                # Safely grab the first image's URL using the exact column name from your model
                primary_image = product.media[0].image_url if product.media else ""
                
                master_cart.append({
                    "id": db_item.product_id,
                    "qty": db_item.quantity,
                    "title": product.title,        
                    "price": product.base_price,   
                    "image": primary_image         
                })
        return jsonify({"cartItems": master_cart}), 200
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)

    

