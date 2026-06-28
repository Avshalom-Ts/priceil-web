import { Metadata } from "next";

export const metadata: Metadata = { title: "צור קשר" }

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main>
            {children}
        </main>
    )
}