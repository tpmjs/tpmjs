import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@tpmjs/ui/Card/Card';
import { createElement } from 'react';

export default function HomePage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="space-y-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-center">TPMJS</h1>
        <p className="text-xl text-center text-muted-foreground">
          Tool Package Manager for AI Agents
        </p>

        {createElement(
          Card,
          {},
          createElement(
            CardHeader,
            {},
            createElement(CardTitle, {}, 'Welcome to TPMJS')
          ),
          createElement(
            CardContent,
            { className: 'space-y-4' },
            createElement('p', {},
              'The registry for AI tools. Discover, share, and integrate tools that give your agents superpowers.'
            ),
            createElement(
              Button,
              { className: 'w-full' },
              'Get Started'
            )
          )
        )}
      </div>
    </main>
  );
}
