import Map from '../utils/map';
 
export async function storyMapper(story) {
  return {
    ...story,
    location: {
      ...story.location,

    },
  };
}