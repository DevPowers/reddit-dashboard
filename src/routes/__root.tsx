import { createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Reddit Investor Dashboard",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: () => {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
				<h1 className="text-4xl font-bold text-white mb-4">404 - Not Found</h1>
				<p className="text-text-muted mb-6 text-lg text-center max-w-md">
					The page you are looking for doesn't exist or has been moved.
				</p>
				<Link
					to="/"
					className="px-6 py-2 bg-obsidian-light hover:bg-obsidian-lighter border border-obsidian-border text-white rounded-md transition-colors cursor-pointer"
				>
					Return to Dashboard
				</Link>
			</div>
		);
	},
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] bg-[#0B1416] text-[#D7E3E8] selection:bg-[#FF4500]/20 flex flex-col min-h-screen">
				<header className="sticky top-0 z-50 w-full backdrop-blur-md bg-obsidian/80 border-b border-obsidian-border">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex h-14 items-center justify-between">
							<div className="flex items-center gap-6">
								<span className="font-bold text-white tracking-wider">
									REDDIT<span className="text-orangered">INVESTOR</span>
								</span>
								<nav className="flex gap-4">
									<Link
										to="/"
										className="text-sm font-semibold text-text-muted hover:text-white transition-colors cursor-pointer pb-1"
										activeProps={{ className: "text-white border-b-2 border-white" }}
										activeOptions={{ exact: true }}
										preload="render"
									>
										Dashboard
									</Link>
									<Link
										to="/admin"
										className="text-sm font-semibold text-text-muted hover:text-white transition-colors cursor-pointer pb-1"
										activeProps={{ className: "text-white border-b-2 border-white" }}
										preload="render"
									>
										Admin
									</Link>
								</nav>
							</div>
						</div>
					</div>
				</header>
				<main className="flex-1">
					{children}
				</main>
				<Scripts />
				<SpeedInsights />
				<Analytics />
			</body>
		</html>
	);
}
