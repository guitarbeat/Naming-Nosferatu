import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateTournamentData } from '../../../shared/services/tournament/TournamentService';

const createTournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required').max(50, 'Name too long'),
  names: z.array(z.string()).min(4, 'At least 4 names required').max(16, 'Maximum 16 names'),
});

interface CreateTournamentFormProps {
  onSubmit: (data: CreateTournamentData) => void;
  isLoading: boolean;
}

export const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [nameInput, setNameInput] = useState('');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTournamentData>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: '',
      names: [],
    },
  });

  const names = watch('names');

  const addName = () => {
    if (nameInput.trim() && !names.includes(nameInput.trim())) {
      setValue('names', [...names, nameInput.trim()]);
      setNameInput('');
    }
  };

  const removeName = (index: number) => {
    setValue('names', names.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="create-tournament-form">
      <div className="form-group">
        <label htmlFor="name">Tournament Name</label>
        <input
          id="name"
          {...register('name')}
          placeholder="Enter tournament name"
          disabled={isLoading}
        />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div className="form-group">
        <label>Cat Names</label>
        <div className="name-input-group">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter cat name"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addName())}
            disabled={isLoading}
          />
          <button type="button" onClick={addName} disabled={isLoading}>
            Add
          </button>
        </div>
        
        <div className="names-list">
          {names.map((name, index) => (
            <div key={index} className="name-tag">
              <span>{name}</span>
              <button
                type="button"
                onClick={() => removeName(index)}
                disabled={isLoading}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        {errors.names && <span className="error">{errors.names.message}</span>}
      </div>

      <button type="submit" disabled={isLoading || names.length < 4}>
        {isLoading ? 'Creating...' : 'Create Tournament'}
      </button>
    </form>
  );
};
