export interface ServerSentEvent {
  event: string;
  data: string;
}

export interface ServerSentEventParser {
  push(chunk: string): ServerSentEvent[];
  finish(): ServerSentEvent[];
}

/**
 * Incrementally parses the subset of the Server-Sent Events protocol used by
 * the playground. State is retained across network chunks, so field names,
 * values, and event boundaries do not need to align with reader reads.
 */
export function createServerSentEventParser(): ServerSentEventParser {
  let buffer = '';
  let eventName = 'message';
  let dataLines: string[] = [];

  const dispatch = (): ServerSentEvent[] => {
    const event = dataLines.length > 0 ? [{ event: eventName, data: dataLines.join('\n') }] : [];

    eventName = 'message';
    dataLines = [];

    return event;
  };

  const processLine = (line: string): ServerSentEvent[] => {
    if (line === '') {
      return dispatch();
    }

    if (line.startsWith(':')) {
      return [];
    }

    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? '' : line.slice(separator + 1);

    if (value.startsWith(' ')) {
      value = value.slice(1);
    }

    if (field === 'event') {
      eventName = value;
    } else if (field === 'data') {
      dataLines.push(value);
    }

    return [];
  };

  const processCompleteLines = (): ServerSentEvent[] => {
    const events: ServerSentEvent[] = [];
    let newline = buffer.indexOf('\n');

    while (newline !== -1) {
      let line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);

      if (line.endsWith('\r')) {
        line = line.slice(0, -1);
      }

      events.push(...processLine(line));
      newline = buffer.indexOf('\n');
    }

    return events;
  };

  return {
    push(chunk) {
      buffer += chunk;
      return processCompleteLines();
    },
    finish() {
      const events = processCompleteLines();

      if (buffer.length > 0) {
        const finalLine = buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer;
        buffer = '';
        events.push(...processLine(finalLine));
      }

      events.push(...dispatch());
      return events;
    },
  };
}
