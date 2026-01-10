import { Heart, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Card from "../../../shared/components/Card/Card";
import { Loading } from "../../../shared/components/Loading";
import { catNamesAPI } from "../../../../shared/services/supabase/client";
import styles from "./NameDiscovery.module.css";

interface NameDiscoveryProps {
	userName: string;
}

function NameDiscovery({ userName: _userName }: NameDiscoveryProps) {
	const {
		data: popularNames,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["popular-names"],
		queryFn: async () => {
			// For now, we'll fetch all names and simulate popularity
			const names = await catNamesAPI.getNames();
			return names
				.map((name: any) => ({
					id: name.id,
					name: name.name,
					voteCount: Math.floor(Math.random() * 100) + 1, // Mock popularity
					trending: Math.random() > 0.7, // Mock trending status
				}))
				.sort((a: any, b: any) => b.voteCount - a.voteCount)
				.slice(0, 20);
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	if (isLoading) {
		return <Loading variant="spinner" text="Discovering popular names..." />;
	}

	if (error) {
		return (
			<Card background="glass" padding="large">
				<div className={styles.error}>
					<p>Unable to load popular names right now. Please try again later.</p>
				</div>
			</Card>
		);
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h2>Popular Cat Names</h2>
				<p>Discover names loved by the community</p>
			</div>

			<div className={styles.grid}>
				{popularNames?.map((name: any, index: number) => (
					<Card
						key={name.id}
						className={`${styles.nameCard} ${name.trending ? styles.trending : ""}`}
						background="glass"
						padding="medium"
						shadow="small"
					>
						<div className={styles.nameContent}>
							<div className={styles.nameHeader}>
								<span className={styles.rank}>#{index + 1}</span>
								{name.trending && (
									<div className={styles.trendingBadge}>
										<TrendingUp size={12} />
										<span>Trending</span>
									</div>
								)}
							</div>
							<h3 className={styles.name}>{name.name}</h3>
							<div className={styles.stats}>
								<div className={styles.stat}>
									<Heart size={14} />
									<span>{name.voteCount}</span>
								</div>
								<div className={styles.stat}>
									<Users size={14} />
									<span>loved</span>
								</div>
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}

export default NameDiscovery;
