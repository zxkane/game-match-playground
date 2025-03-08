'use client';

import { useState } from 'react';
import {
  Typography,
  Chip,
  ButtonGroup,
  Button,
  Tooltip,
  Alert,
} from '@mui/material';
import DraftsIcon from '@mui/icons-material/Drafts';
import PendingIcon from '@mui/icons-material/Pending';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import DoneIcon from '@mui/icons-material/Done';
import { Schema } from '../../../../../amplify/data/resource';

type GameStatus = 'active' | 'completed' | 'deleted';

interface GameHeaderProps {
  game: Schema['Game']['type'];
  onPublishGame: () => Promise<void>;
  onCompleteGame: () => Promise<void>;
  onDeleteGame: () => Promise<void>;
  alertMessage: { type: 'success' | 'error', message: string } | null;
  setAlertMessage: (message: { type: 'success' | 'error', message: string } | null) => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  onPublishGame,
  onCompleteGame,
  onDeleteGame,
  alertMessage,
  setAlertMessage,
}) => {
  return (
    <div className="px-4 pt-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-col space-y-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col space-y-4">
              <Typography variant="h4" component="h1" className="mr-4 break-words text-wrap" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                {game.name}
              </Typography>
              <Typography variant="body1" className="text-gray-600">
                {game.description}
              </Typography>
              <Chip
                icon={
                  game.status === 'draft' ? <DraftsIcon /> 
                  : game.status === 'active' ? <PendingIcon />
                  : game.status === 'completed' ? <DoneAllIcon />
                  : game.status === 'deleted' ? <DeleteIcon />
                  : <DraftsIcon />  // fallback icon
                }
                label={game.status?.toUpperCase()}
                color={
                  game.status === 'draft' ? 'default'
                  : game.status === 'active' ? 'primary'
                  : game.status === 'completed' ? 'success'
                  : game.status === 'deleted' ? 'error'
                  : 'default'
                }
                size="small"
                variant="outlined"
              />
            </div>
            <div className="hidden sm:flex sm:justify-end sm:mt-6">
              <ButtonGroup 
                variant="contained" 
                size="small"
                sx={{ 
                  marginTop: '1rem',
                  marginBottom: '1rem',
                  '& .MuiButton-root': {
                    width: '150px',
                    margin: '0 4px'  // Add horizontal spacing between buttons
                  }
                }}
              >
                {game.status === 'draft' && (
                  <Tooltip title={
                    (!game.teams || Object.keys(game.teams).length < 2) 
                      ? "At least two teams are required to publish" 
                      : "Publish Game"
                  }>
                    <span>
                      <Button
                        onClick={onPublishGame}
                        startIcon={<PublishIcon />}
                        color="primary"
                        disabled={!game.teams || Object.keys(game.teams).length < 2}
                      >
                        Publish
                      </Button>
                    </span>
                  </Tooltip>
                )}
                {game.status === 'active' && (
                  <Tooltip title="Complete Game">
                    <Button
                      onClick={onCompleteGame}
                      startIcon={<DoneIcon />}
                      color="success"
                    >
                      Complete
                    </Button>
                  </Tooltip>
                )}
                {game.status != 'deleted' && (
                  <Tooltip title="Delete Game">
                    <Button
                      onClick={onDeleteGame}
                      startIcon={<DeleteIcon />}
                      color="error"
                    >
                      Delete
                    </Button>
                  </Tooltip>
                )}
              </ButtonGroup>
            </div>
          </div>
        </div>
      </div>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} className="mt-4">
          {alertMessage.message}
        </Alert>
      )}
    </div>
  );
};

export default GameHeader;
