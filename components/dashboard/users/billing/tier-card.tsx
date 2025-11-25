import React from 'react'
import { Check, CreditCard, ExternalLink } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const planFeatures = [
  'Everything in Free',
  'Create up to 10 layouts',
  'Access to 50 Workflows per month',
  '50GB ROSBAG Storage',
  'Sharable links',
  'Priority Support'
]

export function TierCard () {
  return (
    <Card className='shadow-none pt-0 rounded-xl border border-blue-200'>
      <CardHeader className='bg-blue-50 border-blue-200 border-b rounded-t-xl pt-6'>
        <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-start'>
          <CreditCard className='h-5 w-5 mt-0.5 text-blue-600' />
          <div className='min-w-0'>
            <CardTitle className='text-base text-blue-900'>
              Current Plan
            </CardTitle>
            <CardDescription className='text-xs text-blue-800 mt-1'>
              Your active subscription tier
            </CardDescription>
          </div>
          <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs'>
            Pro Plan
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='px-6 py-5 space-y-6'>
        <div>
          <div className='flex items-baseline gap-2'>
            <span className='text-4xl font-bold text-gray-900'>$3.99</span>
            <span className='text-lg font-semibold text-gray-600'>/mo</span>
          </div>
          <p className='text-sm text-gray-500 mt-1'>billed monthly</p>
        </div>

        <Separator className='bg-gray-200' />

        <div className='space-y-3'>
          <p className='text-sm font-semibold text-gray-900'>Plan Features</p>
          <ul className='space-y-2'>
            {planFeatures.map(feature => (
              <li key={feature} className='flex items-start gap-3 text-sm text-gray-700'>
                <Check className='h-4 w-4 text-blue-600 mt-0.5' />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className='flex flex-wrap gap-3'>
          <Button className='bg-green-100 text-green-700 border border-green-500 hover:bg-green-500 hover:text-white shadow-none'>
            Upgrade to Team
          </Button>
          <Button
            variant='outline'
            className='border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700'
          >
            Cancel Subscription
          </Button>
        </div>

        <div className='rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-semibold text-gray-900'>Need Help?</p>
            <p className='text-sm text-gray-500 mt-0.5'>
              Have questions about your subscription or billing?
            </p>
          </div>
          <Button variant='ghost' className='text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5'>
            View Documentation
            <ExternalLink className='h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
