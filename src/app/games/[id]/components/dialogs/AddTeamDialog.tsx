'use client';

import { useState } from 'react';
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
  Avatar,
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
            <TextField
              select
              fullWidth
              label="Select League"
              value={selectedLeague}
              onChange={(e) => {
                setSelectedLeague(e.target.value);
                setNewTeam({...newTeam, team: ''});
                const selectedLeague = leagues.find(l => l.league?.name === e.target.value);
                if (selectedLeague?.league?.id) {
                  // fetchLeagueDetails will be called from the parent component
                }
              }}
              required
              sx={{ 
                mb: 2,
                width: '100%',
                maxWidth: '400px',
                '& .MuiSelect-select': {
                  width: '100%'
                }
              }}
              slotProps={{
                select: {
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
            </TextField>

            {isLoadingLeagueDetails ? (
              <div className="flex justify-center p-4">
                <CircularProgress size={24} />
              </div>
            ) : selectedLeagueDetails?.teams ? (
              <TextField
                select
                fullWidth
                label="Select Team"
                value={newTeam.team}
                onChange={(e) => setNewTeam({...newTeam, team: e.target.value})}
                required
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        width: 'auto',
                      }
                    }
                  }
                }}
              >
                {selectedLeagueDetails.teams.map((team) => 
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
              </TextField>
            ) : null}

            <TextField
              fullWidth
              label="Player Name"
              value={newTeam.player}
              onChange={(e) => setNewTeam({...newTeam, player: e.target.value})}
            />
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onAddTeam} variant="contained" disabled={isLoadingLeagues}>
          Add Team
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTeamDialog;
