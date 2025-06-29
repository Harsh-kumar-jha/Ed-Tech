# Prisma Scripts

This directory contains utility scripts for managing the modular Prisma schema structure.

## Scripts

### `build-schema.js`
Combines all individual model files from `models/` and `enums/` directories into the main `schema.prisma` file.

**Usage:**
```bash
node prisma/scripts/build-schema.js
```

**What it does:**
1. Reads all `.prisma` files from `enums/` directory
2. Reads all `.prisma` files from `models/` directory  
3. Combines them with proper headers and formatting
4. Writes the result to `schema.prisma`

## Workflow

When working with modular schemas:

1. **Edit model files** in `models/` or `enums/` directories
2. **Run build script** to update main schema:
   ```bash
   node prisma/scripts/build-schema.js
   ```
3. **Generate Prisma client**:
   ```bash
   pnpm db:generate
   ```
4. **Create migration** if needed:
   ```bash
   pnpm db:migrate
   ```

## Package.json Scripts

You can add these to your `package.json` for easier access:

```json
{
  "scripts": {
    "db:build-schema": "node prisma/scripts/build-schema.js",
    "db:update": "npm run db:build-schema && pnpm db:generate"
  }
}
``` 