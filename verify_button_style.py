import re
from playwright.sync_api import Page, expect

def test_verify_button_style(page: Page):
    # Navigate to the login page
    page.goto("http://localhost:8080/")

    # Enter judge's name and continue
    page.get_by_placeholder("Enter your judge name").click()
    page.get_by_placeholder("Enter your judge name").fill("Jules")
    page.get_by_role("button", name="Continue").click()

    # Take a screenshot after login to debug
    page.screenshot(path="verification/after_login_debug.png")

    # Wait for the main content to load and select two names
    page.wait_for_selector('.name-card-container', timeout=10000)
    name_cards = page.query_selector_all('.name-card')
    if len(name_cards) >= 2:
        name_cards[0].click()
        name_cards[1].click()
    else:
        raise Exception("Not enough name cards to select.")

    # Verify the button is enabled and take a screenshot
    start_button = page.get_by_role("button", name="Start Tournament! 🏆")
    expect(start_button).to_be_enabled()
    start_button.screenshot(path="verification/final_button_style.png")
