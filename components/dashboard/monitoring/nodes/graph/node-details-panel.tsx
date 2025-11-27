'use client'

import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Cpu,
  Upload,
  Download,
  Server,
  Zap,
  X,
  Copy,
  CheckCircle2
} from 'lucide-react'
import type { NodeDetails } from '@/store/lifecycle-nodes-store'

interface NodeDetailsPanelProps {
  nodeName: string
  nodeFullPath: string
  details: NodeDetails | null
  isLoading: boolean
  onClose: () => void
}

export function NodeDetailsPanel({
  nodeName,
  nodeFullPath,
  details,
  isLoading,
  onClose
}: NodeDetailsPanelProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(nodeFullPath)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="shadow-none pt-0 rounded-xl border-purple-200">
      <CardHeader className="bg-purple-50 border-purple-200 border-b rounded-t-xl pt-6">
        <TooltipProvider>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start sm:gap-4">
            <Cpu className="h-5 w-5 mt-0.5 text-purple-600 flex-shrink-0" />
            <div className="min-w-0 overflow-hidden space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-sm sm:text-base text-purple-900 truncate cursor-help">
                    {nodeName}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-mono text-xs">{nodeFullPath}</p>
                </TooltipContent>
              </Tooltip>
              <CardDescription className="text-xs text-purple-800 font-mono flex items-center gap-2">
                <span className="truncate">{nodeFullPath}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 flex-shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-purple-600" />
                  )}
                </Button>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4 text-purple-600" />
            </Button>
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : details ? (
          <Accordion type="multiple" defaultValue={['publications', 'subscriptions', 'services']}>
            {/* Publications */}
            <AccordionItem value="publications">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-green-600" />
                  <span>Publications</span>
                  <Badge variant="outline" className="ml-2">
                    {details.publications.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {details.publications.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">No publications</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {details.publications.map((pub) => (
                      <div
                        key={pub.name}
                        className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs"
                      >
                        <code className="font-mono text-gray-800 truncate">
                          {pub.name}
                        </code>
                        {pub.type && (
                          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                            {pub.type}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Subscriptions */}
            <AccordionItem value="subscriptions">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-blue-600" />
                  <span>Subscriptions</span>
                  <Badge variant="outline" className="ml-2">
                    {details.subscriptions.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {details.subscriptions.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">No subscriptions</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {details.subscriptions.map((sub) => (
                      <div
                        key={sub.name}
                        className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs"
                      >
                        <code className="font-mono text-gray-800 truncate">
                          {sub.name}
                        </code>
                        {sub.type && (
                          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                            {sub.type}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Services */}
            <AccordionItem value="services">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-600" />
                  <span>Services</span>
                  <Badge variant="outline" className="ml-2">
                    {details.services.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {details.services.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">No services</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {details.services.map((srv) => (
                      <div
                        key={srv.name}
                        className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs"
                      >
                        <code className="font-mono text-gray-800 truncate">
                          {srv.name}
                        </code>
                        {srv.type && (
                          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                            {srv.type}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Actions */}
            {details.actions.length > 0 && (
              <AccordionItem value="actions">
                <AccordionTrigger className="text-sm hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <span>Actions</span>
                    <Badge variant="outline" className="ml-2">
                      {details.actions.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {details.actions.map((action) => (
                      <div
                        key={action.name}
                        className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs"
                      >
                        <code className="font-mono text-gray-800 truncate">
                          {action.name}
                        </code>
                        {action.type && (
                          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                            {action.type}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">
              No details available for this node
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

