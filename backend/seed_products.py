# backend/seed_products.py
from app import create_app
from extensions import db
from models import Product, ProductVariant, ProductMedia

app = create_app()

with app.app_context():
    # 1. Check if it already exists
    existing_product = Product.query.filter_by(title="Rose Nocturne").first()
    
    if existing_product:
        print("✅ Rose Nocturne already exists in the database.")
    else:
        print("⏳ Injecting Rose Nocturne into the database...")
        
        # 2. Create the Parent Product
        new_product = Product(
            title="Rose Nocturne",
            description="An olfactory narrative of a midnight garden. Rose Nocturne blends the velvety richness of Damask Rose with the mysterious depth of patchouli and smoked oud. A scent crafted for those who find beauty in the shadows.",
            category="Perfumes",
            collection="Signature Collection",
            base_price=240.00,
            status="Active",
            tags="Best Seller",
            scent_family="Floral"
        )
        
        db.session.add(new_product)
        db.session.commit() # Commit now so we get the new_product.id
        
        # 3. Create the Variants (The actual inventory)
        variants = [
            ProductVariant(
                product_id=new_product.id,
                sku="RN-PERF-30ML",
                size="30ml",
                price_adjustment=-80.00, # Makes it $160
                available_stock=45
            ),
            ProductVariant(
                product_id=new_product.id,
                sku="RN-PERF-100ML",
                size="100ml",
                price_adjustment=0.00, # Base price: $240
                available_stock=112
            ),
            ProductVariant(
                product_id=new_product.id,
                sku="RN-PERF-200ML",
                size="200ml",
                price_adjustment=110.00, # Makes it $350
                available_stock=15
            )
        ]
        db.session.add_all(variants)
        
        # 4. Create the Images
        main_image = ProductMedia(
            product_id=new_product.id,
            image_url="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop",
            is_main_image=True,
            display_order=1
        )
        db.session.add(main_image)
        
        # 5. Final Save
        db.session.commit()
        print("🎉 Success! Rose Nocturne and all variants have been seeded.")