import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";

function useSessionStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      if (typeof window === "undefined") {
        console.warn(`Tried setting sessionStorage key "${key}" even though environment is not a client`);
        return;
      }
      try {
        setStoredValue((currentValue) => {
          const newValue = value instanceof Function ? value(currentValue) : value;
          window.sessionStorage.setItem(key, JSON.stringify(newValue));
          return newValue;
        });
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key]
  );

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue];
}

export default useSessionStorage;
