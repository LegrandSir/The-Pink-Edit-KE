# backend/seed_earrings.py
from app import create_app
from extensions import db
from models import Product, ProductVariant, ProductMedia

app = create_app()

with app.app_context():
    print("⏳ Injecting Luminous Pearl Drop Earrings...")
    
    # 1. Create the Parent Product
    new_product = Product(
        title="Luminous Pearl Drop Earrings",
        description="Freshwater pearls on 18k gold.",
        category="Fine Jewellery",
        base_price=420.00,
        status="Active",
        tags="New"
    )
    
    db.session.add(new_product)
    db.session.commit() 
    
    # 2. Create the Variant (Inventory)
    variant = ProductVariant(
        product_id=new_product.id,
        sku="PEARL-DROP-01",
        size="One Size",
        metal_type="18k Gold",
        available_stock=10
    )
    db.session.add(variant)
    
    # 3. Create the Image
    main_image = ProductMedia(
        product_id=new_product.id,
        image_url="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
        is_main_image=True,
        display_order=1
    )
    db.session.add(main_image)
    
    db.session.commit()
    print("🎉 Success! Earrings have been added to the database.")