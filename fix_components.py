import re
import os

# FloatingNav.tsx ends abruptly
# MagicProfileWidget has floating text from FloatingNav

os.system("git checkout src/shared/components/UIBlocks.tsx src/shared/components/ui/FloatingNav.tsx src/shared/components/ui/MagicProfileWidget.tsx")
os.system("rm -r src/shared/components/ui")
