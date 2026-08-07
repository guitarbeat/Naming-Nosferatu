import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python read_file.py <filepath>")
        return
    try:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            content = f.read()
            print("--- START FILE CONTENT ---")
            print(content)
            print("--- END FILE CONTENT ---")
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    main()
