'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  Avatar,
} from '@mui/material';
import { Schema } from '../../../../../../amplify/data/resource';

interface AddMatchDialogProps {
  open: boolean;
  onClose: () => void;
  onAddMatch: (e: React.FormEvent) => Promise<void>;
  newMatch: {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    date: string;
  };
  setNewMatch: (match: {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    date: string;
  }) => void;
  game: Schema['Game']['type'];
  alertMessage: { type: 'success' | 'error', message: string } | null;
  setAlertMessage: (message: { type: 'success' | 'error', message: string } | null) => void;
}

const AddMatchDialog: React.FC<AddMatchDialogProps> = ({
  open,
  onClose,
  onAddMatch,
  newMatch,
  setNewMatch,
  game,
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
      <DialogTitle>Add New Match</DialogTitle>
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
        <form onSubmit={onAddMatch} className="space-y-4 pt-2">
          <TextField
            select
            fullWidth
            label="Home Team"
            value={newMatch.homeTeamId}
            onChange={(e) => setNewMatch({...newMatch, homeTeamId: e.target.value})}
            required
          >
            {game?.teams?.filter(team => team !== null).map((teamPlayer) => (
              <MenuItem 
                key={teamPlayer?.team.id} 
                value={teamPlayer?.team.id}
                disabled={teamPlayer?.team.id === newMatch.awayTeamId}
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    src={teamPlayer?.team.logo || ''}
                    alt={teamPlayer?.team.name}
                    sx={{ width: 24, height: 24 }}
                    variant="rounded"
                  />
                  <span className="break-words text-wrap">{teamPlayer?.team.name}</span>
                </div>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Away Team"
            value={newMatch.awayTeamId}
            onChange={(e) => setNewMatch({...newMatch, awayTeamId: e.target.value})}
            required
          >
            {game?.teams?.filter(team => team !== null).map((teamPlayer) => (
              <MenuItem 
                key={teamPlayer?.team.id} 
                value={teamPlayer?.team.id}
                disabled={teamPlayer?.team.id === newMatch.homeTeamId}
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    src={teamPlayer?.team.logo || ''}
                    alt={teamPlayer?.team.name}
                    sx={{ width: 24, height: 24 }}
                    variant="rounded"
                  />
                  <span className="break-words text-wrap">{teamPlayer?.team.name}</span>
                </div>
              </MenuItem>
            ))}
          </TextField>

          <div className="flex gap-4">
            <TextField
              type="number"
              label="Home Score"
              value={newMatch.homeScore}
              onChange={(e) => setNewMatch({...newMatch, homeScore: parseInt(e.target.value) || 0})}
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              type="number"
              label="Away Score"
              value={newMatch.awayScore}
              onChange={(e) => setNewMatch({...newMatch, awayScore: parseInt(e.target.value) || 0})}
              required
              inputProps={{ min: 0 }}
            />
          </div>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onAddMatch} variant="contained">
          Add Match
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMatchDialog;
