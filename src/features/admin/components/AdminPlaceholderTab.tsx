interface AdminPlaceholderTabProps {
	title: string;
	message: string;
}

export function AdminPlaceholderTab({ title, message }: AdminPlaceholderTabProps) {
	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-4">{title}</h2>
			<p className="text-muted-foreground">{message}</p>
		</div>
	);
}
