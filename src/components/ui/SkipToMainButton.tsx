export function SkipToMainButton() {
	const handleSkipToMain = () => {
		const main = document.getElementById("main-content");
		if (!main) {
			return;
		}
		main.focus();
		main.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<button
			type="button"
			className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring focus:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
			onClick={handleSkipToMain}
		>
			Skip to main content
		</button>
	);
}
