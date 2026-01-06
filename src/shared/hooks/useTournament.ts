import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TournamentService, type Tournament, type CreateTournamentData } from '../services/tournament/TournamentService';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';

const tournamentService = new TournamentService();

export const useTournaments = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['tournaments', user?.id],
    queryFn: () => tournamentService.getTournaments(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTournament = (id: string) => {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const tournaments = await tournamentService.getTournaments(''); // TODO: Fix this
      return tournaments.find(t => t.id === id) || null;
    },
    enabled: !!id,
  });
};

export const useCreateTournament = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTournamentData) => 
      tournamentService.createTournament(data, user!.id),
    onSuccess: (tournament) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      showToast({
        message: `Tournament "${tournament.name}" created successfully!`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        message: error.message || 'Failed to create tournament',
        variant: 'error',
      });
    },
  });
};

export const useUpdateTournament = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tournament> }) =>
      tournamentService.updateTournament(id, updates),
    onSuccess: (tournament) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] });
      showToast({
        message: 'Tournament updated successfully!',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        message: error.message || 'Failed to update tournament',
        variant: 'error',
      });
    },
  });
};

export const useDeleteTournament = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tournamentService.deleteTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      showToast({
        message: 'Tournament deleted successfully!',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        message: error.message || 'Failed to delete tournament',
        variant: 'error',
      });
    },
  });
};
