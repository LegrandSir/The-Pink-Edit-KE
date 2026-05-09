# backend/seed_products.py
from app import create_app
from extensions import db
from models import Product, ProductVariant, ProductMedia

app = create_app()

def seed_products():
    with app.app_context():
        products_to_seed = [
            {
                "title": "Rose Nocturne",
                "description": "An olfactory narrative of a midnight garden. Rose Nocturne blends the velvety richness of Damask Rose with the mysterious depth of patchouli and smoked oud. A scent crafted for those who find beauty in the shadows.",
                "category": "Perfumes",
                "collection": "Signature Collection",
                "base_price": 24000.00,
                "status": "Active",
                "tags": "Best Seller",
                "scent_family": "Floral",
                "image": "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop",
                "variants": [
                    {"sku": "RN-PERF-30ML", "size": "30ml", "price_adjustment": -8000.00, "stock": 45},
                    {"sku": "RN-PERF-100ML", "size": "100ml", "price_adjustment": 0.00, "stock": 112},
                    {"sku": "RN-PERF-200ML", "size": "200ml", "price_adjustment": 11000.00, "stock": 15}
                ]
            },
            {
                "title": "L'Ombre Extrait",
                "description": "A deeply intoxicating blend of dark amber, crushed vanilla pods, and aged leather. L'Ombre is uncompromising and bold, designed to leave an unforgettable trail.",
                "category": "Perfumes",
                "collection": "Noir Collection",
                "base_price": 24000.00,
                "status": "Active",
                "tags": "New",
                "scent_family": "Woody",
                "image": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop",
                "variants": [
                    {"sku": "LO-PERF-50ML", "size": "50ml", "price_adjustment": 0.00, "stock": 30},
                    {"sku": "LO-PERF-100ML", "size": "100ml", "price_adjustment": 12000.00, "stock": 10}
                ]
            },
            {
                "title": "Velvet Rose Mist",
                "description": "A light, refreshing interpretation of a morning rose garden. Perfect for daily wear, this mist hydrates the skin while imparting a delicate, airy floral scent.",
                "category": "Perfumes",
                "collection": "Essentials",
                "base_price": 9500.00,
                "status": "Active",
                "tags": "",
                "scent_family": "Floral",
                "image": "https://images.unsplash.com/photo-1615397323214-6c0b39bce1ee?q=80&w=800&auto=format&fit=crop",
                "variants": [
                    {"sku": "VR-MIST-150ML", "size": "150ml", "price_adjustment": 0.00, "stock": 250}
                ]
            },
            {
                "title": "Celestial Band",
                "description": "Crafted from solid 18k white gold and studded with ethically sourced moissanite stones that catch the light from every angle. A minimalist statement piece.",
                "category": "Fine Jewellery",
                "collection": "Bridal & Eternity",
                "base_price": 89000.00,
                "status": "Active",
                "tags": "Limited Edition",
                "scent_family": None,
                "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop",
                "variants": [
                    {"sku": "CB-RING-SZ6", "size": "Size 6", "price_adjustment": 0.00, "stock": 5},
                    {"sku": "CB-RING-SZ7", "size": "Size 7", "price_adjustment": 0.00, "stock": 8},
                    {"sku": "CB-RING-SZ8", "size": "Size 8", "price_adjustment": 0.00, "stock": 3}
                ]
            },
            {
                "title": "Pearl Drop Earrings",
                "description": "Timeless elegance redefined. Featuring freshwater teardrop pearls suspended from 14k gold-filled hoops. Perfect for both evening wear and sophisticated daily styling.",
                "category": "Fine Jewellery",
                "collection": "Classics",
                "base_price": 42000.00,
                "status": "Active",
                "tags": "",
                "scent_family": None,
                "image": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
                "variants": [
                    {"sku": "PD-EAR-OS", "size": "One Size", "price_adjustment": 0.00, "stock": 14}
                ]
            }
        ]

        for p_data in products_to_seed:
            existing_product = Product.query.filter_by(title=p_data["title"]).first()
            
            if existing_product:
                print(f"✅ {p_data['title']} already exists in the database.")
            else:
                print(f"⏳ Injecting {p_data['title']} into the database...")
                
                # Create Parent Product
                new_product = Product(
                    title=p_data["title"],
                    description=p_data["description"],
                    category=p_data["category"],
                    collection=p_data["collection"],
                    base_price=p_data["base_price"],
                    status=p_data["status"],
                    tags=p_data["tags"],
                    scent_family=p_data["scent_family"]
                )
                db.session.add(new_product)
                db.session.commit()
                
                # Create Variants
                variants = []
                for v_data in p_data["variants"]:
                    variants.append(ProductVariant(
                        product_id=new_product.id,
                        sku=v_data["sku"],
                        size=v_data["size"],
                        price_adjustment=v_data["price_adjustment"],
                        available_stock=v_data["stock"]
                    ))
                db.session.add_all(variants)
                
                # Create Media
                main_image = ProductMedia(
                    product_id=new_product.id,
                    image_url=p_data["image"],
                    is_main_image=True,
                    display_order=1
                )
                db.session.add(main_image)
                
                db.session.commit()
                print(f"🎉 Success! {p_data['title']} added.")

if __name__ == "__main__":
    seed_products()