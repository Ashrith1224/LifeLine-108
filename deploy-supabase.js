import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple .env parser
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes if any
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  console.error('Please obtain the service_role key from Settings -> API in your Supabase Dashboard.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.map': 'application/json'
};

const BUCKET_NAME = 'website';
const DIST_DIR = path.join(__dirname, 'dist');

async function deploy() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: "dist" folder not found. Please run "npm run build" first.');
    process.exit(1);
  }

  console.log('Ensuring "website" bucket exists and is public...');
  // Attempt to create bucket via storage API (will fail if already exists, so we catch)
  try {
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true
    });
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.log('Note/Error creating bucket:', bucketError.message);
    }
  } catch (err) {
    // Already exists or permission issues
  }

  // Update bucket to clear allowedMimeTypes restrictions if it already exists
  try {
    await supabase.storage.updateBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: null
    });
  } catch (err) {
    // ignore
  }

  console.log('Gathering files from dist...');
  const filesToUpload = [];
  function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        filesToUpload.push(fullPath);
      }
    });
  }
  walk(DIST_DIR);

  console.log(`Uploading ${filesToUpload.length} files to Supabase Storage bucket "${BUCKET_NAME}"...`);

  for (const filePath of filesToUpload) {
    const relativePath = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
    const fileContent = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    console.log(`Uploading ${relativePath} (${contentType})...`);

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(relativePath, fileContent, {
      contentType,
      upsert: true
    });

    if (error) {
      console.error(`Failed to upload ${relativePath}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n==========================================');
  console.log('🎉 SUCCESS! Website successfully deployed to Supabase!');
  console.log(`Access your site here:`);
  console.log(`${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/index.html`);
  console.log('==========================================');
}

deploy().catch(err => {
  console.error('Deployment script crashed:', err);
  process.exit(1);
});
