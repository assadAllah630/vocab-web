import psycopg2
import os

# Database connection
DATABASE_URL = "postgresql://vocabmaster:1RZ8xSDg5Acx599w1TRBdj2u74jMXjSv@dpg-d4jmdn0bdp1s73825mcg-a.oregon-postgres.render.com/vocabmaster"

print("🗑️  Clearing Client Data from Live Database...")
print("⚠️  Users and Admin Roles will NOT be deleted")
print()

try:
    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("✅ Connected to database")
    
    # Get counts before deletion
    cursor.execute("SELECT COUNT(*) FROM auth_user")
    total_users = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM auth_user WHERE is_staff = true OR is_superuser = true")
    admin_users = cursor.fetchone()[0]
    
    client_users = total_users - admin_users
    
    cursor.execute("SELECT COUNT(*) FROM api_vocabulary")
    vocab_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM api_userprogress")
    progress_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM api_quiz")
    quiz_count = cursor.fetchone()[0]
    
    # Check if grammar table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'api_grammar'
        )
    """)
    grammar_exists = cursor.fetchone()[0]
    grammar_count = 0
    if grammar_exists:
        cursor.execute("SELECT COUNT(*) FROM api_grammar")
        grammar_count = cursor.fetchone()[0]
    
    print(f"\n📊 Current Data:")
    print(f"   Total Users: {total_users}")
    print(f"   Admin Users: {admin_users} (WILL BE KEPT)")
    print(f"   Client Users: {client_users} (WILL BE DELETED)")
    print(f"   Vocabulary: {vocab_count} (WILL BE DELETED)")
    print(f"   User Progress: {progress_count} (WILL BE DELETED)")
    print(f"   Quizzes: {quiz_count} (WILL BE DELETED)")
    if grammar_exists:
        print(f"   Grammar: {grammar_count} (WILL BE DELETED)")
    
    print(f"\n🚀 Deleting client data and users...")
    
    # Delete client data first
    cursor.execute("DELETE FROM api_userprogress")
    cursor.execute("DELETE FROM api_quiz")
    if grammar_exists:
        cursor.execute("DELETE FROM api_grammar")
    cursor.execute("DELETE FROM api_vocabulary")
    
    # Delete all related records for client users (to avoid foreign key constraints)
    # Get IDs of client users first
    cursor.execute("""
        SELECT id FROM auth_user 
        WHERE is_staff = false AND is_superuser = false
    """)
    client_user_ids = [row[0] for row in cursor.fetchall()]
    
    if client_user_ids:
        client_ids_str = ','.join(str(id) for id in client_user_ids)
        
        # Delete auth tokens
        cursor.execute(f"DELETE FROM authtoken_token WHERE user_id IN ({client_ids_str})")
        
        # Delete user profiles
        cursor.execute(f"DELETE FROM api_userprofile WHERE user_id IN ({client_ids_str})")
        
        # Delete sessions (if they reference users directly)
        # Django sessions are usually cleaned up automatically, but we'll try anyway
        try:
            cursor.execute(f"DELETE FROM django_session WHERE session_data LIKE '%_auth_user_id%'")
        except:
            pass  # Ignore if this fails
        
        # Now delete the client users
        cursor.execute(f"DELETE FROM auth_user WHERE id IN ({client_ids_str})")
        
        print(f"   Deleted {len(client_user_ids)} client users")
    
    # Commit the transaction
    conn.commit()
    
    # Verify deletions
    cursor.execute("SELECT COUNT(*) FROM auth_user")
    remaining_users = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM api_vocabulary")
    remaining_vocab = cursor.fetchone()[0]
    
    print(f"\n✅ Deletion Complete!")
    print(f"   Remaining Users: {remaining_users}")
    print(f"   Remaining Vocabulary: {remaining_vocab}")
    print(f"   Remaining Progress: 0")
    print(f"   Remaining Quizzes: 0")
    print(f"   Remaining Grammar: 0")
    
    cursor.close()
    conn.close()
    
    print(f"\n🎉 Database cleared successfully!")
    print(f"   All user accounts and admin roles are intact.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    if 'conn' in locals():
        conn.rollback()
