import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Dooley",
    description: "Automated surveillance and action execution system. Classification: TOP SECRET.",
    keywords: ["AI", "automation", "agent", "surveillance", "classified"],
    icons: {
        icon: "/dooley-favicon.png",
        shortcut: "/dooley-favicon.png",
        apple: "/dooley-favicon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                {/* Google Fonts - Courier Prime, Roboto Slab, JetBrains Mono */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=JetBrains+Mono:wght@400;500;600;700&family=Roboto+Slab:wght@400;500;600;700;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased bg-manilla text-jet">
                {children}
            </body>
        </html>
    );
}
