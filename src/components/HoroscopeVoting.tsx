import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";
import {
  getUserVoteFn,
  castVoteFn,
  checkAuthAndSignInFn,
} from "../utils/voting";
import * as Sentry from "@sentry/tanstackstart-react";

interface HoroscopeVotingProps {
  signId: number;
  effectiveDate: string;
  categoryId?: number;
}

function HoroscopeVoting({
  signId,
  effectiveDate,
  categoryId,
}: HoroscopeVotingProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const checkAuthFn = useServerFn(checkAuthAndSignInFn);
  const getUserVoteServerFn = useServerFn(getUserVoteFn);
  const castVoteServerFn = useServerFn(castVoteFn);

  // Check authentication status
  const {
    data: authStatus,
    isLoading: isCheckingAuth,
    refetch: refetchAuth,
  } = useQuery({
    queryKey: ["auth-status"],
    queryFn: checkAuthFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get user's current vote
  const {
    data: voteData,
    isLoading: isLoadingVote,
    refetch: refetchVote,
  } = useQuery({
    queryKey: ["user-vote", signId, effectiveDate, categoryId],
    queryFn: () =>
      getUserVoteServerFn({ data: { signId, effectiveDate, categoryId } }),
    enabled: authStatus?.isAuthenticated === true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Cast vote mutation
  const castVoteMutation = useMutation({
    mutationFn: (rating: boolean) =>
      castVoteServerFn({ data: { signId, effectiveDate, categoryId, rating } }),
    onSuccess: () => {
      // Invalidate and refetch vote data
      queryClient.invalidateQueries({
        queryKey: ["user-vote", signId, effectiveDate, categoryId],
      });
      refetchVote();
    },
    onError: (error) => {
      console.error("Failed to cast vote:", error);
      Sentry.captureException(error);
      setAuthError("Erro ao registrar voto. Tente novamente.");
    },
  });

  // Handle anonymous signin when user is not authenticated
  useEffect(() => {
    if (authStatus?.isAuthenticated === false && !isAuthenticating) {
      handleAnonymousSignIn();
    }
  }, [authStatus, isAuthenticating]);

  const handleAnonymousSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      await authClient.signIn.anonymous();
      // Refetch auth status after signing in
      await refetchAuth();
    } catch (error) {
      console.error("Failed to sign in anonymously:", error);
      Sentry.captureException(error);
      setAuthError("Erro ao autenticar. Recarregue a página.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVote = async (rating: boolean) => {
    if (!authStatus?.isAuthenticated) {
      await handleAnonymousSignIn();
      return;
    }

    castVoteMutation.mutate(rating);
  };

  if (isCheckingAuth || isAuthenticating) {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-acento-mistico"></div>
        <span className="text-sm text-padrao/60 text-black-safe">Preparando votação...</span>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="text-red-500 text-sm text-center text-black-safe">{authError}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-acento-mistico hover:underline"
        >
          Recarregar página
        </button>
      </div>
    );
  }

  if (!authStatus?.isAuthenticated) {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
        <button
          onClick={handleAnonymousSignIn}
          className="text-sm text-acento-mistico hover:underline"
        >
          Clique para avaliar este horóscopo
        </button>
      </div>
    );
  }

  const isLoading = isLoadingVote || castVoteMutation.isPending;
  const currentRating = voteData?.rating;
  const hasVoted = voteData?.hasVoted;

  return (
    <div className="flex flex-col items-center gap-3 py-4 border-t border-gray-200 mt-6">
      <div className="text-sm text-padrao/70 text-center text-black-safe">
        Este horóscopo foi útil para você?
      </div>

      <div className="flex items-center gap-4">
        {/* Thumbs Up */}
        <button
          onClick={() => handleVote(true)}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 ${
            currentRating === true
              ? "bg-green-100 border-green-500 text-green-700"
              : "border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}`}
        >
          <svg
            className="w-5 h-5"
            fill={currentRating === true ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={currentRating === true ? 0 : 2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
            />
          </svg>
          <span className="text-sm font-medium">Sim</span>
        </button>

        {/* Thumbs Down */}
        <button
          onClick={() => handleVote(false)}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 ${
            currentRating === false
              ? "bg-red-100 border-red-500 text-red-700"
              : "border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}`}
        >
          <svg
            className="w-5 h-5 transform rotate-180"
            fill={currentRating === false ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={currentRating === false ? 0 : 2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
            />
          </svg>
          <span className="text-sm font-medium">Não</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-padrao/50 text-black-safe">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-acento-mistico"></div>
          Salvando...
        </div>
      )}

      {hasVoted && !isLoading && (
        <div className="text-xs text-padrao/50 text-black-safe">
          Obrigado pelo seu feedback!
        </div>
      )}
    </div>
  );
}

export default HoroscopeVoting;
