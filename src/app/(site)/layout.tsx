import { Footer } from "@/components/footbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Footer />
        </>
    );
}