import React, { useEffect, useState, useCallback } from 'react'
import { useWorkflowStore } from './store/workflow-store'
import { useTopicsStore } from '@/store/topic-store'
import { useServicesStore } from '@/store/service-store'
import { useParamsStore } from '@/store/param-store'
import { messageTypeParser } from '@/lib/ros/messageTypeParser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { X, Trash2, RefreshCw, Loader2, Info } from 'lucide-react'

const PropertiesPanel = () => {
  const { selectedNode, setSelectedNode, updateNodeData, removeNode } = useWorkflowStore()
  
  // ROS stores
  const { topics, isLoadingTopics, getTopicsList, typeDefinitions } = useTopicsStore()
  const { services, isLoadingServices, getServicesList, getServiceDefinition, serviceDefinitions } = useServicesStore()
  const { params, isLoadingParams, getParamsList } = useParamsStore()
  
  // Local state for loading service definitions
  const [loadingServiceDef, setLoadingServiceDef] = useState(false)

  // Refresh ROS data
  const refreshRosData = useCallback(async () => {
    await Promise.all([
      getTopicsList(),
      getServicesList(),
      getParamsList()
    ])
  }, [getTopicsList, getServicesList, getParamsList])

  // Auto-refresh on mount if empty
  useEffect(() => {
    if (topics.length === 0 && services.length === 0 && params.length === 0) {
      refreshRosData()
    }
  }, [])

  if (!selectedNode) {
    return null
  }

  const handleChange = (field: string, value: any) => {
    updateNodeData(selectedNode.id, { [field]: value })
  }

  // Handle topic selection and auto-fill message type
  const handleTopicSelect = (topicName: string) => {
    handleChange('topicName', topicName)
    
    // Find the topic type
    const topic = topics.find(t => t.name === topicName)
    if (topic) {
      handleChange('messageType', topic.type)
      
      // Generate default message structure
      const defaultMessage = messageTypeParser.createDefaultMessage(topic.type)
      if (defaultMessage && Object.keys(defaultMessage).length > 0) {
        handleChange('messageData', JSON.stringify(defaultMessage, null, 2))
      }
    }
  }

  // Handle service selection and auto-fill service type
  const handleServiceSelect = async (serviceName: string) => {
    handleChange('serviceName', serviceName)
    
    // Find the service type
    const service = services.find(s => s.name === serviceName)
    if (service) {
      handleChange('serviceType', service.type)
      
      // Load service definition for request schema
      setLoadingServiceDef(true)
      try {
        const definition = await getServiceDefinition(service.type)
        if (definition?.request?.defaultMessage) {
          handleChange('requestData', JSON.stringify(definition.request.defaultMessage, null, 2))
        }
      } catch (error) {
        console.error('Failed to load service definition:', error)
      } finally {
        setLoadingServiceDef(false)
      }
    }
  }

  // Handle param selection
  const handleParamSelect = (paramName: string) => {
    handleChange('paramName', paramName)
    
    // Find the param to get current value
    const param = params.find(p => p.name === paramName)
    if (param?.value !== undefined) {
      handleChange('paramValue', param.value)
      handleChange('paramType', typeof param.value === 'boolean' ? 'bool' : 
                                typeof param.value === 'number' ? 
                                  (Number.isInteger(param.value) ? 'int' : 'float') : 'string')
    }
  }

  const isLoading = isLoadingTopics || isLoadingServices || isLoadingParams

  return (
    <Card className="h-full w-80 border-l rounded-none border-y-0 border-r-0 shadow-none bg-white absolute right-0 top-0 z-10 overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b sticky top-0 bg-white z-20">
        <CardTitle className="text-lg font-semibold">Properties</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refreshRosData}
            disabled={isLoading}
            title="Refresh ROS data"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="space-y-2">
          <Label>Node Label</Label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>

        {/* Status indicator */}
        {selectedNode.data.status && selectedNode.data.status !== 'idle' && (
          <div className="flex items-center gap-2">
            <Label>Status</Label>
            <Badge 
              variant={selectedNode.data.status === 'success' ? 'default' : 
                       selectedNode.data.status === 'failure' ? 'destructive' : 'secondary'}
              className={selectedNode.data.status === 'running' ? 'animate-pulse' : ''}
            >
              {selectedNode.data.status}
            </Badge>
          </div>
        )}

        {/* Allow Input for Triggers */}
        {selectedNode.data.category === 'trigger' && (
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="allow-input">Enable Input Handle</Label>
            <Switch
              id="allow-input"
              checked={selectedNode.data.allowInput || false}
              onCheckedChange={(checked) => handleChange('allowInput', checked)}
            />
          </div>
        )}

        {/* --- TRIGGERS --- */}
        {selectedNode.data.label === 'Topic Monitor' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">Topic Configuration</h3>
                <Badge variant="outline" className="text-[10px]">TRIGGER</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Topic Name</Label>
                <Select
                  value={selectedNode.data.topicName || ''}
                  onValueChange={handleTopicSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingTopics ? 'Loading...' : 'Select Topic'} />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic.name} value={topic.name}>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{topic.name}</span>
                          <span className="text-xs text-gray-500">{topic.type}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {topics.length === 0 && !isLoadingTopics && (
                      <SelectItem value="__empty" disabled>
                        No topics available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {/* Custom topic input fallback */}
                {selectedNode.data.topicName && !topics.find(t => t.name === selectedNode.data.topicName) && (
                  <Input
                    placeholder="/custom/topic"
                    value={selectedNode.data.topicName || ''}
                    onChange={(e) => handleChange('topicName', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Message Type</Label>
                <Input
                  placeholder="std_msgs/msg/String"
                  value={selectedNode.data.messageType || ''}
                  onChange={(e) => handleChange('messageType', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>QoS Reliability</Label>
                <Select
                  value={selectedNode.data.qos?.toString() || '1'}
                  onValueChange={(value) => handleChange('qos', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Best Effort</SelectItem>
                    <SelectItem value="1">Reliable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {selectedNode.data.label === 'Interval' && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Interval (ms)</Label>
              <Input
                type="number"
                placeholder="1000"
                value={selectedNode.data.interval || ''}
                onChange={(e) => handleChange('interval', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                Fires every {selectedNode.data.interval || 1000}ms ({(1000 / (selectedNode.data.interval || 1000)).toFixed(2)} Hz)
              </p>
            </div>
          </>
        )}

        {/* --- LOGIC --- */}
        {selectedNode.data.label === 'Filter/Script' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">Script Configuration</h3>
                <Badge variant="outline" className="text-[10px]">LOGIC</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={selectedNode.data.scriptLanguage || 'javascript'}
                  onValueChange={(value) => handleChange('scriptLanguage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python" disabled>Python (server-side only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Script</Label>
                <Textarea
                  placeholder="// Access message via 'msg' variable&#10;// Return truthy to continue, falsy to stop&#10;return msg.data > 10;"
                  className="min-h-[150px] font-mono text-xs"
                  value={selectedNode.data.script || ''}
                  onChange={(e) => handleChange('script', e.target.value)}
                />
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Access trigger data via <code className="bg-blue-100 px-1 rounded">msg</code>. 
                  Return truthy to continue execution.</span>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedNode.data.label === 'AI Processor' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">AI Configuration</h3>
                <Badge variant="outline" className="text-[10px]">LOGIC</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  placeholder="Describe the AI task..."
                  className="min-h-[100px]"
                  value={selectedNode.data.prompt || ''}
                  onChange={(e) => handleChange('prompt', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Processed via Inngest + Google AI SDK
                </p>
              </div>
            </div>
          </>
        )}

        {/* --- ROS ACTIONS --- */}
        {selectedNode.data.label === 'Publish Topic' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">Publish Configuration</h3>
                <Badge variant="outline" className="text-[10px]">ACTION</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Topic Name</Label>
                <Select
                  value={selectedNode.data.topicName || ''}
                  onValueChange={handleTopicSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingTopics ? 'Loading...' : 'Select Topic'} />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic.name} value={topic.name}>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{topic.name}</span>
                          <span className="text-xs text-gray-500">{topic.type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom topic input */}
                <Input
                  placeholder="/custom/topic"
                  value={selectedNode.data.topicName || ''}
                  onChange={(e) => handleChange('topicName', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Message Type</Label>
                <Input
                  placeholder="std_msgs/msg/String"
                  value={selectedNode.data.messageType || ''}
                  onChange={(e) => handleChange('messageType', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Message Data (JSON)</Label>
                  {selectedNode.data.messageType && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        if (selectedNode.data.messageType) {
                          const defaultMsg = messageTypeParser.createDefaultMessage(selectedNode.data.messageType)
                          if (defaultMsg) {
                            handleChange('messageData', JSON.stringify(defaultMsg, null, 2))
                          }
                        }
                      }}
                    >
                      Reset to Schema
                    </Button>
                  )}
                </div>
                <Textarea
                  placeholder='{ "data": "hello" }'
                  className="min-h-[120px] font-mono text-xs"
                  value={selectedNode.data.messageData || ''}
                  onChange={(e) => handleChange('messageData', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {selectedNode.data.label === 'Call Service' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">Service Configuration</h3>
                <Badge variant="outline" className="text-[10px]">ACTION</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Select
                  value={selectedNode.data.serviceName || ''}
                  onValueChange={handleServiceSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingServices ? 'Loading...' : 'Select Service'} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.name} value={service.name}>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{service.name}</span>
                          <span className="text-xs text-gray-500">{service.type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom service input */}
                <Input
                  placeholder="/custom/service"
                  value={selectedNode.data.serviceName || ''}
                  onChange={(e) => handleChange('serviceName', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Service Type</Label>
                <Input
                  placeholder="std_srvs/srv/Trigger"
                  value={selectedNode.data.serviceType || ''}
                  onChange={(e) => handleChange('serviceType', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Request Data (JSON)</Label>
                  {loadingServiceDef && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                <Textarea
                  placeholder='{ "a": 1, "b": 2 }'
                  className="min-h-[120px] font-mono text-xs"
                  value={selectedNode.data.requestData || ''}
                  onChange={(e) => handleChange('requestData', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {selectedNode.data.label === 'Set Param' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">Parameter Configuration</h3>
                <Badge variant="outline" className="text-[10px]">ACTION</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Parameter Name</Label>
                <Select
                  value={selectedNode.data.paramName || ''}
                  onValueChange={handleParamSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingParams ? 'Loading...' : 'Select Parameter'} />
                  </SelectTrigger>
                  <SelectContent>
                    {params.map(param => (
                      <SelectItem key={param.name} value={param.name}>
                        <span className="font-mono text-sm">{param.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom param input */}
                <Input
                  placeholder="param_name"
                  value={selectedNode.data.paramName || ''}
                  onChange={(e) => handleChange('paramName', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={selectedNode.data.paramType || 'string'}
                  onValueChange={(value) => handleChange('paramType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="int">Integer</SelectItem>
                    <SelectItem value="float">Float</SelectItem>
                    <SelectItem value="bool">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Value</Label>
                {selectedNode.data.paramType === 'bool' ? (
                  <Select
                    value={String(selectedNode.data.paramValue || 'false')}
                    onValueChange={(value) => handleChange('paramValue', value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={selectedNode.data.paramType === 'int' || selectedNode.data.paramType === 'float' ? 'number' : 'text'}
                    step={selectedNode.data.paramType === 'float' ? '0.01' : '1'}
                    placeholder="Value"
                    value={selectedNode.data.paramValue?.toString() || ''}
                    onChange={(e) => handleChange('paramValue', e.target.value)}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {selectedNode.data.label === 'Get Param' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">Get Parameter</h3>
                <Badge variant="outline" className="text-[10px]">ACTION</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Parameter Name</Label>
                <Select
                  value={selectedNode.data.paramName || ''}
                  onValueChange={handleParamSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingParams ? 'Loading...' : 'Select Parameter'} />
                  </SelectTrigger>
                  <SelectContent>
                    {params.map(param => (
                      <SelectItem key={param.name} value={param.name}>
                        <span className="font-mono text-sm">{param.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="param_name"
                  value={selectedNode.data.paramName || ''}
                  onChange={(e) => handleChange('paramName', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </>
        )}

        {selectedNode.data.label === 'Delete Param' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">Delete Parameter</h3>
                <Badge variant="outline" className="text-[10px]">ACTION</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Parameter Name</Label>
                <Select
                  value={selectedNode.data.paramName || ''}
                  onValueChange={handleParamSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingParams ? 'Loading...' : 'Select Parameter'} />
                  </SelectTrigger>
                  <SelectContent>
                    {params.map(param => (
                      <SelectItem key={param.name} value={param.name}>
                        <span className="font-mono text-sm">{param.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="param_name"
                  value={selectedNode.data.paramName || ''}
                  onChange={(e) => handleChange('paramName', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </>
        )}

        {/* --- INTEGRATIONS --- */}
        {(selectedNode.data.label === 'Slack' || selectedNode.data.label === 'Discord') && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">{selectedNode.data.label} Configuration</h3>
                <Badge variant="outline" className="text-[10px]">INTEGRATION</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder={`https://hooks.${selectedNode.data.label.toLowerCase()}.com/...`}
                  value={selectedNode.data.webhookUrl || ''}
                  onChange={(e) => handleChange('webhookUrl', e.target.value)}
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea
                  placeholder="Alert: Robot battery is low!"
                  className="min-h-[100px]"
                  value={selectedNode.data.body || ''}
                  onChange={(e) => handleChange('body', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Use {'{{msg.field}}'} to interpolate trigger data
                </p>
              </div>
            </div>
          </>
        )}

        {selectedNode.data.label === 'Email' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-700">Email Configuration</h3>
                <Badge variant="outline" className="text-[10px]">INTEGRATION</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Input
                  placeholder="user@example.com"
                  value={selectedNode.data.recipient || ''}
                  onChange={(e) => handleChange('recipient', e.target.value)}
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Robot Alert"
                  value={selectedNode.data.subject || ''}
                  onChange={(e) => handleChange('subject', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  placeholder="Email body..."
                  className="min-h-[100px]"
                  value={selectedNode.data.body || ''}
                  onChange={(e) => handleChange('body', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-4 border-t space-y-4">
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={() => removeNode(selectedNode.id)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Node
          </Button>
          <div className="text-xs text-gray-400 font-mono text-center">
            ID: {selectedNode.id}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PropertiesPanel
