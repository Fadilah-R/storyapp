 export async function storyMapper(story) {
  return {
    ...story,
    location: {
      ...story.location,

    },
  };
}