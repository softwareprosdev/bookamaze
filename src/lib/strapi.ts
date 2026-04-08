// Dummy Strapi client for demo purposes
// This is only used in demo routes which should be excluded in production

export const articles = {
  find: async () => ({
    data: [
      {
        id: 1,
        title: 'Sample Article 1',
        content: 'This is a sample article for demo purposes.',
        publishedAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Sample Article 2',
        content: 'Another sample article for demo purposes.',
        publishedAt: new Date().toISOString(),
      },
    ],
  }),
  findOne: async (id: string) => ({
    data: {
      id: parseInt(id),
      title: `Sample Article ${id}`,
      content: `This is the content of sample article ${id} for demo purposes.`,
      publishedAt: new Date().toISOString(),
    },
  }),
}