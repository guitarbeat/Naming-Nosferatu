/**
 * Stub: replace with your real ProfileSection component.
 * This renders the user profile / login area on the home page.
 */

interface ProfileSectionProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
}

export function ProfileSection({ onLogin }: ProfileSectionProps) {
	return (
		<section id="profile" className="w-full px-4 py-8">
			<p className="text-center text-slate-500">Profile section (onLogin: {typeof onLogin})</p>
		</section>
	);
}
