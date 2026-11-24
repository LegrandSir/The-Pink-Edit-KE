# backend/models.py
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
    # Roles: 'SuperAdmin', 'Editor', 'Fulfillment', 'Support'
    role = db.Column(db.String(20), nullable=False, default='Support')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'name': f"{self.first_name} {self.last_name}".strip(),
            'role': self.role,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Grouping
    category = db.Column(db.String(100), nullable=False)  # 'Perfumes', 'Fine Jewellery', 'Home Fragrance'
    collection = db.Column(db.String(100), nullable=True)

    # Pricing, Status & Editorial Details
    base_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Active')  # 'Draft', 'Active', 'Archived'
    tags = db.Column(db.String(255), nullable=True)
    scent_family = db.Column(db.String(100), nullable=True)
    scent_notes = db.Column(db.Text, nullable=True)  # e.g. "Top: Bergamot | Heart: Damask Rose | Base: Oud"

    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    variants = db.relationship('ProductVariant', backref='product', lazy=True, cascade="all, delete-orphan")
    media = db.relationship(
        'ProductMedia',
        backref='product',
        lazy=True,
        cascade="all, delete-orphan",
        order_by="ProductMedia.display_order",
    )

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
            'scent_notes': self.scent_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'variants': [variant.to_dict() for variant in self.variants],
            'media': [image.to_dict() for image in self.media],
        }


class ProductVariant(db.Model):
    __tablename__ = 'product_variants'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)

    sku = db.Column(db.String(100), unique=True, nullable=False)
    size = db.Column(db.String(50), nullable=True)
    metal_type = db.Column(db.String(100), nullable=True)
    price_adjustment = db.Column(db.Float, default=0.0)

    available_stock = db.Column(db.Integer, default=0)
    committed_stock = db.Column(db.Integer, default=0)
    weight_grams = db.Column(db.Float, nullable=True)

    def to_dict(self):
        computed_price = (self.product.base_price + (self.price_adjustment or 0.0)) if self.product else 0.0
        return {
            'id': self.id,
            'product_id': self.product_id,
            'sku': self.sku,
            'size': self.size,
            'metal_type': self.metal_type,
            'price_adjustment': self.price_adjustment or 0.0,
            'price': computed_price,
            'available_stock': self.available_stock,
            'committed_stock': self.committed_stock,
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
            'is_main_image': self.is_main_image,
            'display_order': self.display_order,
        }


