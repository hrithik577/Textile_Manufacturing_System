"""
Everest Textile OS — Quick PostgreSQL Database Inspector
Run anytime with: py check_db.py [optional_table_name]
Examples:
  py check_db.py
  py check_db.py sales_orders
  py check_db.py inventory_movements
  py check_db.py fabric_rolls
"""
import sys
import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "netis2$$",
    "dbname": "everest_textile_db"
}

def check_database():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        print(f"[ERROR] Could not connect to PostgreSQL: {e}")
        return

    # If specific table requested
    if len(sys.argv) > 1:
        table_name = sys.argv[1]
        print(f"\n=======================================================")
        print(f"  POSTGRESQL TABLE: {table_name}")
        print(f"=======================================================")
        try:
            cur.execute(f'SELECT * FROM "{table_name}" LIMIT 10;')
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            print(f"Columns: {', '.join(cols)}\n")
            if not rows:
                print("Table is currently empty.")
            for r in rows:
                print(r)
            print(f"\nTotal rows shown: {len(rows)}")
        except Exception as err:
            print(f"Error querying table '{table_name}': {err}")
        conn.close()
        return

    print("=======================================================")
    print("  EVEREST TEXTILE OS — POSTGRESQL DATABASE SUMMARY")
    print("  Database: everest_textile_db (Port: 5432)")
    print("=======================================================\n")

    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [t[0] for t in cur.fetchall()]

    for t in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{t}";')
        count = cur.fetchone()[0]
        print(f"  {t:<25} : {count} records")

    print("\n-------------------------------------------------------")
    print("Recent Live Records:")
    print("-------------------------------------------------------")
    
    cur.execute("SELECT order_number, status, priority FROM sales_orders ORDER BY id DESC LIMIT 3;")
    print("Latest Orders:")
    for o in cur.fetchall():
        print(f"  - Order {o[0]} | Status: {o[1]} | Priority: {o[2]}")

    cur.execute("SELECT lot_number, received_quantity, storage_location FROM material_lots ORDER BY id DESC LIMIT 3;")
    print("\nLatest Yarn Lots:")
    for l in cur.fetchall():
        print(f"  - Lot {l[0]} | Quantity: {l[1]} kg | Location: {l[2]}")

    print("\nTo view any table in detail, run:")
    print("  py check_db.py sales_orders")
    print("  py check_db.py inventory_movements")
    print("  py check_db.py fabric_rolls")
    print("=======================================================\n")

    cur.close()
    conn.close()

if __name__ == "__main__":
    check_database()
