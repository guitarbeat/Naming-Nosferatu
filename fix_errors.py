import subprocess
import os

# Let's fix the imports first.
os.system("export PATH=/home/ubuntu/.nvm/versions/node/v20.19.6/bin:$PATH && pnpm run lint:full --apply")
