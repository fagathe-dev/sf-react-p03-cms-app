import { PostStatus } from '@/types';
import { Badge } from '@/ui/components';
import { POST_STATUS_DISPLAY } from '@/utils';

interface PostStatusBadgeProps {
  status: PostStatus;
}

export const PostStatusBadge = ({ status }: PostStatusBadgeProps) => {
  const display = POST_STATUS_DISPLAY[status];

  return (
    <Badge variant={display.variant} pill>
      {display.label}
    </Badge>
  );
};
