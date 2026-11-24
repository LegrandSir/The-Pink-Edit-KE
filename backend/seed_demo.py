# backend/seed_demo.py
from datetime import datetime, timedelta, timezone
from app import create_app, recalculate_customer_metrics
from extensions import db
from models import (
    AdminUser,
    Customer,
    Order,
    OrderItem,
    Payment,
    Product,
    ProductMedia,
    ProductVariant,
    StoreSetting,
    WishlistItem,
)

app = create_app()


def seed_all():
    with app.app_context():
        print("🚀 Starting The Pink Edit portfolio seed...")

        # 1. Store Settings
        if not StoreSetting.query.first():
            db.session.add(StoreSetting())
            db.session.commit()

        # 2. Admin Team
        admins = [
            ("admin@thepinkedit.com", "System", "Admin", "SuperAdmin", "Admin123!"),
            ("zuri@thepinkedit.com", "Zuri", "Mwangi", "Fulfillment", "Staff123!"),
            ("imani@thepinkedit.com", "Imani", "Ochieng", "Editor", "Staff123!"),
        ]
        for email, fname, lname, role, pwd in admins:
            existing = AdminUser.query.filter_by(email=email).first()
            if not existing:
                u = AdminUser(email=email, first_name=fname, last_name=lname, role=role)
                u.set_password(pwd)
                db.session.add(u)
        db.session.commit()
        print("✅ Admin team seeded.")

        # 3. Luxury Product Catalog (Updates existing seeded items to fix old USD prices/images)
        catalog = [
            {
                "title": "Rose Nocturne",
                "description": "An olfactory narrative of a midnight garden. Rose Nocturne blends the velvety richness of Damask Rose with the mysterious depth of patchouli and smoked oud—crafted for those who find beauty in the shadows.",
                "category": "Perfumes",
                "collection": "Signature Collection",
                "base_price": 24000.0,
                "status": "Active",
                "tags": "Best Seller",
                "scent_family": "Floral",
                "scent_notes": "Top: Pink Pepper, Calabrian Bergamot | Heart: Damask Rose, Peony | Base: Smoked Oud, Indonesian Patchouli",
                "images": [
                    "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=900&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=900&auto=format&fit=crop",
                ],
                "variants": [
                    {"sku": "RN-PERF-30ML", "size": "30ml", "price_adjustment": -8000.0, "stock": 42},
                    {"sku": "RN-PERF-100ML", "size": "100ml", "price_adjustment": 0.0, "stock": 95},
                    {"sku": "RN-PERF-200ML", "size": "200ml", "price_adjustment": 11000.0, "stock": 6},
                ],
            },
            {
                "title": "L'Ombre Extrait",
                "description": "A deeply intoxicating extrait de parfum uniting dark amber, crushed Madagascar vanilla pods, and aged suede. Uncompromising and luminous, leaving an unmistakable evening trail.",
                "category": "Perfumes",
                "collection": "Noir Collection",
                "base_price": 28500.0,
                "status": "Active",
                "tags": "New Arrival",
                "scent_family": "Woody",
                "scent_notes": "Top: Saffron, Cardamom | Heart: Dark Amber, Labdanum | Base: Madagascar Vanilla, Suede, Cedarwood",
                "images": [
                    "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=900&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=900&auto=format&fit=crop",
                ],
                "variants": [
                    {"sku": "LO-PERF-50ML", "size": "50ml", "price_adjustment": 0.0, "stock": 28},
                    {"sku": "LO-PERF-100ML", "size": "100ml", "price_adjustment": 12000.0, "stock": 9},
                ],
            },
            {
                "title": "Velvet Rose Mist",
                "description": "An airy, skin-softening interpretation of a morning rose garden after rain. Formulated with botanical glycerin to impart a delicate floral veil from dawn to dusk.",
                "category": "Perfumes",
                "collection": "Essentials",
                "base_price": 9500.0,
                "status": "Active",
                "tags": "Daily Edit",
                "scent_family": "Floral",
                "scent_notes": "Top: Lychee, White Tea | Heart: Centifolia Rose, Magnolia | Base: White Musk, Cashmere Wood",
                "images": [
                    "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=900&auto=format&fit=crop",
                ],
                "variants": [
                    {"sku": "VR-MIST-150ML", "size": "150ml", "price_adjustment": 0.0, "stock": 64},
                ],
            },
            {
                "title": "Soleil de Lamu",
                "description": "Inspired by golden hour along the Swahili coast. Sparkling Sicilian citrus opens into salted neroli blossom and warm driftwood—bright, effortless, and sun-drenched.",
                "category": "Perfumes",
                "collection": "Coastal Edition",
                "base_price": 19500.0,
                "status": "Active",
                "tags": "Limited Edition",
                "scent_family": "Citrus",
                "scent_notes": "Top: Blood Orange, Petitgrain | Heart: Neroli, Sea Salt, Jasmine | Base: Driftwood, Ambrette",
                "images": [
                    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=900&auto=format&fit=crop",
                ],
                "variants": [
                    {"sku": "SL-PERF-50ML", "size": "50ml", "price_adjustment": 0.0, "stock": 18},
                    {"sku": "SL-PERF-100ML", "size": "100ml", "price_adjustment": 8500.0, "stock": 4},
                ],
            },
            {
                "title": "Celestial Pavé Band",
                "description": "Hand-finished in solid 18k gold vermeil and pavé-set with ethically sourced moissanite stones that catch candlelight from every angle. Designed to stack or shine solo.",
                "category": "Fine Jewellery",
                "collection": "Bridal & Eternity",
                "base_price": 48000.0,
                "status": "Active",
                "tags": "Limited Edition",
                "scent_family": None,
                "scent_notes": "Material: 18k Yellow Gold | Stones: Ethically Sourced Moissanite | Finish: Hand-Polished Mirror",
                "images": [
                    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=900&auto=format&fit=crop",
                ],
                "variants": [
                    {"sku": "CB-RING-SZ6", "size": "Size 6", "metal_type": "18k Yellow Gold", "price_adjustment": 0.0, "stock": 5},
                    {"sku": "CB-RING-SZ7", "size": "Size 7", "metal_type": "18k Yellow Gold", "price_adjustment": 0.0, "stock": 8},
                    {"sku": "CB-RING-SZ8", "size": "Size 8", "metal_type": "18k White Gold", "price_adjustment": 3500.0, "stock": 3},
                ],
            },
            {
                "title": "Pearl Drop Earrings",
                "description": "Timeless elegance redefined. Luminous freshwater teardrop pearls suspended from sculptural 18k gold-plated hoops, transitioning seamlessly from atelier meetings to evening galas.",
                "category": "Fine Jewellery",
                "collection": "Classics",
                "base_price": 32000.0,
                "status": "Active",
                "tags": "Best Seller",
                "scent_family": None,
                "scent_notes": "Material: 18k Yellow Gold | Pearls: AAA Freshwater Baroque | Weight: 4.2g per pair",
                "images": [
                    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=900&auto=format&fit=crop",
                ],
                "variants": [
                    {"sku": "PD-EAR-OS", "size": "One Size", "metal_type": "18k Yellow Gold", "price_adjustment": 0.0, "stock": 14},
                ],
            },
            {
                "title": "Aurelia Pendant Necklace",
                "description": "A delicate fine-link chain cradling a brushed medallion inspired by antique Roman coinage. Waterproof, hypoallergenic, and layered effortlessly.",
                "category": "Fine Jewellery",
                "collection": "Classics",
                "base_price": 26500.0,
                "status": "Active",
                "tags": "New Arrival",
                "scent_family": None,
                "scent_notes": "Material: 18k Yellow Gold over Sterling Silver | Chain Length: 42cm + 5cm extender",
                "images": [
                    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=900&auto=format&fit=crop",
                ],
                "variants": [
                    {"sku": "AP-NECK-42", "size": "42cm", "metal_type": "18k Yellow Gold", "price_adjustment": 0.0, "stock": 16},
                    {"sku": "AP-NECK-50", "size": "50cm", "metal_type": "Sterling Silver", "price_adjustment": -2500.0, "stock": 11},
                ],
            },
            {
                "title": "Oud & Fig Atelier Candle",
                "description": "Hand-poured soy and beeswax blend housed in a reusable smoked blush glass vessel. Fills your sanctuary with roasted green fig, cedar, and warm amber for up to 55 hours.",
                "category": "Home Fragrance",
                "collection": "Sanctuary",
                "base_price": 7800.0,
                "status": "Active",
                "tags": "Gift Ready",
                "scent_family": "Oriental",
                "scent_notes": "Top: Crushed Fig Leaf | Heart: Black Tea, Orris | Base: Smoked Oud, Tonka Bean | Burn Time: 55 hrs",
                "images": [
                    "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?q=80&w=900&auto=format&fit=crop",
                ],
                "variants": [
                    {"sku": "OF-CNDL-220G", "size": "220g", "price_adjustment": 0.0, "stock": 34},
                    {"sku": "OF-CNDL-450G", "size": "450g (3-Wick)", "price_adjustment": 4200.0, "stock": 4},
                ],
            },
        ]

        # Archive old mismatched seed duplicate if present
        old_dup = Product.query.filter_by(title="Luminous Pearl Drop Earrings").first()
        if old_dup:
            old_dup.is_deleted = True
            old_dup.status = "Archived"
            db.session.commit()

        product_map = {}
        for p_data in catalog:
            product = Product.query.filter_by(title=p_data["title"]).first()
            if not product:
                product = Product(
                    title=p_data["title"],
                    description=p_data["description"],
                    category=p_data["category"],
                    collection=p_data["collection"],
                    base_price=p_data["base_price"],
                    status=p_data["status"],
                    tags=p_data["tags"],
                    scent_family=p_data["scent_family"],
                    scent_notes=p_data["scent_notes"],
                    is_deleted=False,
                )
                db.session.add(product)
                db.session.flush()
            else:
                product.description = p_data["description"]
                product.category = p_data["category"]
                product.collection = p_data["collection"]
                product.base_price = p_data["base_price"]
                product.status = p_data["status"]
                product.tags = p_data["tags"]
                product.scent_family = p_data["scent_family"]
                product.scent_notes = p_data["scent_notes"]
                product.is_deleted = False

            # Ensure media is clean & working
            ProductMedia.query.filter_by(product_id=product.id).delete()
            for idx, url in enumerate(p_data["images"]):
                db.session.add(
                    ProductMedia(
                        product_id=product.id,
                        image_url=url,
                        is_main_image=(idx == 0),
                        display_order=idx + 1,
                    )
                )

            # Upsert variants by SKU
            for v_data in p_data["variants"]:
                variant = ProductVariant.query.filter_by(sku=v_data["sku"]).first()
                if not variant:
                    variant = ProductVariant(
                        product_id=product.id,
                        sku=v_data["sku"],
                        size=v_data["size"],
                        metal_type=v_data.get("metal_type"),
                        price_adjustment=v_data["price_adjustment"],
                        available_stock=v_data["stock"],
                    )
                    db.session.add(variant)
                else:
                    variant.product_id = product.id
                    variant.size = v_data["size"]
                    variant.metal_type = v_data.get("metal_type")
                    variant.price_adjustment = v_data["price_adjustment"]

            db.session.commit()
            product_map[p_data["title"]] = product

        print(f"✅ Catalog synced ({len(product_map)} luxury products).")

        # 4. Seed Demo Customers
        customers_data = [
            ("Amara", "Wanjiku", "amara@thepinkedit.com", "0712345678", "Kilimani, Rose Avenue, Apt 4B, Nairobi", "Demo123!"),
            ("Nadia", "Kamau", "nadia.kamau@example.com", "0722987654", "Westlands, Rhapta Road, Suite 12, Nairobi", "Demo123!"),
            ("Tasha", "Odhiambo", "tasha.o@example.com", "0798112233", "Lavington, James Gichuru Rd, Nairobi", "Demo123!"),
            ("Zainab", "Hassan", "zainab.h@example.com", "0710554433", "Nyali, Links Road, Mombasa", "Demo123!"),
            ("Chloe", "Mutua", "chloe.mutua@example.com", "0701334455", "Runda, Acacia Drive, Nairobi", "Demo123!"),
            ("Brianna", "Kiprop", "brianna.k@example.com", "0745667788", "Kitisuru, Peponi Rd, Nairobi", "Demo123!"),
        ]
        customer_map = {}
        for fname, lname, email, phone, addr, pwd in customers_data:
            c = Customer.query.filter_by(email=email).first()
            if not c:
                c = Customer(
                    first_name=fname,
                    last_name=lname,
                    email=email,
                    phone_number=phone,
                    default_address=addr,
                )
                c.set_password(pwd)
                db.session.add(c)
                db.session.commit()
            customer_map[email] = c

        # Wishlist items for Demo Customer (Amara)
        amara = customer_map["amara@thepinkedit.com"]
        for title in ["Celestial Pavé Band", "Soleil de Lamu"]:
            prod = product_map.get(title)
            if prod and not WishlistItem.query.filter_by(customer_id=amara.id, product_id=prod.id).first():
                db.session.add(WishlistItem(customer_id=amara.id, product_id=prod.id))
        db.session.commit()
        print("✅ Customers & demo wishlist seeded.")

        # 5. Seed Realistic Historical Orders (for Dashboard charts, Admin Orders & Demo Customer History)
        now = datetime.now(timezone.utc)
        sample_orders = [
            ("PE-9012AK", "amara@thepinkedit.com", 12, "Fulfilled", "Paid", "mpesa", "Doorstep (Nairobi CBD)", [("RN-PERF-100ML", 1), ("OF-CNDL-220G", 1)], "SL8K29MP1A"),
            ("PE-9018BM", "nadia.kamau@example.com", 10, "Fulfilled", "Paid", "mpesa", "Doorstep (Nairobi CBD)", [("CB-RING-SZ7", 1)], "SL7M10XZ9B"),
            ("PE-9024CL", "tasha.o@example.com", 9, "Fulfilled", "Paid", "mpesa", "Pickup Mtaani", [("LO-PERF-50ML", 1), ("VR-MIST-150ML", 1)], "SL5Q44TR2C"),
            ("PE-9031DN", "zainab.h@example.com", 7, "Fulfilled", "Paid", "mpesa", "Countrywide Express (G4S / Fargo)", [("PD-EAR-OS", 1)], "SL9P81VK4D"),
            ("PE-9039EP", "amara@thepinkedit.com", 6, "Shipped", "Paid", "mpesa", "Doorstep (Nairobi CBD)", [("LO-PERF-100ML", 1), ("AP-NECK-42", 1)], "SL2W73NB8E"),
            ("PE-9045FQ", "chloe.mutua@example.com", 5, "Fulfilled", "Paid", "mpesa", "Doorstep (Nairobi CBD)", [("RN-PERF-200ML", 1), ("PD-EAR-OS", 1)], "SL6D19CY5F"),
            ("PE-9052GR", "brianna.k@example.com", 4, "Processing", "Paid", "mpesa", "Pickup Mtaani", [("SL-PERF-50ML", 1), ("OF-CNDL-450G", 1)], "SL3H62JK7G"),
            ("PE-9061HS", "nadia.kamau@example.com", 3, "Processing", "Paid", "mpesa", "Doorstep (Nairobi CBD)", [("AP-NECK-42", 1), ("VR-MIST-150ML", 2)], "SL4R95LM1H"),
            ("PE-9070JT", "tasha.o@example.com", 2, "Unfulfilled", "Pending", "pod", "Doorstep (Nairobi CBD)", [("RN-PERF-30ML", 1)], "POD-PE-9070JT"),
            ("PE-9078KU", "amara@thepinkedit.com", 1, "Processing", "Paid", "mpesa", "Doorstep (Nairobi CBD)", [("SL-PERF-100ML", 1)], "SL1V58PQ3K"),
            ("PE-9084LV", "chloe.mutua@example.com", 0, "Unfulfilled", "Paid", "mpesa", "Doorstep (Nairobi CBD)", [("CB-RING-SZ6", 1), ("RN-PERF-100ML", 1)], "SL9X04WR6L"),
        ]

        created_orders = 0
        for order_no, email, days_ago, ful_status, pay_status, pay_method, del_method, line_items, tx_ref in sample_orders:
            if Order.query.filter_by(order_number=order_no).first():
                continue
            cust = customer_map[email]
            resolved = []
            subtotal = 0.0
            for sku, qty in line_items:
                v = ProductVariant.query.filter_by(sku=sku).first()
                if v:
                    unit = v.product.base_price + (v.price_adjustment or 0.0)
                    subtotal += unit * qty
                    resolved.append((v, qty, unit))
            if not resolved:
                continue

            shipping = 0.0 if subtotal >= 25000 else 500.0
            total = subtotal + shipping
            order_dt = now - timedelta(days=days_ago, hours=2)

            order = Order(
                order_number=order_no,
                customer_id=cust.id,
                subtotal=subtotal,
                shipping_cost=shipping,
                total_amount=total,
                fulfillment_status=ful_status,
                payment_status=pay_status,
                payment_method=pay_method,
                delivery_method=del_method,
                shipping_address=cust.default_address,
                shipping_phone=cust.phone_number,
                tracking_number=f"TPE-NBO-{order_no[-4:]}" if ful_status in ("Shipped", "Fulfilled") else None,
                created_at=order_dt,
            )
            db.session.add(order)
            db.session.flush()

            for v, qty, unit in resolved:
                db.session.add(
                    OrderItem(
                        order_id=order.id,
                        variant_id=v.id,
                        quantity=qty,
                        price_at_purchase=unit,
                    )
                )

            db.session.add(
                Payment(
                    order_id=order.id,
                    method=pay_method,
                    transaction_reference=tx_ref,
                    amount=total,
                    status="Completed" if pay_status == "Paid" else "Pending",
                    created_at=order_dt,
                )
            )
            created_orders += 1

        db.session.commit()

        # Recalculate customer lifetime spend & VIP badges
        for cust in Customer.query.all():
            recalculate_customer_metrics(cust)
        db.session.commit()

        print(f"✅ Seeded {created_orders} new historical orders and updated customer tiers.")
        print("\n🔑 PORTFOLIO DEMO CREDENTIALS:")
        print("   Admin:    admin@thepinkedit.com / Admin123!")
        print("   Customer: amara@thepinkedit.com / Demo123!")


if __name__ == "__main__":
    seed_all()