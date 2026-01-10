import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";

export const metadata: Metadata = {
    title: "Dooley",
    description: "Automated surveillance and action execution system. Classification: TOP SECRET.",
    keywords: ["AI", "automation", "agent", "surveillance", "classified"],
    icons: {
        icon: "/dooley.png",
        shortcut: "/dooley.png",
        apple: "/dooley.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={GeistSans.variable}>
            <head>
                {/* Google Fonts - Inter (Display/Fallback) */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased font-sans">
                {children}
            </body>
        </html>
    );
}
