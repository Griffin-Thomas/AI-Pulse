import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";

/**
 * Hook for listening to Tauri events with automatic cleanup
 */
export function useEventListener<T>(
  eventName: string,
  handler: (payload: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    let unmounted = false;
    let unlisten: UnlistenFn | undefined;

    listen<T>(eventName, (event) => {
      handler(event.payload);
    }).then((fn) => {
      if (unmounted) {
        fn();
      } else {
        unlisten = fn;
      }
    });

    return () => {
      unmounted = true;
      unlisten?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, ...deps]);
}
