declare module 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs' {
  const FilesetResolver: {
    forVisionTasks(wasm: string): Promise<any>;
  };
  const FaceLandmarker: {
    createFromOptions(vision: any, options: any): Promise<any>;
  };
  export { FilesetResolver, FaceLandmarker };
}
