'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  hashtags?: string[];
  via?: string;
  variant?: 'default' | 'twitter' | 'copy';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  hashtags = [],
  via = 'tpmjs_registry',
  variant = 'twitter',
  size = 'sm',
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return url || window.location.href;
  };

  const handleTwitterShare = () => {
    const shareUrl = getShareUrl();
    const tweetText = text || title;
    const hashtagsParam = hashtags.length > 0 ? `&hashtags=${hashtags.join(',')}` : '';
    const viaParam = via ? `&via=${via}` : '';

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}${hashtagsParam}${viaParam}`;

    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'copy') {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={handleCopyLink}
        className={className}
        title="Copy link"
      >
        <Icon icon={copied ? 'check' : 'link'} className="w-4 h-4 mr-1.5" />
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
    );
  }

  if (variant === 'twitter') {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={handleTwitterShare}
        className={className}
        title="Share on Twitter/X"
      >
        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor" role="img">
          <title>X/Twitter</title>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Tweet
      </Button>
    );
  }

  // Default: show both options
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size={size}
        onClick={handleTwitterShare}
        className={className}
        title="Share on Twitter/X"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" role="img">
          <title>X/Twitter</title>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Button>
      <Button
        variant="secondary"
        size={size}
        onClick={handleCopyLink}
        className={className}
        title="Copy link"
      >
        <Icon icon={copied ? 'check' : 'link'} className="w-4 h-4" />
      </Button>
    </div>
  );
}
