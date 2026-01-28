from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to home...")
        page.goto("http://localhost:3000")

        # Check if we need to login
        step_inside = page.get_by_role("button", name="Step Inside")
        if step_inside.is_visible(timeout=2000):
            print("Login form detected. Logging in...")
            page.get_by_placeholder("NAME...").fill("Bolt")
            step_inside.click()
        else:
            print("Already logged in (or login form not found).")

        print("Waiting for grid...")
        # Wait for NameGrid to be visible
        grid = page.locator('[data-component="name-grid"]')
        expect(grid).to_be_visible(timeout=10000)

        # Allow some time for masonry layout to settle (debounced)
        page.wait_for_timeout(2000)

        print("Taking screenshot...")
        page.screenshot(path="verification/name_grid.png")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    run()
