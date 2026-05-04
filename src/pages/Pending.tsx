import { Navigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";

const Pending = () => {
  const { profile, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!profile) return <Navigate to="/" replace />;
  if (profile.status === "approved" || isAdmin) return <Navigate to="/members" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-xl py-24 text-center">
        {profile.status === "pending" && (
          <>
            <h1 className="font-display text-4xl mb-6">Your application is under review</h1>
            <p className="text-muted-foreground italic text-lg leading-relaxed">
              Thank you, {profile.display_name}. Each application is read by hand,
              so it may take a few days. You will receive an email when a decision
              has been made.
            </p>
          </>
        )}
        {profile.status === "rejected" && (
          <>
            <h1 className="font-display text-4xl mb-6">Application not accepted</h1>
            <p className="text-muted-foreground italic text-lg">
              The Salon could not extend membership at this time.
            </p>
            {profile && (profile as any).rejection_reason && (
              <p className="mt-6 italic">"{(profile as any).rejection_reason}"</p>
            )}
          </>
        )}
        {profile.status === "suspended" && (
          <>
            <h1 className="font-display text-4xl mb-6">Membership suspended</h1>
            <p className="text-muted-foreground italic text-lg">
              Please contact the salonnier.
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default Pending;