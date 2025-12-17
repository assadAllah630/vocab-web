import csv
import sys
import os

def update_csv(file_path, completed_components):
    # Read all rows
    rows = []
    with open(file_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    # Add new columns if they don't exist
    new_columns = ['Is Migrated', 'Is Tested']
    column_indices = {}
    
    for col in new_columns:
        if col not in header:
            header.append(col)
            # Add empty values to existing rows
            for row in rows:
                row.append('FALSE')
        
    # Map column indices
    for i, col in enumerate(header):
        column_indices[col] = i

    # Update rows
    migrated_idx = column_indices['Is Migrated']
    tested_idx = column_indices['Is Tested']
    name_idx = column_indices['Component Name']

    updated_count = 0
    for row in rows:
        name = row[name_idx]
        if name in completed_components:
            row[migrated_idx] = 'TRUE'
            row[tested_idx] = 'TRUE'
            updated_count += 1
            print(f"Marked {name} as Migrated & Tested")

    # Write back
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

    print(f"Updated {updated_count} components.")

if __name__ == "__main__":
    csv_path = r'e:\vocab_web\migration_plan\MIGRATION_COMPONENTS_DEEP.csv'
    components_to_mark = ['MobileLayout', 'MobileNav', 'MobileAIWizardLayout']
    update_csv(csv_path, components_to_mark)
