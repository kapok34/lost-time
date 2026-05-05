import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `text-sm tracking-wide uppercase transition-colors ${
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`;

export const SiteHeader = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const approved = profile?.status === "approved";

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container max-w-6xl flex items-center justify-between py-5">
        <Link to="/" className="font-display text-2xl tracking-tight font-sans">lost time</Link>
        <nav className="hidden md:flex items-center gap-8">
          {approved && (
            <>
              <NavLink to="/messages" className={linkCls}>Messages</NavLink>
              <NavLink to="/settings" className={linkCls}>Profile</NavLink>
            </>
          )}
          {isAdmin && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
        </nav>
        <div className="flex items-center gap-3 font-sans">
          <Button variant="ghost" size="sm" onClick={() => navigate("/members")}>Members</Button>
          {!user && (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign in</Button>
              <Button size="sm" onClick={() => navigate("/apply")}>Apply</Button>
            </>
          )}
          {user && (
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              Sign out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};