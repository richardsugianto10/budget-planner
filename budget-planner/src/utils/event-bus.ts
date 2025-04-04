import mitt from 'mitt'

// Create event emitter instance
export const emitter = mitt()

// Type-safe event emitter definition
export const defineEmitter = () => emitter 