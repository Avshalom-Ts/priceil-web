import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = { title: "מדיניות פרטיות" }

export default function PrivacyLayout({
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
