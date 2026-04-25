import { Link } from "@tanstack/react-router";
import { RefreshCw, Zap } from "lucide-react";

import { Button } from "@mirror-scan/ui/components/button";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [
		{ to: "/", label: "Home" },
		{ to: "/dashboard", label: "Dashboard" },
	] as const;

	return (
		<header className="border-b border-tng-cyan/8">
			<div className="flex items-center justify-between px-4 py-2">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-2.5">
						<div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-tng-blue to-tng-cyan">
							<Zap className="size-4 text-white" />
						</div>
						<div className="leading-tight">
							<p className="text-sm font-semibold tracking-tight">
								Mirror Scan
							</p>
							<p className="text-[10px] text-muted-foreground">
								Touch 'n Go
							</p>
						</div>
					</div>
					<nav className="flex gap-4 text-sm">
						{links.map(({ to, label }) => (
							<Link
								key={to}
								to={to}
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								{label}
							</Link>
						))}
					</nav>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5 rounded-full border border-tng-success/20 bg-tng-success/8 px-2.5 py-1 text-xs font-medium text-tng-success">
						<span className="size-1.5 animate-pulse rounded-full bg-tng-success" />
						Live
					</div>
					<Button variant="ghost" size="icon-sm">
						<RefreshCw className="size-3.5 text-muted-foreground" />
					</Button>
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
