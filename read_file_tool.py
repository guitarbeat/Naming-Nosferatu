import sys

def read_file_tool(filepath):
    try:
        with open(filepath, 'r') as f:
            lines = f.readlines()
            for i, line in enumerate(lines, start=1):
                if 680 <= i <= 720:
                    print(f"{i}: {line}", end="")
    except FileNotFoundError:
        print(f"File not found: {filepath}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python read_file_tool.py <filepath>")
        sys.exit(1)
    filepath = sys.argv[1]
    read_file_tool(filepath)
