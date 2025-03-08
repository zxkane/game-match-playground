'use client';

import { Typography, Avatar, Tooltip, AvatarGroup } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UpdateIcon from '@mui/icons-material/Update';
import { Schema } from '../../../../../amplify/data/resource';
import { stringToColor, stringAvatar } from '@/utils/avatar';

interface GameMetadataProps {
  game: Schema['Game']['type'];
  gameViewers: Schema['GameViewer']['type'][];
}

const GameMetadata: React.FC<GameMetadataProps> = ({ game, gameViewers }) => {
  return (
    <div className="space-y-4 mt-4">
      <Typography variant="body1" className="flex items-center gap-2 text-base">
        <AddCircleOutlineIcon fontSize="small" />
        {new Date(game.createdAt).toLocaleString()}
      </Typography>
      <Typography variant="body1" className="flex items-center gap-2 text-base">
        <UpdateIcon fontSize="small" />
        {new Date(game.updatedAt).toLocaleString()}
      </Typography>
      <Typography variant="body1" className="text-base">
        <strong>Owner:</strong> {game.owner}
      </Typography>
      
      <div className="mt-4 flex justify-end">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          <AvatarGroup max={6}>
            {gameViewers.map((viewer) => (
              <Tooltip 
                key={viewer.userId} 
                title={viewer.username}
                placement="top"
              >
                <Avatar
                  {...stringAvatar(viewer.username)}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: stringToColor(viewer.username)
                  }}
                />
              </Tooltip>
            ))}
          </AvatarGroup>
          {gameViewers.length > 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'nowrap', display: 'inline' }} className="text-base">
              {gameViewers.length == 1 ? 'is viewing this game.' : 'are viewing this game.'}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameMetadata;
