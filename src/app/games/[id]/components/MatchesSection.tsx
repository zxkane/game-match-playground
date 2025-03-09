'use client';

import { Typography, Button, Paper, Avatar, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Stack, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Schema } from '../../../../../amplify/data/resource';

interface MatchesSectionProps {
  game: Schema['Game']['type'];
  onAddMatchClick: () => void;
  onDeleteMatch: (matchIndex: number) => Promise<void>;
  getTeamById: (teams: Schema['TeamPlayer']['type'][], teamId: string) => Schema['TeamPlayer']['type'] | undefined;
}

const MatchesSection: React.FC<MatchesSectionProps> = ({
  game,
  onAddMatchClick,
  onDeleteMatch,
  getTeamById,
}) => {
  return (
    <Paper className="p-4">
      <div>
        <div className="flex justify-between items-center">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              minHeight: 48
            }}
          >
            <Typography
              variant="h4"
              className="text-gray-800 font-bold"
            >
              Matches
            </Typography>
            {game.status === 'active' && (
              <Button
                variant="contained"
                color="success"
                onClick={onAddMatchClick}
                startIcon={<AddIcon />}
                size="medium"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}
              >
                Add Match
              </Button>
            )}
          </Box>
        </div>

        {game.matches && game.matches.length > 0 ? (
          <TableContainer className="overflow-x-auto">
            <Table className="w-full">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Home Team</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="left">Away Team</TableCell>
                  {game.status === 'active' && <TableCell padding="none"></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {game.matches
                  .filter((match): match is Schema['Match']['type'] => match !== null)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((match, index) => {
                    const homeTeam = getTeamById(
                      game.teams?.filter((t): t is Schema['TeamPlayer']['type'] => t !== null && t !== undefined) || [], 
                      match.homeTeamId
                    );
                    const awayTeam = getTeamById(
                      game.teams?.filter((t): t is Schema['TeamPlayer']['type'] => t !== null && t !== undefined) || [], 
                      match.awayTeamId
                    );
                    
                    if (!homeTeam || !awayTeam) return null;

                    return (
                      <TableRow key={`${match.homeTeamId}-${match.awayTeamId}-${match.date}`}>
                        <TableCell>
                          {new Date(match.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            verticalAlign: 'top',
                            padding: '12px 8px'
                          }}
                        >
                          <Stack
                            direction="column"
                            alignItems="flex-end"
                            spacing={2}
                            sx={{ minHeight: 76 }}
                          >
                            <Avatar
                              src={homeTeam.team.logo || ''}
                              alt={homeTeam.team.name}
                              sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }}
                              variant="rounded"
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: { xs: '80px', sm: 'none' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textAlign: 'right',
                                width: '100%'
                              }}
                            >
                              {homeTeam.team.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          {match.homeScore} - {match.awayScore}
                        </TableCell>
                        <TableCell 
                          align="left" 
                          sx={{ 
                            verticalAlign: 'top',
                            padding: '12px 8px'
                          }}
                        >
                          <Stack
                            direction="column"
                            alignItems="flex-start"
                            spacing={2}
                            sx={{ minHeight: 76 }}
                          >
                            <Avatar
                              src={awayTeam.team.logo || ''}
                              alt={awayTeam.team.name}
                              sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }}
                              variant="rounded"
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: { xs: '80px', sm: 'none' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textAlign: 'left',
                                width: '100%'
                              }}
                            >
                              {awayTeam.team.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        {game.status === 'active' && (
                          <TableCell align="right" padding="none">
                            <IconButton
                              size="small"
                              onClick={() => onDeleteMatch(index)}
                              sx={{ 
                                opacity: 0.7,
                                '&:hover': {
                                  opacity: 1
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                  .filter(Boolean)}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper className="p-4 sm:p-6 text-center w-full">
            <Typography variant="body2" className="text-gray-600">
              No matches available.
            </Typography>
          </Paper>
        )}
      </div>
    </Paper>
  );
};

export default MatchesSection;
