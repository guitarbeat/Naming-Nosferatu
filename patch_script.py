import sys

def main():
    filepath = sys.argv[1]
    with open(filepath, 'r') as f:
        content = f.read()

    search = """function ToastContainer({
	toasts,
	onDismiss,
	position,
}: {
	toasts: ToastItem[];
	onDismiss: (id: string) => void;
	position: ToastPosition;
}) {
	if (toasts.length === 0) {
		return null;
	}

	return (
		<section
			className={`fixed z-[9999] flex flex-col gap-2 ${POSITION_CLASSES[position]}`}
			aria-live="polite"
			aria-label="Notifications"
		>
			{toasts.map((toast) => {
				const style = TYPE_STYLES[toast.type];
				return (
					<div
						key={toast.id}
						className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${style.bg}`}
						role="alert"
					>
						<span className="text-base leading-none" aria-hidden={true}>
							{style.icon}
						</span>
						<span className="flex-1">{toast.message}</span>
						<button
							onClick={() => onDismiss(toast.id)}
							className="ml-2 -mr-2 rounded-md p-1.5 opacity-70 transition-all hover:opacity-100 hover:bg-black/10 active:scale-95"
							aria-label="Dismiss"
							title="Dismiss"
							type="button"
						>
							<X className="size-4" />
						</button>
					</div>
				);
			})}
		</section>
	);
}"""

    replace = """function ToastMessage({
	toast,
	onDismiss,
}: {
	toast: ToastItem;
	onDismiss: (id: string) => void;
}) {
	const style = TYPE_STYLES[toast.type];
	return (
		<div
			className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${style.bg}`}
			role="alert"
		>
			<span className="text-base leading-none" aria-hidden={true}>
				{style.icon}
			</span>
			<span className="flex-1">{toast.message}</span>
			<button
				onClick={() => onDismiss(toast.id)}
				className="ml-2 -mr-2 rounded-md p-1.5 opacity-70 transition-all hover:opacity-100 hover:bg-black/10 active:scale-95"
				aria-label="Dismiss"
				title="Dismiss"
				type="button"
			>
				<X className="size-4" />
			</button>
		</div>
	);
}

function ToastContainer({
	toasts,
	onDismiss,
	position,
}: {
	toasts: ToastItem[];
	onDismiss: (id: string) => void;
	position: ToastPosition;
}) {
	if (toasts.length === 0) {
		return null;
	}

	return (
		<section
			className={`fixed z-[9999] flex flex-col gap-2 ${POSITION_CLASSES[position]}`}
			aria-live="polite"
			aria-label="Notifications"
		>
			{toasts.map((toast) => (
				<ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
			))}
		</section>
	);
}"""

    if search in content:
        new_content = content.replace(search, replace)
        with open(filepath, 'w') as f:
            f.write(new_content)
        print("Success")
    else:
        print("Search string not found")

if __name__ == "__main__":
    main()
