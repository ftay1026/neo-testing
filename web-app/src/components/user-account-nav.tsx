'use client'

import Link from 'next/link'
import { Tables } from '@/types/database.types'
import { signOutAction } from "@/app/actions";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'

type User = Tables<'profiles'>

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, 'full_name' | 'avatar_url'> & { email: string | null }
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar
          user={{ full_name: user.full_name || null, avatar_url: user.avatar_url || null }}
          className='h-8 w-8'
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='text-primary' align='end'>
        <div className='flex items-center justify-start gap-2 p-2'>
          <div className='flex flex-col space-y-1 leading-none'>
            {user.full_name && <p className='font-medium'>{user.full_name}</p>}
            {user.email && (
              <p className='w-[200px] truncate text-sm text-muted-foreground'>
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild disabled>
          <Link href='/app/account'>Account</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild disabled>
          <Link href='/app/transactions'>Purchase History</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href='/app/credits'>Credit Topup</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="w-full justify-start px-0">
              Sign out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}