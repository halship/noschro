import type { Post } from './post';
import type { Profile } from './profile';

export type TimelineItem = {
	post: Post;
	profile?: Profile;
};
