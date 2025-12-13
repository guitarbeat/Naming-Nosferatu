import os

def rename_files(root_dir, limit=20):
    count = 0
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.js') or filename.endswith('.jsx'):
                if count >= limit:
                    return

                if filename.endswith('.js'):
                    old_path = os.path.join(dirpath, filename)
                    new_path = os.path.join(dirpath, filename[:-3] + '.ts')
                elif filename.endswith('.jsx'):
                    old_path = os.path.join(dirpath, filename)
                    new_path = os.path.join(dirpath, filename[:-4] + '.tsx')

                print(f"Renaming {old_path} to {new_path}")
                os.rename(old_path, new_path)
                count += 1

if __name__ == "__main__":
    rename_files('src')
