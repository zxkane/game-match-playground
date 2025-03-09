'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  FormControl,
  Select,
} from '@mui/material';
import Image from 'next/image';
import { Schema } from '../../../../../../amplify/data/resource';

interface AddTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onAddTeam: (e: React.FormEvent) => Promise<void>;
  newTeam: { team: string; player: string };
  setNewTeam: (team: { team: string; player: string }) => void;
  leagues: Schema['LeagueCountry']['type'][];
  isLoadingLeagues: boolean;
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
  selectedLeagueDetails: Schema['League']['type'] | null;
  isLoadingLeagueDetails: boolean;
  alertMessage: { type: 'success' | 'error', message: string } | null;
  setAlertMessage: (message: { type: 'success' | 'error', message: string } | null) => void;
  fetchLeagueDetails?: (leagueId: string) => void;
}

const AddTeamDialog: React.FC<AddTeamDialogProps> = ({
  open,
  onClose,
  onAddTeam,
  newTeam,
  setNewTeam,
  leagues,
  isLoadingLeagues,
  selectedLeague,
  setSelectedLeague,
  selectedLeagueDetails,
  isLoadingLeagueDetails,
  alertMessage,
  setAlertMessage,
  fetchLeagueDetails,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Add New Team</DialogTitle>
      <DialogContent>
        {alertMessage && (
          <Alert 
            severity={alertMessage.type} 
            onClose={() => setAlertMessage(null)}
            sx={{ mb: 2 }}
          >
            {alertMessage.message}
          </Alert>
        )}
        {isLoadingLeagues ? (
          <CircularProgress />
        ) : (
          <form onSubmit={onAddTeam} className="space-y-4 pt-2">
            <div className="mb-4">
              <div 
                className="mb-1" 
                style={{
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  color: '#666',
                  marginLeft: '5px',
                }}
              >
                Select League<span style={{ color: '#d32f2f' }}>*</span>
              </div>
              <FormControl 
                required 
                fullWidth 
                variant="outlined"
                sx={{ 
                  width: '100%',
                  maxWidth: '400px',
                }}
              >
                <Select
                  id="select-league"
                  value={selectedLeague}
                  onChange={(e) => {
                    setSelectedLeague(e.target.value);
                    setNewTeam({...newTeam, team: ''});
                    const selectedLeague = leagues.find(l => l.league?.name === e.target.value);
                    if (selectedLeague?.league?.id && fetchLeagueDetails) {
                      // Call the function to load teams for this league
                      // Convert id to string to fix type error
                      fetchLeagueDetails(String(selectedLeague.league.id));
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        width: 'auto',
                      }
                    }
                  }}
            >
                  {leagues.map((league) => (
                    <MenuItem 
                      key={league.league?.id} 
                      value={league.league?.name}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        width: 'auto',
                        minWidth: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        {league.country?.flag && (
                          <Image
                            src={league.country.flag}
                            alt={`${league.country?.name} flag`}
                            width={24}
                            height={16}
                            loading="lazy"
                            style={{ objectFit: 'contain', flexShrink: 0 }}
                          />
                        )}
                        <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{league.country?.name} - </span>
                        {league.league?.logo && (
                          <Image
                            src={league.league.logo}
                            alt={`${league.league?.name} logo`}
                            width={20}
                            height={20}
                            loading="lazy"
                            style={{ objectFit: 'contain', flexShrink: 0 }}
                          />
                        )}
                        <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{league.league?.name}</span>
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="mb-4">
              <div 
                className="mb-1" 
                style={{
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  color: '#666',
                  marginLeft: '5px',
                }}
              >
                Select Team<span style={{ color: '#d32f2f' }}>*</span>
              </div>
              
              {isLoadingLeagueDetails ? (
                <div className="flex items-center mb-2">
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                  <span className="text-gray-600">Loading teams...</span>
                </div>
              ) : null}
              
              <FormControl 
                required 
                fullWidth
                variant="outlined"
                error={!selectedLeague && newTeam.team === ''}
                sx={{ 
                  width: '100%',
                  maxWidth: '400px',
                }}
              >
                <Select
                  id="select-team"
                  value={newTeam.team}
                  onChange={(e) => setNewTeam({...newTeam, team: e.target.value})}
                  disabled={!selectedLeagueDetails?.teams || isLoadingLeagueDetails}
                  displayEmpty
                  renderValue={(selected) => {
                    if (selected === '') {
                      return <span style={{ color: '#666' }}>
                        {!selectedLeague ? 'Please select a league first' : 'Select a team'}
                      </span>;
                    }
                    return selected;
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        width: 'auto',
                      }
                    }
                  }}
                >
                  {selectedLeagueDetails?.teams?.map((team) => 
                    team && (
                      <MenuItem 
                        key={team.id} 
                        value={team.name}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                          {team.logo && (
                            <Image
                              src={team.logo}
                              alt={`${team.name} logo`}
                              width={20}
                              height={20}
                              loading="lazy"
                              style={{ objectFit: 'contain', flexShrink: 0 }}
                            />
                          )}
                          <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {team.name}
                          </span>
                        </div>
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </div>

            <div className="mt-8"> {/* Added top margin wrapper */}
              <div 
                className="mb-1" 
                style={{
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  color: '#666',
                  marginLeft: '5px',
                }}
              >
                Player Name
              </div>
              <TextField
                fullWidth
                label=""
                variant="outlined"
                value={newTeam.player}
                onChange={(e) => setNewTeam({...newTeam, player: e.target.value})}
              />
            </div>
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onAddTeam} variant="contained" disabled={isLoadingLeagues || isLoadingLeagueDetails}>
          Add Team
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTeamDialog;