class Customer(db.Model):
    __tablename__ = 'customers'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False, default='')
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(30), nullable=True)
    default_address = db.Column(db.Text, nullable=True)
    password_hash = db.Column(db.String(256), nullable=True)

    status = db.Column(db.String(50), default='New')  # 'New', 'Regular', 'VIP'
    total_spent = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    orders = db.relationship('Order', backref='customer', lazy=True)
    wishlist_items = db.relationship('WishlistItem', backref='customer', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'name': f"{self.first_name} {self.last_name}".strip(),
            'email': self.email,
            'phone_number': self.phone_number,
            'default_address': self.default_address,
            'status': self.status,
            'total_spent': self.total_spent or 0.0,
            'orders_count': len(self.orders),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)

    # Financials
    subtotal = db.Column(db.Float, nullable=False)
    shipping_cost = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, nullable=False)

    # Status Tracking
    fulfillment_status = db.Column(db.String(50), default='Unfulfilled')  # Unfulfilled, Processing, Shipped, Fulfilled, Canceled
    payment_status = db.Column(db.String(50), default='Pending')  # Pending, Paid, Refunded
    payment_method = db.Column(db.String(50), default='mpesa')  # mpesa, pod, card

    # Logistics
    delivery_method = db.Column(db.String(100), nullable=True)
    shipping_address = db.Column(db.Text, nullable=True)
    shipping_phone = db.Column(db.String(30), nullable=True)
    tracking_number = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")
    payments = db.relationship('Payment', backref='order', lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_items=False):
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'customer': self.customer.to_dict() if self.customer else None,
            'subtotal': self.subtotal,
            'shipping_cost': self.shipping_cost,
            'total_amount': self.total_amount,
            'fulfillment_status': self.fulfillment_status,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'delivery_method': self.delivery_method,
            'shipping_address': self.shipping_address,
            'shipping_phone': self.shipping_phone,
            'tracking_number': self.tracking_number,
            'notes': self.notes,
            'items_count': sum(i.quantity for i in self.items),
            'date': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
            data['payments'] = [p.to_dict() for p in self.payments]
        return data


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    variant_id = db.Column(db.Integer, db.ForeignKey('product_variants.id'), nullable=False)

    quantity = db.Column(db.Integer, nullable=False)
    price_at_purchase = db.Column(db.Float, nullable=False)

    variant = db.relationship('ProductVariant')

    def to_dict(self):
        product = self.variant.product if self.variant else None
        image_url = ""
        if product and product.media:
            main = next((m for m in product.media if m.is_main_image), product.media[0])
            image_url = main.image_url
        return {
            'id': self.id,
            'product_id': product.id if product else None,
            'product_name': product.title if product else "Archived Item",
            'category': product.category if product else "",
            'variant_id': self.variant_id,
            'sku': self.variant.sku if self.variant else "N/A",
            'size': self.variant.size if self.variant else "",
            'image_url': image_url,
            'quantity': self.quantity,
            'price': self.price_at_purchase,
        }


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)

    method = db.Column(db.String(50), nullable=False)  # 'mpesa', 'pod', 'card'
    transaction_reference = db.Column(db.String(100), unique=True, nullable=True)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Pending')  # 'Pending', 'Completed', 'Failed', 'Refunded'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'method': self.method,
            'transaction_reference': self.transaction_reference,
            'amount': self.amount,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Cart(db.Model):
    __tablename__ = 'carts'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    items = db.relationship('CartItem', backref='cart', lazy=True, cascade="all, delete-orphan")


class CartItem(db.Model):
    __tablename__ = 'cart_items'

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    variant_id = db.Column(db.Integer, db.ForeignKey('product_variants.id'), nullable=True)
    size = db.Column(db.String(50), nullable=True)
    quantity = db.Column(db.Integer, default=1, nullable=False)


class WishlistItem(db.Model):
    __tablename__ = 'wishlist_items'
    __table_args__ = (db.UniqueConstraint('customer_id', 'product_id', name='uq_customer_wishlist_product'),)

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    product = db.relationship('Product')


class StoreSetting(db.Model):
    __tablename__ = 'store_settings'

    id = db.Column(db.Integer, primary_key=True)
    store_name = db.Column(db.String(120), default='The Pink Edit Boutique')
    support_email = db.Column(db.String(120), default='concierge@thepinkedit.com')
    currency = db.Column(db.String(20), default='KES')
    timezone = db.Column(db.String(50), default='EAT')

    mpesa_enabled = db.Column(db.Boolean, default=True)
    stripe_enabled = db.Column(db.Boolean, default=False)
    pod_enabled = db.Column(db.Boolean, default=True)

    flat_shipping_rate = db.Column(db.Float, default=500.0)
    free_shipping_threshold = db.Column(db.Float, default=25000.0)
    tax_rate = db.Column(db.Float, default=16.0)

    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            'store_name': self.store_name,
            'support_email': self.support_email,
            'currency': self.currency,
            'timezone': self.timezone,
            'mpesa_enabled': self.mpesa_enabled,
            'stripe_enabled': self.stripe_enabled,
            'pod_enabled': self.pod_enabled,
            'flat_shipping_rate': self.flat_shipping_rate,
            'free_shipping_threshold': self.free_shipping_threshold,
            'tax_rate': self.tax_rate,
        }


class NewsletterSubscriber(db.Model):
    __tablename__ = 'newsletter_subscribers'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))