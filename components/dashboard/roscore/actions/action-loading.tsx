import React from 'react'
import {
  Card,
  CardHeader,
  CardContent
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function ActionLoading() {
  return (
    <Card className='shadow-none pt-0 rounded-xl border border-dashed border-indigo-200'>
      <CardHeader className='bg-indigo-50 border-b border-indigo-100 rounded-t-xl pt-6'>
        <div className='grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-start sm:gap-4'>
          <Skeleton className='h-5 w-5 rounded-full' />
          <div className='min-w-0 overflow-hidden space-y-2'>
            <Skeleton className='h-4 w-44 max-w-full' />
            <Skeleton className='h-3 w-36 max-w-full' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-6 py-4 space-y-4'>
        <div className='grid w-full grid-cols-2 gap-3'>
          <Skeleton className='h-8 rounded-full' />
          <Skeleton className='h-8 rounded-full' />
        </div>
        <div className='space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-11/12' />
          <Skeleton className='h-4 w-9/12' />
        </div>
      </CardContent>
    </Card>
  )
}

export { ActionLoading }


