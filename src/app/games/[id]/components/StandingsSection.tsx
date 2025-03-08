'use client';

import { Typography, Paper, Avatar, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { Schema } from '../../../../../amplify/data/resource';

type Standing = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

interface StandingsSectionProps {
  game: Schema['Game']['type'];
  standings: Standing[];
  getTeamById: (teams: Schema['TeamPlayer']['type'][], teamId: string) => Schema['TeamPlayer']['type'] | undefined;
}

const StandingsSection: React.FC<StandingsSectionProps> = ({ game, standings, getTeamById }) => {
  return (
    <Paper className="p-4">
      <div className="space-y-4">
        <Typography variant="h4" className="text-gray-800 mb-4">
          Standings
        </Typography>
        {game.teams && game.teams.length > 0 ? (
          <TableContainer className="overflow-x-auto">
            <Table className="w-full">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: '12px 8px' }}>Team</TableCell>
                  <TableCell align="center" sx={{ padding: '12px 8px' }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Played
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      P
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ padding: '12px 8px' }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Won
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      W
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ padding: '12px 8px' }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Drawn
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      D
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ padding: '12px 8px' }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Lost
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      L
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ padding: '12px 8px' }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Goals For
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      GF
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ padding: '12px 8px' }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Goals Against
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      GA
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ padding: '12px 8px' }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Goal Diff
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      GD
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ padding: '12px 8px' }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Points
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      Pts
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {standings
                  .sort((a, b) => 
                    b.points - a.points || // Sort by points
                    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || // Then by goal difference
                    b.goalsFor - a.goalsFor // Then by goals scored
                  )
                  .map((standing) => {
                    const team = getTeamById(
                      game.teams?.filter((team): team is Schema['TeamPlayer']['type'] => 
                        team !== null && team !== undefined
                      ) || [], 
                      standing.teamId
                    );
                    if (!team) return null;

                    return (
                      <TableRow key={standing.teamId}>
                        <TableCell sx={{ padding: '12px 8px' }}>
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={team.team.logo || ''}
                              alt={team.team.name}
                              sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }}
                              variant="rounded"
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: { xs: '80px', sm: 'none' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {team.team.name}
                            </Typography>
                          </div>
                        </TableCell>
                        <TableCell align="center" sx={{ padding: '12px 8px' }}>{standing.played}</TableCell>
                        <TableCell align="center" sx={{ padding: '12px 8px' }}>{standing.won}</TableCell>
                        <TableCell align="center" sx={{ padding: '12px 8px' }}>{standing.drawn}</TableCell>
                        <TableCell align="center" sx={{ padding: '12px 8px' }}>{standing.lost}</TableCell>
                        <TableCell align="center" sx={{ padding: '12px 8px' }}>{standing.goalsFor}</TableCell>
                        <TableCell align="center" sx={{ padding: '12px 8px' }}>{standing.goalsAgainst}</TableCell>
                        <TableCell align="center" sx={{ padding: '12px 8px' }}>{standing.goalsFor - standing.goalsAgainst}</TableCell>
                        <TableCell align="center" sx={{ padding: '12px 8px' }}>{standing.points}</TableCell>
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
              No teams available.
            </Typography>
          </Paper>
        )}
      </div>
    </Paper>
  );
};

export default StandingsSection;
