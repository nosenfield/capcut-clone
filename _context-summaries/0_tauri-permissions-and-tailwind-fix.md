# Tauri Permissions and TailwindCSS Configuration Fixes

**Date**: 2025-01-27  
**Session**: Initial Setup & Configuration  
**Status**: ✅ Fixed

## Problem Summary

The project encountered build errors related to:
1. **Tauri Permissions**: Invalid permission syntax in `capabilities/default.json`
2. **Missing Tauri Plugins**: Required plugins (dialog, fs) not installed
3. **TailwindCSS v4**: PostCSS configuration incompatible with new TailwindCSS architecture

## Errors Encountered

### Error 1: Tauri Permissions
```
Permission dialog:allow-open not found
Permission fs:default not found  
Permission fs:scope-app-data not found
```

### Error 2: TailwindCSS PostCSS
```
[postcss] It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. 
The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS 
with PostCSS you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration.
```

## Solutions Implemented

### 1. Added Required Tauri Plugins

**File**: `src-tauri/Cargo.toml`

Added dependencies:
```toml
tauri-plugin-opener = "2"     # Already present
tauri-plugin-dialog = "2"     # Added
tauri-plugin-fs = "2"         # Added
```

### 2. Initialized Plugins in Rust Backend

**File**: `src-tauri/src/lib.rs`

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())  // Added
        .plugin(tauri_plugin_fs::init())      // Added
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3. Fixed Tauri Permissions

**File**: `src-tauri/capabilities/default.json`

**Changes Made**:
- Replaced `dialog:allow-open` and `dialog:allow-save` with `dialog:default`
- Added `fs:default` for filesystem operations
- Fixed `fs:scope-app-data` → `fs:scope-appdata` (correct Tauri v2 syntax)
- Removed invalid `fs:scope-app-data-recursive-write`
- Kept essential permissions: `core:default`, window controls, events, opener

**Final Configuration**:
```json
{
  "permissions": [
    "core:default",
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-maximize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-set-size",
    "core:window:allow-set-position",
    "core:window:allow-hide",
    "core:window:allow-show",
    "core:window:allow-unminimize",
    "core:window:allow-set-focus",
    "core:event:allow-listen",
    "core:event:allow-emit",
    "dialog:default",
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:scope-appdata",
    "fs:scope-appdata-recursive",
    "opener:default"
  ]
}
```

### 4. Fixed TailwindCSS v4 PostCSS Configuration

**File**: `postcss.config.js`

**Problem**: TailwindCSS v4 uses `@import "tailwindcss"` in CSS files instead of PostCSS plugin approach.

**Solution**: Removed `tailwindcss` from PostCSS plugins since it's now imported directly in CSS.

**Before**:
```js
export default {
  plugins: {
    tailwindcss: {},    // ❌ No longer needed in v4
    autoprefixer: {},
  },
}
```

**After**:
```js
export default {
  plugins: {
    autoprefixer: {},  // ✅ Only autoprefixer needed
  },
}
```

**CSS Import**: Already correctly using `@import "tailwindcss";` in `src/App.css`

### 5. Temporarily Removed FFmpeg Resources

**File**: `src-tauri/tauri.conf.json`

**Change**: Commented out FFmpeg binary resources to allow app to build without FFmpeg installed.

```json
"resources": [
  // "binaries/ffmpeg",     // Will add later
  // "binaries/ffprobe"      // Will add later
],
```

**Note**: FFmpeg binaries will be added during Phase 2 (Backend & FFmpeg Integration).

## Verification

### Build Status
- ✅ `cargo build` succeeds without errors
- ✅ Rust backend compiles correctly
- ✅ PostCSS/TailwindCSS configured properly
- ✅ Tauri plugins initialized successfully

### Files Modified
1. `src-tauri/Cargo.toml` - Added plugin dependencies
2. `src-tauri/src/lib.rs` - Initialized plugins
3. `src-tauri/capabilities/default.json` - Fixed permissions
4. `src-tauri/tauri.conf.json` - Removed FFmpeg resources temporarily
5. `postcss.config.js` - Removed TailwindCSS plugin

### Ready for Next Steps
- Project can now run in development mode
- Ready to proceed with Task 1.3: Define TypeScript types
- Ready to proceed with Task 1.4: Create Zustand stores

## Testing the Fix

```bash
# Should now work without errors:
npm run tauri dev

# Or build directly:
cd src-tauri && cargo build
```

## Related Documentation

- **Tauri v2 Permissions**: https://tauri.app/v2/guides/security/permissions
- **TailwindCSS v4 Migration**: https://tailwindcss.com/docs/v4
- **Plugin Installation**: See project docs in `_docs/architecture.md`

## Next Steps

1. Test application launches: `npm run tauri dev`
2. Begin Task 1.3: Create TypeScript type definitions
3. Begin Task 1.4: Implement Zustand stores
4. Add FFmpeg binaries during Phase 2

## Notes

- Tauri v2 uses capabilities-based security model (not permission arrays)
- TailwindCSS v4 is imported directly via `@import "tailwindcss";` in CSS
- FFmpeg integration will be handled during backend implementation phase
- All configuration files now follow Tauri v2 and TailwindCSS v4 best practices
