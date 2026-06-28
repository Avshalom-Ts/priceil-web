import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = { title: "רשימת קניות" }

export default function ShoppingListLayout({
    children,
}: { children: React.ReactNode }) {
    return <>{children}</>;
}