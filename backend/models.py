from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

class AdminUser(db.Model):
    __tablename__ = 'admin_users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    
    # Roles: 'SuperAdmin', 'Fulfillment', 'Support'
    role = db.Column(db.String(20), nullable=False, default='Support') 
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        """Hashes the password before saving to the database."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifies the password during login."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Returns safe user data (NEVER return the password hash)."""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'is_active': self.is_active
        }

    def __repr__(self):
        return f"<AdminUser {self.email} - {self.role}>"
    
# ... (Keep your existing AdminUser code up here) ...

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Grouping
    category = db.Column(db.String(100), nullable=False) # e.g., 'Perfume', 'Fine Jewellery'
    collection = db.Column(db.String(100), nullable=True) # e.g., 'The Autumn Edit'
    
    # Pricing & Status
    base_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Draft') # 'Draft', 'Active', 'Archived'
    tags = db.Column(db.String(255), nullable=True) # comma-separated like 'Best Seller, New'
    scent_family = db.Column(db.String(100), nullable=True)
    
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships (Links this product to its variants and images)
    variants = db.relationship('ProductVariant', backref='product', lazy=True, cascade="all, delete-orphan")
    media = db.relationship('ProductMedia', backref='product', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'collection': self.collection,
            'base_price': self.base_price,
            'status': self.status,
            'tags': self.tags,
            'scent_family': self.scent_family,
            'variants': [variant.to_dict() for variant in self.variants],
            'media': [image.to_dict() for image in self.media]
        }

class ProductVariant(db.Model):
    __tablename__ = 'product_variants'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    sku = db.Column(db.String(100), unique=True, nullable=False)
    size = db.Column(db.String(50), nullable=True) # e.g., '100ml', 'Ring Size 6'
    metal_type = db.Column(db.String(100), nullable=True) # e.g., '18k Gold'
    
    # If a 200ml bottle costs $50 more than the base_price
    price_adjustment = db.Column(db.Float, default=0.0) 
    
    # The robust inventory system
    available_stock = db.Column(db.Integer, default=0)
    committed_stock = db.Column(db.Integer, default=0) # Items in carts/unfulfilled orders
    weight_grams = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'sku': self.sku,
            'size': self.size,
            'metal_type': self.metal_type,
            'price': self.product.base_price + self.price_adjustment if self.product else 0,
            'available_stock': self.available_stock,
            'committed_stock': self.committed_stock
        }

class ProductMedia(db.Model):
    __tablename__ = 'product_media'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    image_url = db.Column(db.String(500), nullable=False)
    is_main_image = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'image_url': self.image_url,
            'is_main_image': self.is_main_image
        }
    
# ... (Keep AdminUser, Product, ProductVariant, ProductMedia above this) ...

from werkzeug.security import generate_password_hash, check_password_hash

class Customer(db.Model):
    __tablename__ = 'customers'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    
    # --- ADD THIS ROW FOR PASSWORDS ---
    password_hash = db.Column(db.String(256), nullable=True) 
    
    status = db.Column(db.String(50), default='New') # 'New', 'Regular', 'VIP'
    total_spent = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    orders = db.relationship('Order', backref='customer', lazy=True)

    # --- ADD THESE TWO METHODS ---
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': f"{self.first_name} {self.last_name}",
            'email': self.email,
            'status': self.status,
            'total_spent': self.total_spent,
            'orders_count': len(self.orders)
        }

class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False) # e.g., #PE-1085
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    
    # Financials
    subtotal = db.Column(db.Float, nullable=False)
    shipping_cost = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, nullable=False)
    
    # Status Tracking
    fulfillment_status = db.Column(db.String(50), default='Unfulfilled') # Unfulfilled, Fulfilled, Canceled
    payment_status = db.Column(db.String(50), default='Pending') # Pending, Paid, Refunded
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")
    payments = db.relationship('Payment', backref='order', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer': self.customer.to_dict() if self.customer else None,
            'total_amount': self.total_amount,
            'fulfillment_status': self.fulfillment_status,
            'payment_status': self.payment_status,
            'date': self.created_at.isoformat()
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    variant_id = db.Column(db.Integer, db.ForeignKey('product_variants.id'), nullable=False)
    
    quantity = db.Column(db.Integer, nullable=False)
    price_at_purchase = db.Column(db.Float, nullable=False) # Locks in the price in case product price changes later

    variant = db.relationship('ProductVariant')

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    
    method = db.Column(db.String(50), nullable=False) # 'mpesa' or 'card'
    transaction_reference = db.Column(db.String(100), unique=True, nullable=True) # M-Pesa code or Stripe ID
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Pending') # 'Pending', 'Completed', 'Failed'
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Cart(db.Model):
    __tablename__ = 'carts'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    items = db.relationship('CartItem', backref='cart', lazy=True, cascade="all, delete-orphan")

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    # Assuming you have a Product or ProductVariant model. Adjust the ForeignKey to match your exact setup!
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False) 
    quantity = db.Column(db.Integer, default=1, nullable=False)