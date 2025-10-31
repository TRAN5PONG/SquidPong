// src/lib/Zeroact/core/render.ts
import { setWorkInProgress } from './fiber';

export function render(element: any, container: HTMLElement): void {
  setWorkInProgress(element, container);
}