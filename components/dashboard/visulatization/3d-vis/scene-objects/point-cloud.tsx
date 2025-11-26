"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { use3DVisStore } from "@/store/3d-vis-store";
import { useWebGPU } from "../webgpu-context";
import * as THREE from "three";
import tgpu from "typegpu";
import * as d from "typegpu/data";

// GPU-accelerated point cloud processor using TypeGPU
class GPUPointCloudProcessor {
  private root: ReturnType<typeof tgpu.initFromDevice> | null = null;
  private device: GPUDevice;
  private pipeline: GPUComputePipeline | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;

  constructor(device: GPUDevice) {
    this.device = device;
    this.initPipeline();
  }

  private initPipeline() {
    // Create compute shader for point cloud parsing
    const shaderCode = `
      struct FieldInfo {
        xOffset: u32,
        yOffset: u32,
        zOffset: u32,
        rgbOffset: u32,
        intensityOffset: u32,
        pointStep: u32,
        numPoints: u32,
        hasRgb: u32,
        hasIntensity: u32,
        padding: u32,
        padding2: u32,
        padding3: u32,
      }

      @group(0) @binding(0) var<uniform> fieldInfo: FieldInfo;
      @group(0) @binding(1) var<storage, read> inputData: array<u32>;
      @group(0) @binding(2) var<storage, read_write> positions: array<f32>;
      @group(0) @binding(3) var<storage, read_write> colors: array<f32>;

      @compute @workgroup_size(256)
      fn main(@builtin(global_invocation_id) globalId: vec3u) {
        let idx = globalId.x;
        if (idx >= fieldInfo.numPoints) {
          return;
        }

        // Calculate byte offset for this point
        let byteOffset = idx * fieldInfo.pointStep;
        let wordOffset = byteOffset / 4u;

        // Read position floats (assuming float32 x, y, z)
        let xWord = wordOffset + fieldInfo.xOffset / 4u;
        let yWord = wordOffset + fieldInfo.yOffset / 4u;
        let zWord = wordOffset + fieldInfo.zOffset / 4u;

        let x = bitcast<f32>(inputData[xWord]);
        let y = bitcast<f32>(inputData[yWord]);
        let z = bitcast<f32>(inputData[zWord]);

        // Write position
        let posIdx = idx * 3u;
        positions[posIdx] = x;
        positions[posIdx + 1u] = y;
        positions[posIdx + 2u] = z;

        // Read color
        var r: f32 = 1.0;
        var g: f32 = 1.0;
        var b: f32 = 1.0;

        if (fieldInfo.hasRgb == 1u) {
          let rgbWord = wordOffset + fieldInfo.rgbOffset / 4u;
          let rgb = inputData[rgbWord];
          r = f32((rgb >> 16u) & 0xFFu) / 255.0;
          g = f32((rgb >> 8u) & 0xFFu) / 255.0;
          b = f32(rgb & 0xFFu) / 255.0;
        } else if (fieldInfo.hasIntensity == 1u) {
          let intensityWord = wordOffset + fieldInfo.intensityOffset / 4u;
          let intensity = bitcast<f32>(inputData[intensityWord]);
          r = intensity;
          g = intensity;
          b = intensity;
        }

        // Write color
        let colIdx = idx * 3u;
        colors[colIdx] = r;
        colors[colIdx + 1u] = g;
        colors[colIdx + 2u] = b;
      }
    `;

    const shaderModule = this.device.createShaderModule({
      code: shaderCode,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });

    this.pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      compute: {
        module: shaderModule,
        entryPoint: "main",
      },
    });
  }

  async processPointCloud(
    message: any,
    positionOutput: Float32Array,
    colorOutput: Float32Array
  ): Promise<void> {
    if (!this.pipeline || !this.bindGroupLayout) {
      throw new Error("GPU pipeline not initialized");
    }

    const { width, height, point_step, data, fields } = message;
    const numPoints = width * height;

    if (numPoints === 0) return;

    // Find field offsets
    const xField = fields.find((f: any) => f.name === "x");
    const yField = fields.find((f: any) => f.name === "y");
    const zField = fields.find((f: any) => f.name === "z");
    const rgbField = fields.find(
      (f: any) => f.name === "rgb" || f.name === "rgba"
    );
    const intensityField = fields.find((f: any) => f.name === "intensity");

    if (!xField || !yField || !zField) {
      throw new Error("Point cloud missing x, y, or z fields");
    }

    // Create uniform buffer for field info (padded to 48 bytes for alignment)
    const fieldInfoData = new Uint32Array([
      xField.offset,
      yField.offset,
      zField.offset,
      rgbField?.offset ?? 0,
      intensityField?.offset ?? 0,
      point_step,
      numPoints,
      rgbField ? 1 : 0,
      intensityField ? 1 : 0,
      0, // padding
      0, // padding
      0, // padding
    ]);

    const uniformBuffer = this.device.createBuffer({
      size: fieldInfoData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(uniformBuffer, 0, fieldInfoData);

    // Convert input data to Uint32Array
    const inputBytes = new Uint8Array(data);
    const inputDataSize = Math.ceil((numPoints * point_step) / 4) * 4;
    const inputBuffer = this.device.createBuffer({
      size: inputDataSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(
      inputBuffer,
      0,
      inputBytes.slice(0, inputDataSize)
    );

    // Create output buffers
    const positionsSize = numPoints * 3 * 4;
    const positionsBuffer = this.device.createBuffer({
      size: positionsSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const colorsBuffer = this.device.createBuffer({
      size: positionsSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Create staging buffers for readback
    const positionsStagingBuffer = this.device.createBuffer({
      size: positionsSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    const colorsStagingBuffer = this.device.createBuffer({
      size: positionsSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: inputBuffer } },
        { binding: 2, resource: { buffer: positionsBuffer } },
        { binding: 3, resource: { buffer: colorsBuffer } },
      ],
    });

    // Dispatch compute shader
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(numPoints / 256));
    passEncoder.end();

    // Copy results to staging buffers
    commandEncoder.copyBufferToBuffer(
      positionsBuffer,
      0,
      positionsStagingBuffer,
      0,
      positionsSize
    );
    commandEncoder.copyBufferToBuffer(
      colorsBuffer,
      0,
      colorsStagingBuffer,
      0,
      positionsSize
    );

    this.device.queue.submit([commandEncoder.finish()]);

    // Read back results
    await positionsStagingBuffer.mapAsync(GPUMapMode.READ);
    await colorsStagingBuffer.mapAsync(GPUMapMode.READ);

    const positionsData = new Float32Array(
      positionsStagingBuffer.getMappedRange()
    );
    const colorsData = new Float32Array(colorsStagingBuffer.getMappedRange());

    // Copy to output
    positionOutput.set(positionsData.slice(0, numPoints * 3));
    colorOutput.set(colorsData.slice(0, numPoints * 3));

    positionsStagingBuffer.unmap();
    colorsStagingBuffer.unmap();

    // Cleanup
    uniformBuffer.destroy();
    inputBuffer.destroy();
    positionsBuffer.destroy();
    colorsBuffer.destroy();
    positionsStagingBuffer.destroy();
    colorsStagingBuffer.destroy();
  }

  dispose() {
    this.pipeline = null;
    this.bindGroupLayout = null;
  }
}

// CPU fallback for when WebGPU is not available
function cpuParsePointCloud(
  message: any,
  positions: Float32Array,
  colors: Float32Array
): void {
  const { width, height, point_step, data, fields } = message;
  const numPoints = width * height;

  const xField = fields.find((f: any) => f.name === "x");
  const yField = fields.find((f: any) => f.name === "y");
  const zField = fields.find((f: any) => f.name === "z");
  const rgbField = fields.find(
    (f: any) => f.name === "rgb" || f.name === "rgba"
  );
  const intensityField = fields.find((f: any) => f.name === "intensity");

  if (!xField || !yField || !zField) {
    console.error("Point cloud missing x, y, or z fields");
    return;
  }

  const dataView = new DataView(new Uint8Array(data).buffer);

  for (let i = 0; i < numPoints; i++) {
    const offset = i * point_step;

    // Read position
    positions[i * 3] = dataView.getFloat32(offset + xField.offset, true);
    positions[i * 3 + 1] = dataView.getFloat32(offset + yField.offset, true);
    positions[i * 3 + 2] = dataView.getFloat32(offset + zField.offset, true);

    // Read color
    if (rgbField) {
      const rgb = dataView.getUint32(offset + rgbField.offset, true);
      colors[i * 3] = ((rgb >> 16) & 0xff) / 255;
      colors[i * 3 + 1] = ((rgb >> 8) & 0xff) / 255;
      colors[i * 3 + 2] = (rgb & 0xff) / 255;
    } else if (intensityField) {
      const intensity = dataView.getFloat32(
        offset + intensityField.offset,
        true
      );
      colors[i * 3] = intensity;
      colors[i * 3 + 1] = intensity;
      colors[i * 3 + 2] = intensity;
    } else {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }
  }
}

interface PointCloudRendererProps {
  topic: string;
}

export function PointCloudRenderer({ topic }: PointCloudRendererProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const processorRef = useRef<GPUPointCloudProcessor | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  // Double buffering for smooth updates
  const [activeBuffer, setActiveBuffer] = useState<0 | 1>(0);
  const positionBuffersRef = useRef<[Float32Array | null, Float32Array | null]>(
    [null, null]
  );
  const colorBuffersRef = useRef<[Float32Array | null, Float32Array | null]>([
    null,
    null,
  ]);

  const subscription = use3DVisStore((state) =>
    state.pointCloudSubscriptions.get(topic)
  );
  const { device, isSupported } = useWebGPU();

  // Initialize GPU processor
  useEffect(() => {
    if (device && isSupported && !processorRef.current) {
      try {
        processorRef.current = new GPUPointCloudProcessor(device);
        console.log("GPU point cloud processor initialized");
      } catch (err) {
        console.error("Failed to create GPU point cloud processor:", err);
      }
    }

    return () => {
      if (processorRef.current) {
        processorRef.current.dispose();
        processorRef.current = null;
      }
    };
  }, [device, isSupported]);

  // Process point cloud message
  const processMessage = useCallback(
    async (message: any) => {
      if (isProcessingRef.current) {
        pendingUpdateRef.current = message;
        return;
      }

      isProcessingRef.current = true;

      try {
        const numPoints = message.width * message.height;
        const nextBuffer = activeBuffer === 0 ? 1 : 0;

        // Allocate or resize buffers
        if (
          !positionBuffersRef.current[nextBuffer] ||
          positionBuffersRef.current[nextBuffer]!.length < numPoints * 3
        ) {
          positionBuffersRef.current[nextBuffer] = new Float32Array(
            numPoints * 3
          );
          colorBuffersRef.current[nextBuffer] = new Float32Array(numPoints * 3);
        }

        const positions = positionBuffersRef.current[nextBuffer]!;
        const colors = colorBuffersRef.current[nextBuffer]!;

        // Use GPU or CPU processing
        if (processorRef.current) {
          await processorRef.current.processPointCloud(
            message,
            positions,
            colors
          );
        } else {
          cpuParsePointCloud(message, positions, colors);
        }

        // Update geometry with new buffer
        if (geometryRef.current) {
          geometryRef.current.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
          );
          geometryRef.current.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3)
          );
          geometryRef.current.computeBoundingSphere();
          geometryRef.current.attributes.position.needsUpdate = true;
          geometryRef.current.attributes.color.needsUpdate = true;
        }

        setActiveBuffer(nextBuffer);
      } catch (err) {
        console.error("Error processing point cloud:", err);
      } finally {
        isProcessingRef.current = false;

        // Process any pending update
        if (pendingUpdateRef.current) {
          const pending = pendingUpdateRef.current;
          pendingUpdateRef.current = null;
          processMessage(pending);
        }
      }
    },
    [activeBuffer]
  );

  // Subscribe to point cloud messages
  useEffect(() => {
    if (!subscription || !subscription.subscriber || !subscription.enabled) {
      return;
    }

    const handleMessage = (message: any) => {
      // With GPU processing, we remove throttling entirely
      // The double-buffering and pending update mechanism handles flow control
      // For CPU fallback, maintain a modest throttle for performance
      if (!processorRef.current) {
        const now = Date.now();
        const throttleMs = 100; // 10Hz for CPU fallback
        if (now - lastUpdateRef.current < throttleMs) {
          return;
        }
        lastUpdateRef.current = now;
      }

      processMessage(message);
    };

    subscription.subscriber.subscribe(handleMessage);

    return () => {
      subscription.subscriber?.unsubscribe();
    };
  }, [subscription, processMessage]);

  // Create geometry
  useEffect(() => {
    geometryRef.current = new THREE.BufferGeometry();

    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
    };
  }, []);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: subscription?.size || 0.01,
      vertexColors: true,
      sizeAttenuation: true,
    });
  }, [subscription?.size]);

  if (!subscription || !subscription.enabled || !geometryRef.current) {
    return null;
  }

  return (
    <points
      ref={pointsRef}
      geometry={geometryRef.current}
      material={material}
    />
  );
}

export function PointCloudManager() {
  const pointCloudSubscriptions = use3DVisStore(
    (state) => state.pointCloudSubscriptions
  );
  const topics = Array.from(pointCloudSubscriptions.keys());

  return (
    <group>
      {topics.map((topic) => (
        <PointCloudRenderer key={topic} topic={topic} />
      ))}
    </group>
  );
}
