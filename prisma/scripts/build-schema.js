#!/usr/bin/env node

/**
 * Build Script for Modular Prisma Schema
 * This script combines all individual model files into the main schema.prisma
 */

const fs = require('fs');
const path = require('path');

const PRISMA_DIR = path.join(__dirname, '..');
const MODELS_DIR = path.join(PRISMA_DIR, 'models');
const ENUMS_DIR = path.join(PRISMA_DIR, 'enums');
const SCHEMA_FILE = path.join(PRISMA_DIR, 'schema.prisma');

// Schema header
const SCHEMA_HEADER = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema
// 
// 🔧 This file is auto-generated from modular files in models/ and enums/
// 📝 Edit individual files in those directories, then run: node scripts/build-schema.js

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

function buildSchema() {
  console.log('🔧 Building Prisma schema from modular files...');
  
  let schemaContent = SCHEMA_HEADER;
  
  try {
    // Add enums first
    console.log('📦 Adding enums...');
    if (fs.existsSync(ENUMS_DIR)) {
      const enumFiles = fs.readdirSync(ENUMS_DIR).filter(file => file.endsWith('.prisma'));
      
      if (enumFiles.length > 0) {
        schemaContent += '// ===========================\n';
        schemaContent += '// ENUMS\n';
        schemaContent += '// ===========================\n\n';
        
        enumFiles.forEach(file => {
          const filePath = path.join(ENUMS_DIR, file);
          const content = fs.readFileSync(filePath, 'utf8');
          // Remove comments from the beginning and add clean content
          const cleanContent = content.replace(/^\/\/.*$/gm, '').trim();
          if (cleanContent) {
            schemaContent += cleanContent + '\n\n';
          }
        });
      }
    }
    
    // Add models
    console.log('📝 Adding models...');
    if (fs.existsSync(MODELS_DIR)) {
      const modelFiles = fs.readdirSync(MODELS_DIR).filter(file => file.endsWith('.prisma'));
      
      modelFiles.forEach(file => {
        const filePath = path.join(MODELS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract the category from the first comment line
        const lines = content.split('\n');
        const categoryLine = lines.find(line => line.trim().startsWith('//') && !line.includes('Relations'));
        
        if (categoryLine) {
          schemaContent += '// ===========================\n';
          schemaContent += `${categoryLine.trim()}\n`;
          schemaContent += '// ===========================\n\n';
        }
        
        // Remove comments and add the models
        const cleanContent = content.replace(/^\/\/.*$/gm, '').trim();
        if (cleanContent) {
          schemaContent += cleanContent + '\n\n';
        }
      });
    }
    
    // Write the combined schema
    fs.writeFileSync(SCHEMA_FILE, schemaContent);
    console.log('✅ Schema built successfully!');
    console.log(`📄 Generated: ${SCHEMA_FILE}`);
    
  } catch (error) {
    console.error('❌ Error building schema:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildSchema();
}

module.exports = { buildSchema }; 