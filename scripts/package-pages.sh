#!/usr/bin/env bash
# Package an existing client build for a standalone Cloudflare Pages preview
# with the application at /velo/. No deployment or remote access.
set -euo pipefail
source_dir=.output/public
target_dir=.output/pages
test -s "$source_dir/index.html"
grep -q "/velo/assets/" "$source_dir/index.html" || { echo "Build requires VITE_BASE_PATH=/velo/" >&2; exit 1; }
test -d "$source_dir/assets"
test -f "$source_dir/sw.js"
test -f "$source_dir/manifest.webmanifest"
if git grep -n -E '\bcreateServerFn[[:space:]]*\(' -- src; then
  echo "Server functions detected; static publishing requires further review." >&2
  exit 1
fi
rm -rf -- "$target_dir"
mkdir -p "$target_dir/velo"
cp -a "$source_dir/." "$target_dir/velo/"
# Pages serves root index.html for unknown SPA navigation paths.
cp "$source_dir/index.html" "$target_dir/index.html"
# Root and application path must share the same indexing preference.
cp "$source_dir/robots.txt" "$target_dir/robots.txt"
# Never inherit the source owner's Google verification token.
rm -f -- "$target_dir/velo/google3836faab573a94d5.html"
# Header metadata must live at the deployment root.
if test -f "$target_dir/velo/_headers"; then
  sed 's|^/widget/\*|/velo/widget/*|' "$target_dir/velo/_headers" > "$target_dir/_headers"
  rm "$target_dir/velo/_headers"
fi
printf '%s\n' '/ /velo/ 302' > "$target_dir/_redirects"
echo "Static preview prepared in $target_dir (no upload performed)."
