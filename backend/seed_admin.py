# backend/seed_admin.py
from app import create_app
from extensions import db
from models import AdminUser

# Initialize the Flask app context so we can talk to the database
app = create_app()

with app.app_context():
    # 1. Check if the admin already exists so we don't create duplicates
    existing_admin = AdminUser.query.filter_by(email='admin@thepinkedit.com').first()
    
    if existing_admin:
        print("✅ SuperAdmin already exists in the database.")
    else:
        # 2. Create the new user
        print("⏳ Creating SuperAdmin account...")
        new_admin = AdminUser(
            email='admin@thepinkedit.com',
            first_name='System',
            last_name='Admin',
            role='SuperAdmin'
        )
        
        # 3. Hash the password securely using the method we built in models.py
        new_admin.set_password('Admin123!') 
        
        # 4. Save to the database
        db.session.add(new_admin)
        db.session.commit()
        
        print("🎉 Success! SuperAdmin account created.")
        print("Email: admin@thepinkedit.com")
        print("Password: Admin123!")
        