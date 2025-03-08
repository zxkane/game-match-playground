'use client';

import { Typography, Button, Paper, Avatar, IconButton, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Schema } from '../../../../../amplify/data/resource';

interface TeamsSectionProps {
  game: Schema['Game']['type'];
  onAddTeamClick: () => void;
  onRemoveTeam: (teamId: string) => Promise<void>;
  isLoadingLeagues: boolean;
}

const TeamsSection: React.FC<TeamsSectionProps> = ({
  game,
  onAddTeamClick,
  onRemoveTeam,
  isLoadingLeagues,
}) => {
  return (
    <Paper className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Typography variant="h4" className="text-gray-800">
            Teams
          </Typography>
          {game.status === 'draft' && (
            <Button
              variant="contained"
              color="primary"
              onClick={onAddTeamClick}
              startIcon={isLoadingLeagues ? <CircularProgress size={20} /> : <AddIcon />}
              disabled={isLoadingLeagues}
            >
              {isLoadingLeagues ? 'Loading...' : 'Add New Team'}
            </Button>
          )}
        </div>
        {game.teams && Object.keys(game.teams).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-4">
            {Object.values(game.teams).map((teamPlayer) => 
              teamPlayer && teamPlayer.team && (
                <Paper 
                  key={teamPlayer.team.id} 
                  className="p-1 sm:p-4 flex flex-col items-center text-center relative"
                  elevation={1}
                >
                  {game.status === 'draft' && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveTeam(teamPlayer.team!.id)}
                      sx={{ 
                        position: 'absolute',
                        right: 4,
                        top: 4,
                        opacity: 0.7,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                  {teamPlayer.team.logo && (
                    <Avatar
                      src={teamPlayer.team.logo}
                      alt={teamPlayer.team.name}
                      sx={{ 
                        width: { xs: 40, sm: 64 }, 
                        height: { xs: 40, sm: 64 },
                        mb: { xs: 0.5, sm: 1 }
                      }}
                      variant="rounded"
                    >
                      {teamPlayer.team.name?.charAt(0)}
                    </Avatar>
                  )}
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 'bold',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    {teamPlayer.team.name}
                  </Typography>
                  {teamPlayer.player && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '0.625rem', sm: '0.75rem' }
                      }}
                    >
                      {teamPlayer.player}
                    </Typography>
                  )}
                </Paper>
              )
            )}
          </div>
        ) : (
          <Paper className="p-4 sm:p-6 text-center w-full">
            <Typography variant="body2" className="text-gray-600">
              No teams available.
            </Typography>
          </Paper>
        )}
      </div>
    </Paper>
  );
};

export default TeamsSection;
