import type { Post } from './post';
import type { Profile } from './profile';

export type Quote = {
	post: Post;
	profile?: Profile;
	quotes?: Record<string, Quote>;
};
