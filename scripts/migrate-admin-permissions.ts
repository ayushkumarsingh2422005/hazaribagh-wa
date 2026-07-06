#!/usr/bin/env npx tsx
/**
 * Grant full super-admin access to all existing dashboard users.
 * Run from hazaribagh-wa: npm run migrate:admins
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
    const envPath = resolve(process.cwd(), '.env.local');
    if (!existsSync(envPath)) {
        console.error('Missing .env.local with MONGO_URI');
        process.exit(1);
    }
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        process.env[key] = val;
    }
}

loadEnvLocal();

async function main() {
    const { default: connectDB } = await import('../lib/db');
    const { default: User } = await import('../models/User');
    const { fullPermissions } = await import('../lib/admin-permissions');

    await connectDB();

    const users = await User.find({});
    if (!users.length) {
        console.log('No admin users found.');
        process.exit(0);
    }

    let updated = 0;
    for (const user of users) {
        user.isSuperAdmin = true;
        user.canManageAdmins = true;
        user.canAccessChats = true;
        user.permissions = fullPermissions();
        user.policeStationNames = [];
        user.allowedComplaintTypes = [];
        user.isActive = user.isActive !== false;
        user.markModified('permissions');
        await user.save();
        updated++;
        console.log(`✓ ${user.username} → super admin (full access)`);
    }

    console.log(`\nDone. ${updated} user(s) updated.`);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
