import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = { title: "תנאי שימוש" }


export default function TermsLayout({
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