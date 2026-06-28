import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = { title: "החשבון שלי" }

export default function DevelopersLayout({
    children,
}: { children: React.ReactNode }) {
    return <>{children}</>;
}