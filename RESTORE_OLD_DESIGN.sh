#!/bin/bash

# FLEX App - Restore Old Design
# Run this script to undo the cyber redesign and restore the original Binance gold theme

echo "🔄 Restoring original FLEX design..."

# Restore theme colors
if [ -f "src/theme/colors.old.ts" ]; then
    mv src/theme/colors.ts src/theme/colors.cyber.ts
    mv src/theme/colors.old.ts src/theme/colors.ts
    echo "✅ Restored original theme colors"
else
    echo "❌ Original colors file not found"
fi

# Restore LandingScreen
if [ -f "src/screens/LandingScreen.old.tsx" ]; then
    mv src/screens/LandingScreen.tsx src/screens/LandingScreen.cyber.tsx
    mv src/screens/LandingScreen.old.tsx src/screens/LandingScreen.tsx
    echo "✅ Restored original LandingScreen"
else
    echo "❌ Original LandingScreen not found"
fi

# Restore HomeScreen
if [ -f "src/screens/HomeScreen.old.tsx" ]; then
    mv src/screens/HomeScreen.tsx src/screens/HomeScreen.cyber.tsx
    mv src/screens/HomeScreen.old.tsx src/screens/HomeScreen.tsx
    echo "✅ Restored original HomeScreen"
else
    echo "❌ Original HomeScreen not found"
fi

# Remove new components (optional - keep them for reference)
# if [ -f "src/components/AnimatedBackground.tsx" ]; then
#     mv src/components/AnimatedBackground.tsx src/components/AnimatedBackground.backup.tsx
#     echo "✅ Backed up AnimatedBackground component"
# fi

echo ""
echo "✨ Restoration complete!"
echo ""
echo "Original design files restored:"
echo "  - src/theme/colors.ts (Binance gold theme)"
echo "  - src/screens/LandingScreen.tsx"
echo "  - src/screens/HomeScreen.tsx"
echo ""
echo "Cyber design files saved as:"
echo "  - src/theme/colors.cyber.ts"
echo "  - src/screens/LandingScreen.cyber.tsx"
echo "  - src/screens/HomeScreen.cyber.tsx"
echo ""
echo "Run 'npm start' to see the original design"
