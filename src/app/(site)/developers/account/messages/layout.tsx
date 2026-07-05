export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-10 min-h-screen">
            {children}
        </div>
    );
}