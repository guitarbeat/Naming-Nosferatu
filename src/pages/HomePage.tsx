import type React from "react";
import { CreateTournamentForm } from "../features/tournament/components/CreateTournamentForm";
import { TournamentList } from "../features/tournament/components/TournamentList";
import { Loading } from "../shared/components/Loading";
import { useCreateTournament, useTournaments } from "../shared/hooks/useTournament";
import { useAuth } from "../shared/providers/AuthProvider";

const HomePage: React.FC = () => {
	const { user } = useAuth();
	const { data: tournaments, isLoading, error } = useTournaments();
	const createTournament = useCreateTournament();

	if (isLoading) {
		return <Loading variant="spinner" text="Loading tournaments..." />;
	}

	if (error) {
		return (
			<div className="error-state">
				<h2>Unable to load tournaments</h2>
				<p>Please try refreshing the page. If the problem continues, check your connection.</p>
			</div>
		);
	}

	return (
		<div className="home-page">
			<header className="page-header">
				<h1>Welcome back, {user?.name}!</h1>
				<p>Manage your cat name tournaments</p>
			</header>

			<main className="page-content">
				<section className="create-tournament-section">
					<h2>Create New Tournament</h2>
					<CreateTournamentForm
						onSubmit={createTournament.mutate}
						isLoading={createTournament.isPending}
					/>
				</section>

				<section className="tournaments-section">
					<h2>Your Tournaments</h2>
					<TournamentList tournaments={tournaments || []} />
				</section>
			</main>
		</div>
	);
};

export default HomePage;
