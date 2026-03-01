#!/bin/bash
# Optimize product and enemy images for web
# Resizes oversized PNGs to 200x200 (3x retina for 60x60 display)
# Uses macOS built-in `sips` — no dependencies needed

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PRODUCTS_DIR="$PROJECT_ROOT/public/products"
ENEMIES_DIR="$PROJECT_ROOT/public/enemies"

TARGET_SIZE=200

optimize_dir() {
  local dir="$1"
  local label="$2"
  local count=0
  local skipped=0

  if [ ! -d "$dir" ]; then
    echo "  Directory not found: $dir"
    return
  fi

  for file in "$dir"/*.png; do
    [ -f "$file" ] || continue

    # Get current dimensions
    width=$(sips -g pixelWidth "$file" 2>/dev/null | tail -1 | awk '{print $2}')
    height=$(sips -g pixelHeight "$file" 2>/dev/null | tail -1 | awk '{print $2}')

    if [ -z "$width" ] || [ -z "$height" ]; then
      echo "  Skipping (can't read): $(basename "$file")"
      skipped=$((skipped + 1))
      continue
    fi

    if [ "$width" -le "$TARGET_SIZE" ] && [ "$height" -le "$TARGET_SIZE" ]; then
      skipped=$((skipped + 1))
      continue
    fi

    echo "  Resizing $(basename "$file") (${width}x${height} -> ${TARGET_SIZE}x${TARGET_SIZE})"
    sips --resampleHeightWidth "$TARGET_SIZE" "$TARGET_SIZE" "$file" > /dev/null 2>&1
    count=$((count + 1))
  done

  echo "  $label: $count resized, $skipped already optimal"
}

echo "Optimizing game images..."
echo ""

echo "Products:"
optimize_dir "$PRODUCTS_DIR" "Products"
echo ""

echo "Enemies:"
optimize_dir "$ENEMIES_DIR" "Enemies"
echo ""

# Report final sizes
echo "Final sizes:"
du -sh "$PRODUCTS_DIR" 2>/dev/null || true
du -sh "$ENEMIES_DIR" 2>/dev/null || true
echo ""
echo "Done!"
