import asyncio
from playwright.async_api import async_playwright, TimeoutError

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:8080/", timeout=60000)
            print("Successfully navigated to the page.")

            # Wait for the login page to load and find the input field
            login_input_selector = 'input[placeholder="Enter your judge name"]'
            await page.wait_for_selector(login_input_selector, timeout=30000)
            print("Login page loaded.")

            # Type in the judge name to ensure React state updates
            await page.type(login_input_selector, "TestUser")
            
            # Wait for the button to be enabled before clicking
            continue_button_selector = 'button:has-text("Continue")'
            await page.wait_for_selector(f"{continue_button_selector}:not([disabled])", timeout=5000)
            print("Continue button is enabled.")
            
            await page.click(continue_button_selector, force=True)
            print("Logged in.")
            
            # Wait for the next page to load by waiting for a specific element
            await page.wait_for_selector("h1:has-text('🏆 Cat Name Tournament')", timeout=30000)
            print("Navigated to the main application page.")

            # Take a screenshot immediately after login for debugging
            await page.screenshot(path="verification/post_login_debug.png")
            print("Screenshot taken after navigation.")

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
