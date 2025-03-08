'use client';

import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

interface GameActionsProps {
  onBackToGames: () => void;
}

const GameActions: React.FC<GameActionsProps> = ({ onBackToGames }) => {
  return (
    <div className="flex justify-end space-x-2 mt-4">
      <Button
        variant="outlined"
        onClick={onBackToGames}
      >
        Back to Games
      </Button>
    </div>
  );
};

export default GameActions;
