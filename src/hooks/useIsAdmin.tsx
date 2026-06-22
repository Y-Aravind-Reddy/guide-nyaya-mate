import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkKbAccess } from "@/lib/kb.functions";
import { useAuth } from "@/hooks/useAuth";

export function useIsAdmin() {
  const { user } = useAuth();
  const check = useServerFn(checkKbAccess);
  const { data, isLoading } = useQuery({
    queryKey: ["kb_access", user?.id],
    queryFn: () => check(),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
  return { isAdmin: Boolean(data?.isAdmin), isLoading: isLoading && Boolean(user) };
}
