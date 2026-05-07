import { EventEmitter } from "node:events";

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();
eventBus.setMaxListeners(0);
