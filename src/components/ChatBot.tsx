import { useState, useEffect, useMemo } from 'react';
import { Fab, Paper, IconButton, Box, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { AIConversation } from '@aws-amplify/ui-react-ai';
import { Avatar } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { stringAvatar } from '@/utils/avatar';
import { AI_CHAT_BOT_NAME, WELCOME_MESSAGE } from '@/constant';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Draggable from 'react-draggable';
import { generateClient } from 'aws-amplify/data';
import { createAIHooks } from '@aws-amplify/ui-react-ai';
import { type Schema } from '../../amplify/data/resource';
import ReactMarkdown from 'react-markdown';

const client = generateClient<Schema>({ authMode: 'userPool' });
const { useAIConversation } = createAIHooks(client);

interface ChatBotProps {
  email: string;
  chatId?: string;
  onStartNewChat: () => void;
  onLoadConversations: () => void;
  isLoading: boolean;
  refreshKey: number;
}

export default function ChatBot({ 
  email, 
  chatId,
  onStartNewChat,
  onLoadConversations,
  isLoading 
}: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [chatMessages, setChatMessages] = useState([]);

  const conversation = useAIConversation('chat', {
    id: chatId,
  });
  const [{ data: { messages }, isLoading: isLoadingChat }, sendMessage] = conversation;

  const handleOpen = () => {
    setOpen(true);
    onLoadConversations();
  };

  const handleClose = () => setOpen(false);

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: data.y });
  };

  const handleNewChat = () => {
    // Reset conversation and create new chat
    onStartNewChat();
  };

  if (!email) return null;

  return (
    <>
      {open ? (
        <Draggable
          handle=".drag-handle"
          bounds="parent"
          position={position}
          onDrag={handleDrag}
        >
          <Paper
            elevation={6}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              width: '400px',
              height: '600px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 1200,
            }}
          >
            <Box
              className="drag-handle"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'background.default',
                borderBottom: 1,
                borderColor: 'divider',
                cursor: 'move',
                userSelect: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DragIndicatorIcon color="action" />
                <span>Personalized Chat</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* <Tooltip title="Start new chat">
                  <IconButton
                    size="small"
                    onClick={handleNewChat}
                    aria-label="new chat"
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip> */}
                <IconButton
                  size="small"
                  onClick={handleClose}
                  aria-label="close chat"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <AIConversation
                allowAttachments
                messages={messages}
                handleSendMessage={sendMessage}
                isLoading={isLoadingChat || isLoading}
                avatars={{
                  user: {
                    avatar: <Avatar size="small" alt={email} />,
                    username: stringAvatar(email).children
                  },
                  ai: {
                    avatar: <Avatar size="small" alt="AI" />,
                    username: AI_CHAT_BOT_NAME
                  }
                }}
                welcomeMessage={WELCOME_MESSAGE}
                messageRenderer={{
                  text: ({ text }) => <ReactMarkdown>{text}</ReactMarkdown>,
                }}
              />
            </Box>
          </Paper>
        </Draggable>
      ) : null}

      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1200,
        }}
        onClick={handleOpen}
      >
        <Typography variant="h6" component="span">Q</Typography>
      </Fab>
    </>
  );
}
