#!/bin/bash

# Script to concatenate all documentation files in the docs/ folder into a single file

# Output file
output_file="all-docs.md"

# Remove existing output file if it exists
rm -f "$output_file"

# Create header for the concatenated file
echo "# All Documentation" > "$output_file"
echo "" >> "$output_file"
echo "This file contains all documentation from the docs/ folder, concatenated automatically." >> "$output_file"
echo "" >> "$output_file"

# Find all markdown files in docs/ and concatenate them
find docs/ -name "*.md" -type f | sort | while read -r file; do
    echo "---" >> "$output_file"
    echo "" >> "$output_file"
    echo "# File: $file" >> "$output_file"
    echo "" >> "$output_file"
    cat "$file" >> "$output_file"
    echo "" >> "$output_file"
    echo "" >> "$output_file"
done

echo "Documentation concatenated into $output_file"