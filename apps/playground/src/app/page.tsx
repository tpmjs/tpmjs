'use client';

import { ChatHeader } from '~/components/chat/ChatHeader';
import { ChatInterface } from '~/components/chat/ChatInterface';
import { ToolsSidebar } from '~/components/sidebar/ToolsSidebar';

export default function PlaygroundPage(): React.ReactElement {
  const handleClearChat = () => {
    // Refresh the page to clear chat
    window.location.reload();
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader onClear={handleClearChat} />
      <div className="flex flex-1 overflow-hidden">
        <ToolsSidebar />
        <ChatInterface />
      </div>
    </div>
  );
}
