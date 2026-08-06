import os
import json
import urllib.request

def main():
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("No GITHUB_TOKEN available")
        return

    repo = "guitarbeat/Naming-Nosferatu"

    # We don't know the PR number. We can get the PRs for this branch.
    branch = "jules-5232525002710414803-1d85ae40"
    url = f"https://api.github.com/repos/{repo}/pulls?head=guitarbeat:{branch}"

    req = urllib.request.Request(url)
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Accept', 'application/vnd.github.v3+json')

    try:
        with urllib.request.urlopen(req) as response:
            prs = json.loads(response.read().decode())
            if not prs:
                print("No PRs found")
                return

            pr_number = prs[0]['number']

            # Get comments
            comments_url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
            creq = urllib.request.Request(comments_url)
            creq.add_header('Authorization', f'Bearer {token}')
            creq.add_header('Accept', 'application/vnd.github.v3+json')

            with urllib.request.urlopen(creq) as cresponse:
                comments = json.loads(cresponse.read().decode())
                for comment in comments:
                    print(f"Comment from {comment['user']['login']}:")
                    print(comment['body'])
                    print("-" * 40)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
