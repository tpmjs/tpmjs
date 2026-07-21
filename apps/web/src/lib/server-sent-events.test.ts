import { describe, expect, it } from 'vitest';
import { createServerSentEventParser } from './server-sent-events';

describe('createServerSentEventParser', () => {
  it('parses a complete event', () => {
    const parser = createServerSentEventParser();

    expect(parser.push('event: complete\ndata: {"ok":true}\n\n')).toEqual([
      { event: 'complete', data: '{"ok":true}' },
    ]);
  });

  it('retains state across arbitrary network chunk boundaries', () => {
    const parser = createServerSentEventParser();

    expect(parser.push('eve')).toEqual([]);
    expect(parser.push('nt: complete\nda')).toEqual([]);
    expect(parser.push('ta: {"ok":true}\n')).toEqual([]);
    expect(parser.push('\n')).toEqual([{ event: 'complete', data: '{"ok":true}' }]);
  });

  it('parses multiple events from one chunk without dropping adjacent lines', () => {
    const parser = createServerSentEventParser();

    expect(
      parser.push(
        'event: chunk\ndata: {"text":"hello"}\n\nevent: tokens\ndata: {"totalTokens":1}\n\nevent: complete\ndata: {"agentSteps":1}\n\n'
      )
    ).toEqual([
      { event: 'chunk', data: '{"text":"hello"}' },
      { event: 'tokens', data: '{"totalTokens":1}' },
      { event: 'complete', data: '{"agentSteps":1}' },
    ]);
  });

  it('supports CRLF, comments, and multi-line data fields', () => {
    const parser = createServerSentEventParser();

    expect(
      parser.push(': keep-alive\r\nevent: message\r\ndata: first\r\ndata: second\r\n\r\n')
    ).toEqual([{ event: 'message', data: 'first\nsecond' }]);
  });

  it('flushes a final event when the stream closes without a blank line', () => {
    const parser = createServerSentEventParser();

    expect(parser.push('event: complete\ndata: {"ok":true}')).toEqual([]);
    expect(parser.finish()).toEqual([{ event: 'complete', data: '{"ok":true}' }]);
  });

  it('does not dispatch event metadata without a data field', () => {
    const parser = createServerSentEventParser();

    expect(parser.push('event: complete\n\n')).toEqual([]);
    expect(parser.finish()).toEqual([]);
  });
});
