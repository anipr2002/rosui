import { create } from 'zustand'
import * as ROSLIB from 'roslib'
import { useRosStore } from './ros-store'
import { messageTypeParser } from '@/lib/ros/messageTypeParser'

export interface ServiceInfo {
  name: string
  type: string
}

export interface ServiceDefinition {
  request: {
    type: string
    definition: string
    defaultMessage: any
  }
  response: {
    type: string
    definition: string
  }
}

export interface ServiceCall {
  serviceName: string
  request: any
  response: any
  error: string | null
  isLoading: boolean
  timestamp: number
}

interface ServicesState {
  services: ServiceInfo[]
  isLoadingServices: boolean
  serviceDefinitions: Map<string, ServiceDefinition>
  isLoadingDefinitions: Map<string, boolean>
  serviceCalls: Map<string, ServiceCall>
  getServicesList: () => Promise<void>
  getServiceDefinition: (
    serviceType: string
  ) => Promise<ServiceDefinition | null>
  callService: (
    serviceName: string,
    serviceType: string,
    request: any
  ) => Promise<any>
  cleanup: () => void
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  isLoadingServices: false,
  serviceDefinitions: new Map(),
  isLoadingDefinitions: new Map(),
  serviceCalls: new Map(),

  getServicesList: async () => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      console.error('ROS connection not available')
      return
    }

    set({ isLoadingServices: true })

    ros.getServices(
      (services) => {
        if (services.length === 0) {
          set({ services: [], isLoadingServices: false })
          return
        }

        const promises = services.map(
          (serviceName) =>
            new Promise<ServiceInfo>((resolve, reject) => {
              ros.getServiceType(
                serviceName,
                (serviceType) => resolve({ name: serviceName, type: serviceType }),
                (error) =>
                  reject(
                    new Error(`Failed to get type for ${serviceName}: ${error}`)
                  )
              )
            })
        )

        Promise.all(promises)
          .then((servicesWithTypes) => {
            set({ services: servicesWithTypes, isLoadingServices: false })
            console.log(
              `Loaded ${servicesWithTypes.length} services successfully`
            )
          })
          .catch((error) => {
            console.error('Error fetching service types:', error)
            set({ isLoadingServices: false })
          })
      },
      (error) => {
        console.error('Failed to load services:', error)
        set({ isLoadingServices: false })
      }
    )
  },

  getServiceDefinition: async (serviceType: string) => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      return null
    }

    const cachedDef = get().serviceDefinitions.get(serviceType)
    if (cachedDef) {
      return cachedDef
    }

    set((state) => ({
      isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
        serviceType,
        true
      ),
    }))

    const requestType = `${serviceType}Request`
    const responseType = `${serviceType}Response`

    const getDetails = (api: 'service_request_details' | 'service_response_details') =>
      new Promise<{ typedefs: any[] }>((resolve, reject) => {
        const service = new ROSLIB.Service({
          ros,
          name: `/rosapi/${api}`,
          serviceType: `rosapi_msgs/srv/${api === 'service_request_details' ? 'ServiceRequestDetails' : 'ServiceResponseDetails'}`,
        })

        const request = new ROSLIB.ServiceRequest({ type: serviceType })

        service.callService(
          request,
          (response: any) => resolve(response),
          (error: any) => reject(new Error(error))
        )
      })
      
    const processTypeDefs = (typedefs: any[]) => {
      const types: string[] = []
      const definitions: string[] = []
      let mainDefinition = ''

      console.log('Processing typedefs for:', { requestType, responseType })
      console.log('Available typedefs:', typedefs.map(t => ({ type: t.type, fields: t.fieldnames.length })))

      for (const typeDef of typedefs) {
        types.push(typeDef.type)
        const defText = typeDef.fieldnames.map((name: string, i: number) => {
          const type = typeDef.fieldtypes[i]
          const arrayLen = typeDef.fieldarraylen[i]
          // Remove leading underscores from field names for compatibility
          const cleanName = name.startsWith('_') ? name.substring(1) : name
          return `${type}${arrayLen !== -1 ? `[${arrayLen}]` : ''} ${cleanName}`
        }).join('\n')
        definitions.push(defText)

        console.log(`TypeDef: ${typeDef.type}, matches request: ${typeDef.type === requestType}, matches response: ${typeDef.type === responseType}`)

        if (typedefs.length === 1 || typeDef.type === requestType || typeDef.type === responseType) {
          mainDefinition = defText
          console.log('Selected as main definition:', typeDef.type)
        }
      }

      console.log('Loading definitions into parser:', types)
      messageTypeParser.loadTypeDefinitions(definitions, types)
      console.log('Main definition result:', mainDefinition)
      return mainDefinition
    }

    try {
      const [req, res] = await Promise.all([
        getDetails('service_request_details'),
        getDetails('service_response_details'),
      ])

      const requestDefinition = processTypeDefs(req.typedefs)
      const responseDefinition = processTypeDefs(res.typedefs)

      // Debug logging
      console.log(`Service ${serviceType} - Request type: ${requestType}`)
      console.log('Request typedefs:', req.typedefs)
      console.log('Processed request definition:', requestDefinition)

      let defaultMessage = messageTypeParser.createDefaultMessage(requestType)
      console.log('Default message for request:', defaultMessage)

      // Temporary fallback for testing - create a basic structure if the parser fails
      if (!defaultMessage || Object.keys(defaultMessage).length === 0) {
        console.log('Parser failed to create default message, creating fallback');
        defaultMessage = {};

        // Parse the request definition to create basic structure
        const defLines = requestDefinition.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        for (const line of defLines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            const type = parts[0];
            const name = parts[1].replace(/\[.*\]/, ''); // Remove array notation
            // Remove leading underscore from field name for compatibility
            const cleanName = name.startsWith('_') ? name.substring(1) : name;

            if (type === 'string') {
              defaultMessage[cleanName] = '';
            } else if (type.includes('int') || type.includes('float') || type.includes('uint')) {
              defaultMessage[cleanName] = 0;
            } else if (type === 'bool') {
              defaultMessage[cleanName] = false;
            } else {
              defaultMessage[cleanName] = {};
            }
          }
        }
        console.log('Created fallback default message:', defaultMessage);
      }

      const definition: ServiceDefinition = {
        request: {
          type: requestType,
          definition: requestDefinition,
          defaultMessage,
        },
        response: {
          type: responseType,
          definition: responseDefinition,
        },
      }

      set((state) => ({
        serviceDefinitions: new Map(state.serviceDefinitions).set(
          serviceType,
          definition
        ),
      }))

      return definition
    } catch (error) {
      console.error(
        `Failed to get service definition for ${serviceType}:`,
        error
      )
      return null
    } finally {
      set((state) => ({
        isLoadingDefinitions: new Map(state.isLoadingDefinitions).set(
          serviceType,
          false
        ),
      }))
    }
  },

  callService: async (serviceName: string, serviceType: string, request: any) => {
    const ros = useRosStore.getState().ros
    if (!ros) {
      throw new Error('ROS connection not available')
    }

    set((state) => ({
      serviceCalls: new Map(state.serviceCalls).set(serviceName, {
        serviceName,
        request,
        response: null,
        error: null,
        isLoading: true,
        timestamp: Date.now(),
      }),
    }))

    return new Promise((resolve, reject) => {
      const service = new ROSLIB.Service({
        ros,
        name: serviceName,
        serviceType,
      })

      const serviceRequest = new ROSLIB.ServiceRequest(request)

      service.callService(
        serviceRequest,
        (response) => {
          set((state) => ({
            serviceCalls: new Map(state.serviceCalls).set(serviceName, {
              ...state.serviceCalls.get(serviceName)!,
              response,
              isLoading: false,
            }),
          }))
          resolve(response)
        },
        (error: string) => {
          set((state) => ({
            serviceCalls: new Map(state.serviceCalls).set(serviceName, {
              ...state.serviceCalls.get(serviceName)!,
              error: error,
              isLoading: false,
            }),
          }))
          reject(new Error(error))
        }
      )
    })
  },

  cleanup: () => {
    set({
      services: [],
      isLoadingServices: false,
      serviceDefinitions: new Map(),
      isLoadingDefinitions: new Map(),
      serviceCalls: new Map(),
    })
  },
}))
