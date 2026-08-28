import re
import os

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    lines = f.readlines()

def get_block(start_kw, end_kw, lines, start_idx):
    for i in range(start_idx, len(lines)):
        if start_kw in lines[i]:
            start = i
            # find matching end
            bracket_count = 0
            in_block = False
            for j in range(start, len(lines)):
                bracket_count += lines[j].count('{')
                bracket_count -= lines[j].count('}')
                if '{' in lines[j]:
                    in_block = True

                if in_block and bracket_count == 0:
                    # found end
                    return "".join(lines[start:j+1]), j+1
    return None, start_idx

# We can just write specific tools for each!
