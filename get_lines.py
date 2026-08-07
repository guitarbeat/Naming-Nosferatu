import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python get_lines.py <filepath>")
        return
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if 43 <= i + 1 <= 49 or 64 <= i + 1 <= 66:
                print(f"{i+1}: {line.rstrip()}")

if __name__ == "__main__":
    main()
