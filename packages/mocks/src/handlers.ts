import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/tools', () => {
    return HttpResponse.json([
      {
        id: 'web-search',
        name: 'Web Search',
        description: 'Search the web for information',
        category: 'search',
      },
    ]);
  }),
];
