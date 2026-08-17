import { Loading } from "@/shared/components/layout/Feedback/Loading";

export function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}
