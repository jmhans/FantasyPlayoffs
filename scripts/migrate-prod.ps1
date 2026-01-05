# PowerShell wrapper for production migration with confirmation
# Usage: .\scripts\migrate-prod.ps1

Write-Host ""
Write-Host "⚠️  WARNING: PRODUCTION DATABASE MIGRATION" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will apply migrations to your PRODUCTION database!" -ForegroundColor Red
Write-Host ""
Write-Host "Make sure you have:" -ForegroundColor Cyan
Write-Host "  ✓ Tested migrations in development" -ForegroundColor Green
Write-Host "  ✓ Reviewed all SQL migration files" -ForegroundColor Green
Write-Host "  ✓ Set POSTGRES_URL_PROD in .env.local" -ForegroundColor Green
Write-Host "  ✓ Backed up important data (if needed)" -ForegroundColor Green
Write-Host ""

# Check if .env.local has POSTGRES_URL_PROD
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -notmatch "POSTGRES_URL_PROD") {
        Write-Host "❌ Error: POSTGRES_URL_PROD not found in .env.local" -ForegroundColor Red
        Write-Host ""
        Write-Host "Add this line to your .env.local file:"
        Write-Host 'POSTGRES_URL_PROD="postgresql://..."'
        Write-Host ""
        exit 1
    }
} else {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    exit 1
}

# Prompt for confirmation
$confirmation = Read-Host "Type 'MIGRATE PROD' to continue or anything else to cancel"

if ($confirmation -ne "MIGRATE PROD") {
    Write-Host ""
    Write-Host "❌ Migration cancelled" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting production migration..." -ForegroundColor Green
Write-Host ""

# Run the TypeScript migration script
npx tsx scripts/migrate-prod.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    exit $LASTEXITCODE
}
