import sys

def read_lines(filepath, start_line, end_line):
    try:
        with open(filepath, 'r') as f:
            lines = f.readlines()
            start = max(0, start_line - 1)
            end = min(len(lines), end_line)
            for i, line in enumerate(lines[start:end], start=start+1):
                print(f"{i}: {line}", end="")
    except FileNotFoundError:
        print(f"File not found: {filepath}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python read_lines.py <filepath> <start_line> <end_line>")
        sys.exit(1)
    filepath = sys.argv[1]
    start_line = int(sys.argv[2])
    end_line = int(sys.argv[3])
    read_lines(filepath, start_line, end_line)
