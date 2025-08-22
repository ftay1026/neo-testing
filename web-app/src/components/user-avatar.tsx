import { Tables } from '@/types/database.types'
import { AvatarProps } from '@radix-ui/react-avatar'

import { Icons } from '@/components/icons'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'

type User = Tables<'profiles'>

interface UserAvatarProps extends AvatarProps {
  user: Pick<User, 'avatar_url' | 'full_name'>
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  return (
    <Avatar {...props}>
      {user.avatar_url ? (
        <div className='relative aspect-square h-full w-full'>
          <Image
            fill
            sizes="100%"
            src={user.avatar_url}
            alt='profile picture'
            referrerPolicy='no-referrer'
          />
        </div>
      ) : (
        <AvatarFallback>
          <span className='sr-only'>{user?.full_name}</span>
          <Icons.user className='h-4 w-4' />
        </AvatarFallback>
      )}
    </Avatar>
  )
}