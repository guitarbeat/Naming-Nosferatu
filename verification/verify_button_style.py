import asyncio
from playwright.async_api import async_playwright, TimeoutError

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Route interception to block Supabase requests
        await page.route("**/supabase.co/**", lambda route: route.abort())

        try:
            await page.goto("http://localhost:8080/", timeout=60000)
            print("Successfully navigated to the page.")

            # Wait for the login page to load and find the input field
            login_input_selector = 'input[placeholder="Enter your judge name"]'
            await page.wait_for_selector(login_input_selector, timeout=30000)
            print("Login page loaded.")

            # Fill in the judge name and click continue
            await page.fill(login_input_selector, "TestUser")
            await page.click('button:has-text("Continue")')
            print("Logged in.")

            # Take a screenshot immediately after login for debugging
            await page.screenshot(path="verification/post_login_debug.png")
            print("Screenshot taken immediately after login.")

        except TimeoutError as e:
            print(f"A timeout error occurred: {e}")
            await page.screenshot(path="verification/timeout_error.png")
        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
